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
    BridgeManager.get().updateComponent(this.component);
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
    let packageInfo = this.state.packageInfo || (this.component.content.package_info || this.component.content);
    let component = this.component;
    var showOpenOption = component && ["rooms", "modal"].includes(component.content.area);
    var showActivateOption = component && ["SN|Theme", "SN|Component"].includes(component.content_type) && !showOpenOption && !["editor-editor"].includes(component.content.area);

    if(component && BridgeManager.get().getSelfComponentUUID() == component.uuid) {
      // Is Extensions Manager (self)
      showOpenOption = false, showActivateOption = false;
    }

    var updateAvailable = false, installedVersion;
    var isDesktop = BridgeManager.get().localComponentInstallationAvailable();
    var componentPackageInfo = component && component.content.package_info;

    // Server based and action extensions do not neccessarily need to have package info, as they are fully hosted.
    // We use this flag to hide the "Unable to find package info" error
    let shouldHavePackageInfo = component && !["SF|Extension", "Extension"].includes(component.content_type);

    let installError = component && BridgeManager.get().getItemAppDataValue(component, "installError");

    // Whether this package support local installation
    let localInstallable = packageInfo.download_url;

    let isComponentActive = component && component.content.active;

    if(isDesktop && componentPackageInfo && localInstallable && componentPackageInfo.version) {
      var latestVersion = packageInfo.version;
      try {
        let latestPackageInfo = BridgeManager.get().latestPackageInfoForComponent(component);
        if(latestPackageInfo) { latestVersion = latestPackageInfo.version; }
        installedVersion = componentPackageInfo.version;
        updateAvailable = compareVersions(latestVersion, installedVersion) == 1;
      } catch (e) {
        console.log("Error comparing versions for", packageInfo);
      }
    }

    // Legacy server extensions without name
    if(component && !component.content.name && component.content_type == "SF|Extension") {
      var name = BridgeManager.get().nameForNamelessServerExtension(component);
      if(name) {
        component.content.name = name;
      }
    }

    let displayName = component ? component.content.name : packageInfo.name;

    return [
        <div className="sk-panel-table-item-content">
          <div className="sk-panel-table-item-column stretch">
            {packageInfo.thumbnail_url && !this.props.hideMeta &&
              <img src={packageInfo.thumbnail_url} />
            }

            <input
              ref={(input) => { this.nameInput = input; }}
              type="text"
              className="sk-panel-row disguised name-input sk-input sk-label"
              disabled={!this.state.rename}
              value={this.state.renameValue || displayName}
              onKeyPress={this.handleKeyPress}
              onChange={this.handleChange}
            />

            {component && installError &&
              <div className="sk-notification warning package-notification">
                <div className="sk-notification-text">
                  Error installing locally: {installError.tag} {packageInfo.download_url}
                </div>
              </div>
            }

            {component && !componentPackageInfo && shouldHavePackageInfo &&
              <div className="sk-notification neutral package-notification" onClick={() => {this.setState({componentWarningExpanded: !this.state.componentWarningExpanded})}}>
                <div className="sk-notification-text">
                  Unable to find corresponding package information.
                  {this.state.componentWarningExpanded
                    ? <span> Please uninstall this extension, then reinstall to enable local installation and updates.</span>
                    : null
                  }
                </div>
              </div>
            }

            {!this.props.hideMeta &&
              <div className="sk-panel-row">
                <div className="sk-p">{packageInfo.description}</div>
              </div>
            }
          </div>
        </div>,

        <div className="sk-panel-table-item-footer">
          <div className="sk-segmented-buttons">
            {!component &&
              <div className="sk-button info" onClick={this.togglePackageInstallation}>
                <div className="sk-label">
                  Install
                </div>
              </div>
            }

            {showOpenOption &&
              <div className="sk-button success" onClick={this.openComponent}>
                <div className="sk-label">
                  Open
                </div>
              </div>
            }

            {showActivateOption &&

              <div className={"sk-button " + (isComponentActive ? "warning" : "success")} onClick={this.openComponent}>
                <div className="sk-label">
                  {isComponentActive ? "Deactivate" : "Activate"}
                </div>
              </div>
            }

            {isDesktop && updateAvailable &&
              <div className="sk-button info" onClick={this.updateComponent}>
                <div className="sk-label">
                  Update
                </div>
              </div>
            }

            {component &&
              <div className="sk-button danger" onClick={this.togglePackageInstallation}>
                <div className="sk-label">
                  Uninstall
                </div>
              </div>
            }

            {component && componentPackageInfo &&
              <div className="sk-button contrast" onClick={this.toggleOptions}>
                <div className="sk-label">
                  •••
                </div>
              </div>
            }

            {packageInfo.marketing_url &&
              <div className="sk-button contrast" onClick={() => {this.openUrl(packageInfo.marketing_url)}}>
                <div className="sk-label">
                  Info
                </div>
              </div>
            }
          </div>

          {this.state.showOptions && component &&
            <div className="sk-notification contrast item-advanced-options">
              {isDesktop && localInstallable &&
                <div>
                  {component &&
                    <div className="sk-p sk-panel-row">Installed Version: {installedVersion}</div>
                  }
                  <div className="sk-p sk-panel-row">Latest Version: {latestVersion}</div>
                </div>
              }

              {localInstallable &&
                <div>
                  <label className="sk-label">
                    <input disabled={!localInstallable} checked={localInstallable && !component.content.autoupdateDisabled} onChange={() => {this.toggleComponentOption('autoupdateDisabled')}} type="checkbox" />
                    Autoupdate local installation
                  </label>

                  <label className="sk-label">
                    <input disabled={!localInstallable} checked={localInstallable && !component.content.offlineOnly} onChange={() => {this.toggleComponentOption('offlineOnly')}} type="checkbox" />
                    Use hosted when local is unavailable
                  </label>
                </div>
              }

              {!localInstallable &&
                <div className="sk-p sk-panel-row">This extension does not support local installation.</div>
              }


              <a className="info sk-a sk-panel-row" onClick={this.toggleRename}>{this.state.rename ? 'Press enter to submit' : 'Rename'}</a>
            </div>
          }
        </div>
    ]
  }

}
