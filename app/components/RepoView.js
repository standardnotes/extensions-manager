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
    this.repoController.getPackages((packages) => {
      this.setState({packages: packages});
    })

    BridgeManager.get().addUpdateObserver(() => {
      console.log("RepoView update observer");
      this.forceUpdate();
    })
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
    return (
      <div>
        <p>Packages:</p>
        <div>
          {this.state.packages.map((p, index) =>
            <PackageView key={index} packageInfo={p} />
          )}
        </div>
      </div>
    )
  }

}
