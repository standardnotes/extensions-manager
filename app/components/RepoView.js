import React from 'react';
import Repo from "../models/Repo.js";
import RepoController from "../lib/RepoController.js";
import BridgeManager from "../lib/BridgeManager.js";

export default class RepoView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {packages: []};
    this.repoController = new RepoController({repo: props.repo});
    this.repoController.getPackages((packages) => {
      this.setState({packages: packages});
    })

    BridgeManager.get().addUpdateObserver(() => {
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
            <div key={index}>
              <p><strong>{p.name}</strong></p>

              <button onClick={() => this.togglePackageInstallation(p)}>
                {BridgeManager.get().isPackageInstalledHosted(p) ? "Uninstall Hosted" : "Install Hosted"}
              </button>

              <button onClick={() => this.togglePackageLocalInstallation(p)}>
                {BridgeManager.get().isPackageInstalledLocal(p) ? "Uninstall Offline" : "Install Offline"}
              </button>

            </div>
          )}
        </div>
      </div>
    )
  }

}
