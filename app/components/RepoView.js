import React from 'react';
import RepoController from "../lib/RepoController.js";
import BridgeManager from "../lib/BridgeManager.js";
import PackageView from "./PackageView";

export default class RepoView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {packages: []};

    this.needsUpdateComponents = true;

    this.repoController = new RepoController({repo: props.repo});
    this.refreshRepo();

    this.updateObserver = BridgeManager.get().addUpdateObserver(() => {
      this.receivedBridgeItems = true;
      if(this.needsUpdateComponents && this.state.packages.length > 0) {
        this.updateComponentsWithNewPackageInfo();
      }
      this.reload();
    })
  }

  refreshRepo() {
    BridgeManager.get().notifyEvent(BridgeManager.EventDownloadingPackages);
    this.repoController.getPackages((response) => {
      BridgeManager.get().notifyEvent(BridgeManager.EventDoneDownloadingPackages);
      if(response) {
        var packages = response.packages;
        var valid_until = new Date(response.valid_until);
        BridgeManager.get().notifyEvent(BridgeManager.EventUpdatedValidUntil, {valid_until});
        BridgeManager.get().registerPackages(packages);
        this.setState({packages: packages || []});
        if(this.receivedBridgeItems) {
          this.updateComponentsWithNewPackageInfo();
        }
      }
    })
  }

  updateComponentsWithNewPackageInfo() {
    this.needsUpdateComponents = false;
    // Update expiration dates for packages
    var needingSave = []
    for(let packageInfo of this.state.packages) {
      let installed = BridgeManager.get().itemForPackage(packageInfo);
      if(installed) {
        var needsSave = false;
        let validUntil = new Date(packageInfo.valid_until);
        // .getTime() must be used to compare dates
        if(packageInfo.valid_until && (!installed.content.valid_until || (installed.content.valid_until.getTime() !== validUntil.getTime()))) {
          installed.content.valid_until = validUntil;
          needsSave = true;
        }


        /*
        As part of the below condition, we used to also have if(JSON.stringify(installed.content.package_info) !== JSON.stringify(packageInfo))
        to copy over package info. However, if the repo updates a version, then the installed component's version would also update without
        */
        if(!installed.content.package_info) {
          installed.content.package_info = packageInfo;
          needsSave = true;
        }

        if(needsSave) {
          needingSave.push(installed);
        }
      }
    }

    if(needingSave.length > 0) {
      BridgeManager.get().saveItems(needingSave);
    } else {
      BridgeManager.get().notifyObserversOfUpdate();
    }
  }

  componentWillUnmount() {
    BridgeManager.get().removeUpdateObserver(this.updateObserver);
  }

  reload() {
    this.forceUpdate();
  }

  toggleOptions = () => {
    this.setState({showOptions: !this.state.showOptions});
  }

  deleteRepo = () => {
    if(confirm("Are you sure you want to delete this repository?")) {
      BridgeManager.get().uninstallRepo(this.props.repo);
    }
  }

  render() {
    return (
      <div className="sk-panel-section">

        <div className="sk-panel-section">
          <div className="sk-panel-row">
            <div className="sk-panel-section-title info sk-bold">Repository</div>
          </div>

          <a onClick={this.toggleOptions} className="info">Options</a>
          {this.state.showOptions &&
            <div className="sk-panel-row">
              <a onClick={this.deleteRepo} className="danger sk-a">Delete Repository</a>
            </div>
          }
        </div>

        <div className="sk-panel-row">
          <div className="packages sk-panel-table">
            {this.state.packages.map((p, index) =>
              <div className="package sk-panel-table-item">
                <PackageView repo={this.props.repo} key={p.identifier} packageInfo={p} />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

}
