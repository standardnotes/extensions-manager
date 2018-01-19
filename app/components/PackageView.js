import React from 'react';
import Repo from "../models/Repo.js";
import RepoController from "../lib/RepoController.js";
import BridgeManager from "../lib/BridgeManager.js";
var compareVersions = require('compare-versions');

export default class PackageView extends React.Component {

  constructor(props) {
    super(props);

    this.state = {packageInfo: props.packageInfo, component: props.component};
  }

  get packageInfo() {
    return this.state.packageInfo;
  }

  togglePackageInstallation = () => {
    if(this.props.component) {
      BridgeManager.get().uninstallComponent(this.props.component);
    } else {
      if(BridgeManager.get().isPackageInstalled(this.packageInfo)) {
        BridgeManager.get().uninstallPackage(this.packageInfo);
      } else {
        BridgeManager.get().installPackage(this.packageInfo);
      }
    }
  }

  openComponent = () => {
    BridgeManager.get().toggleOpenEvent(this.component);
  }

  updateComponent = () => {
    BridgeManager.get().installPackageOffline(this.packageInfo);
  }

  openUrl = (url) => {
    var win = window.open(url, '_blank');
    win.focus();
  }

  get component() {
    return this.props.component || BridgeManager.get().itemForPackage(this.props.packageInfo)
  }

  render() {
    let p = this.state.packageInfo || (this.component.content.package_info || this.component.content);
    let component = this.component;
    let showOpenOption = component && ["rooms", "modal"].includes(component.content.area);
    let showActivateOption = component && ["SN|Theme", "SN|Component"].includes(component.content_type) && !showOpenOption && !["editor-editor"].includes(component.content.area);
    var updateAvailable = false, installedVersion;
    var localInstallPossible = BridgeManager.get().localComponentInstallationAvailable();

    if(localInstallPossible && component && component.content.package_info.version) {
      installedVersion = component.content.package_info.version;
      updateAvailable = compareVersions(p.version, installedVersion) == 1;
    }

    return [
        <div className="item-content">
          <div className="item-column">
            {p.thumbnail_url && !this.props.hideMeta &&
              <img src={p.thumbnail_url} />
            }

            <h4><strong>{p.name}</strong></h4>

            {!this.props.hideMeta &&
              <p>{p.description}</p>
            }

            {localInstallPossible &&
              <p>Latest Version: {p.version}</p>

              [component &&
                <p>Installed Version: {installedVersion}</p>
              ]
            }
          </div>
        </div>,

        <div className="item-footer">
          <div className="button-group">
            {!component &&
              <div className="button info" onClick={this.togglePackageInstallation}>
                Install
              </div>
            }

            {showOpenOption &&
              <div className="button success" onClick={this.openComponent}>
                Open
              </div>
            }

            {showActivateOption &&

              <div className={"button " + (component.content.active ? "warning" : "success")} onClick={this.openComponent}>
                {component.content.active ? "Deactivate" : "Activate"}
              </div>
            }

            {localInstallPossible && updateAvailable &&
              <div className="button info" onClick={this.updateComponent}>
                Update
              </div>
            }

            {component &&
              <div className="button danger" onClick={this.togglePackageInstallation}>
                Uninstall
              </div>
            }

            {p.marketing_url &&
              <div className="button default" onClick={() => {this.openUrl(p.marketing_url)}}>
                Info
              </div>
            }
          </div>
        </div>
    ]
  }

}
