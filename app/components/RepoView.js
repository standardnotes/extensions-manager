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

  render() {
    console.log("Rendering repo view for repo", this.props.repo);
    return (
      <div className="repo">
        <h3 className="repo-name">ProLink Repository</h3>
        <p className="repo-url">{this.props.repo.url}</p>
        <div className="packages">
          {this.state.packages.map((p, index) =>
            <div className="package">
              <PackageView key={index} packageInfo={p} />
            </div>
          )}
        </div>
      </div>
    )
  }

}
