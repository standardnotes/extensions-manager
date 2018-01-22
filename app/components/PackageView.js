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

  toggleOptions = () => {
    this.setState({showOptions: !this.state.showOptions});
  }

  toggleRename = () => {
    this.setState((prevState) => {
      if(prevState.rename) {
        return {rename: false, renameValue: null};
      } else {
        return {rename: true, renameValue: this.component.content.name};
      }
    });

    setTimeout(() => {
      if(this.state.rename) {
        this.nameInput.focus();
        this.nameInput.select();
      }
    }, 10);
  }

  handleKeyPress = (e) => {
    if(e.key === 'Enter') {
      this.toggleRename();
      let name = this.state.renameValue;
      if(name.length > 0) {
        this.component.content.name = name;
        BridgeManager.get().saveItems([this.component]);
      }
    }
  }

  toggleComponentOption = (option) => {
    this.component.content[option] = !this.component.content[option];
    BridgeManager.get().saveItems([this.component]);
  }

  handleChange = (event) => {
    this.setState({renameValue: event.target.value});
  }

  get component() {
    return this.props.component || BridgeManager.get().itemForPackage(this.props.packageInfo)
  }

  render() {
    let p = this.state.packageInfo || (this.component.content.package_info || this.component.content);
    let component = this.component;
    var showOpenOption = component && ["rooms", "modal"].includes(component.content.area);
    var showActivateOption = component && ["SN|Theme", "SN|Component"].includes(component.content_type) && !showOpenOption && !["editor-editor"].includes(component.content.area);

    if(component && BridgeManager.get().getSelfComponentUUID() == component.uuid) {
      // Is Extensions Manager (self)
      showOpenOption = false, showActivateOption = false;
    }

    var updateAvailable = false, installedVersion;
    var localInstallPossible = BridgeManager.get().localComponentInstallationAvailable();
    var componentPackageInfo = component && component.content.package_info;

    if(localInstallPossible && componentPackageInfo && componentPackageInfo.version) {
      installedVersion = componentPackageInfo.version;
      updateAvailable = compareVersions(p.version, installedVersion) == 1;
    }

    // Legacy server extensions without name
    if(component && !component.content.name && component.content_type == "SF|Extension") {
      var name = BridgeManager.get().nameForNamelessServerExtension(component);
      if(name) {
        component.content.name = name;
      }
    }

    return [
        <div className="item-content">
          <div className="item-column stretch">
            {p.thumbnail_url && !this.props.hideMeta &&
              <img src={p.thumbnail_url} />
            }

            <input
              ref={(input) => { this.nameInput = input; }}
              type="text"
              className="disguised name-input"
              disabled={!this.state.rename}
              value={this.state.renameValue || p.name}
              onKeyPress={this.handleKeyPress}
              onChange={this.handleChange}
            />

            {component && !componentPackageInfo &&
              <div className="notification warning package-notification">
                <div className="text">Unable to find corresponding package information. Please uninstall this extension, then reinstall to enable local installation and updates.</div>
              </div>
            }

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

            {component && componentPackageInfo &&
              <div className="button default" onClick={this.toggleOptions}>
                •••
              </div>
            }

            {p.marketing_url &&
              <div className="button default" onClick={() => {this.openUrl(p.marketing_url)}}>
                Info
              </div>
            }
          </div>

          {this.state.showOptions &&
            <div className="item-advanced-options">
              <label>
                <input checked={!component.content.autoupdateDisabled} onChange={() => {this.toggleComponentOption('autoupdateDisabled')}} type="checkbox" />
                Autoupdate local installation
              </label>

              <label>
                <input checked={!component.content.offlineOnly} onChange={() => {this.toggleComponentOption('offlineOnly')}} type="checkbox" />
                Use hosted when local is unavailable
              </label>

              <a className="info" onClick={this.toggleRename}>{this.state.rename ? 'Press enter to submit' : 'Rename'}</a>
            </div>
          }
        </div>
    ]
  }

}
