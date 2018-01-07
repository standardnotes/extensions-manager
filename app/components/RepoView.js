import React from 'react';
import Repo from "../models/Repo.js";
import RepoController from "../lib/RepoController.js";
import BridgeManager from "../lib/BridgeManager.js";
import PackageView from "./PackageView";

export default class RepoView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {packages: []};

    this.repoController = new RepoController({repo: props.repo});
    this.repoController.getPackages((packages, error) => {
      if(!error) {
        console.log("Setting packages", packages);
        this.setState({packages: packages});
      }
    })

    BridgeManager.get().addUpdateObserver(() => {
      console.log("RepoView update observer");
      this.reload();
    })
  }

  reload() {
    this.forceUpdate();
  }

  togglePackageInstallation(aPackage) {
    if(BridgeManager.get().isPackageInstalledHosted(aPackage)) {
      BridgeManager.get().uninstallPackageHosted(aPackage);
    } else {
      BridgeManager.get().installPackageHosted(aPackage);
    }
  }

  togglePackageLocalInstallation(aPackage) {
    if(BridgeManager.get().isPackageInstalledLocal(aPackage)) {
      BridgeManager.get().uninstallPackageOffline(aPackage);
    } else {
      BridgeManager.get().installPackageOffline(aPackage);
    }
  }

  toggleOptions = () => {
    this.setState({showOptions: !this.state.showOptions});
  }

  deleteRepo = () => {
    if(confirm("Are you sure you want to delete this ProLink repository?")) {
      BridgeManager.get().uninstallRepo(this.props.repo);
    }
  }

  render() {
    return (
      <div className="panel-section">
        <div className="panel-row">
          <h3 className="title">ProLink Repository</h3>
          <a onClick={this.toggleOptions} className="info">Options</a>
        </div>

        {this.state.showOptions &&
            <div className="panel-row">
              <a onClick={this.deleteRepo} className="danger">Delete</a>
            </div>
        }

        <div className="panel-row">
          <div className="packages panel-table">
            {this.state.packages.map((p, index) =>
              <div className="table-item">
                <PackageView key={index} packageInfo={p} />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

}
