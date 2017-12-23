import React from 'react';
import Repo from "../models/Repo.js";
import RepoController from "../lib/RepoController.js";
import BridgeManager from "../lib/BridgeManager.js";

export default class PackageView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {packageInfo: props.packageInfo};
  }

  get installationInfo() {
    let installedHosted = BridgeManager.get().isPackageInstalledHosted(this.packageInfo);
    let installedLocal = BridgeManager.get().isPackageInstalledLocal(this.packageInfo);
    return {
      installedHosted: installedHosted,
      installedLocal: installedLocal
    };
  }

  componentWillReceiveProps(nextProps) {

  }

  get packageInfo() {
    return this.state.packageInfo;
  }

  togglePackageInstallation = () => {
    if(BridgeManager.get().isPackageInstalledHosted(this.packageInfo)) {
      BridgeManager.get().uninstallPackageHosted(this.packageInfo);
    } else {
      BridgeManager.get().installPackageHosted(this.packageInfo);
    }
  }

  togglePackageLocalInstallation = () => {
    if(BridgeManager.get().isPackageInstalledLocal(this.packageInfo)) {
      BridgeManager.get().uninstallPackageOffline(this.packageInfo);
    } else {
      BridgeManager.get().installPackageOffline(this.packageInfo);
    }
  }

  openComponent = () => {
    BridgeManager.get().sendOpenEvent(this.packageInfo);
  }

  render() {
    let p = this.state.packageInfo;
    let status = this.installationInfo;
    let component = BridgeManager.get().itemForPackage(p);
    let installed = status.installedHosted || status.installedLocal;
    let hasLocalOption = p.download_url != null;
    let showOpenOption = installed && component && ["rooms", "modal"].includes(component.content.area);

    return (
      <div>
        <p><strong>{p.name}</strong></p>

        <button onClick={this.togglePackageInstallation}>
          {status.installedHosted ? "Uninstall" : "Install"}
        </button>

        {hasLocalOption &&
          <button onClick={this.togglePackageLocalInstallation}>
            {status.installedLocal ? "Uninstall Offline" : "Install Offline"}
          </button>
        }

        {showOpenOption &&
          <button onClick={this.openComponent}>
            Open
          </button>
        }

      </div>
    )
  }

}
