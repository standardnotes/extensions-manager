import React from 'react';
import BridgeManager from "../lib/BridgeManager.js";
import ManageInstalled from "./ManageInstalled";

export default class Advanced extends React.Component {

  constructor(props) {
    super(props);
    this.state = {extensionUrl: "", showForm: false}

    this.updateObserver = BridgeManager.get().addUpdateObserver(() => {
      this.reload();
    })
  }

  componentWillUnmount() {
    BridgeManager.get().removeUpdateObserver(this.updateObserver);
  }

  reload() {
    this.forceUpdate();
  }

  toggleForm = () => {
    this.setState({showForm: !this.state.showForm, success: false});
  }

  downloadPackage(url) {
    try {
      var decoded = window.atob(url);
      if(decoded) {
        url = decoded;
      }
    } catch (e) {}
    BridgeManager.get().downloadPackageDetails(url, (response) => {
      if(response.content_type == "SN|Repo") {
        BridgeManager.get().installRepoUrl(url);
      } else {
        this.setState({packageDetails: response});
      }
    });
  }

  confirmInstallation = () => {
    BridgeManager.get().installPackage(this.state.packageDetails, (installed) => {
      this.setState({url: installed ? null : this.state.url, showForm: !installed, success: installed, packageDetails: null});
    })
  }

  cancelInstallation = () => {
    this.setState({packageDetails: null, showForm: false, url: null});
  }

  handleInputChange = (event) => {
    this.setState({url: event.target.value});
  }

  handleKeyPress = (e) => {
    if(e.key === 'Enter') {
      this.downloadPackage(this.state.url);
    }
  }

  handleInputChange = (event) => {
    this.setState({url: event.target.value});
  }

  render() {
    var extensions = BridgeManager.get().allInstalled();
    var extType, packageDetails = this.state.packageDetails;
    if(packageDetails) {
      extType = BridgeManager.get().humanReadableTitleForExtensionType(packageDetails.content_type);
    }
    return (
      <div className="sk-panel-section no-bottom-pad">
          <div className="sk-horizontal-group">
            <a onClick={this.toggleForm} className="info">Import Extension</a>
          </div>

          {this.state.success &&
            <div className="sk-panel-row justify-right">
              <div className="sk-p success">Extension successfully installed.</div>
            </div>
          }

          {this.state.showForm &&
            <div className="sk-panel-row">
              <input
                className="sk-input contrast"
                placeholder={"Enter Extension Link"}
                type="url"
                autoFocus={true}
                value={this.state.url}
                onKeyPress={this.handleKeyPress}
                onChange={this.handleInputChange}
              />
            </div>
          }

          {packageDetails &&
            <div className="sk-notification info sk-panel-row justify-left" style={{textAlign: "center"}}>
              <div className="sk-panel-column stretch">
                <h2 className="title">Confirm Installation</h2>

                <div className="sk-panel-row centered">
                  <div>
                    <div className="sk-p"><strong>Name: </strong></div>
                    <div className="sk-p">{packageDetails.name}</div>
                  </div>
                </div>

                <div className="sk-panel-row centered">
                  <div>
                    <div className="sk-p"><strong>Description: </strong></div>
                    <div className="sk-p">{packageDetails.description}</div>
                  </div>
                </div>

                {packageDetails.version &&
                  <div className="sk-panel-row centered">
                    <div>
                      <div className="sk-p"><strong>Version: </strong></div>
                      <div className="sk-p">{packageDetails.version}</div>
                    </div>
                  </div>
                }

                <div className="sk-panel-row centered">
                  <div>
                    <div className="sk-p"><strong>Hosted URL: </strong></div>
                    <div className="sk-p">{packageDetails.url}</div>
                  </div>
                </div>

                {packageDetails.download_url &&
                  <div className="sk-panel-row centered">
                    <div>
                      <div className="sk-p"><strong>Download URL: </strong></div>
                      <div className="sk-p">{packageDetails.download_url}</div>
                    </div>
                  </div>
                }

                <div className="sk-panel-row centered">
                  <div>
                    <div className="sk-p"><strong>Extension Type: </strong></div>
                    <div className="sk-p">{extType}</div>
                  </div>
                </div>


                <div className="sk-panel-row centered sk-horizontal-group">
                  <div onClick={this.cancelInstallation} className="sk-button neutral">
                    <div className="sk-label">Cancel</div>
                  </div>

                  <div onClick={this.confirmInstallation} className="sk-button sk-base">
                    <div className="sk-label">Install</div>
                  </div>
                </div>

              </div>
            </div>
          }

      </div>
    )
  }

}
