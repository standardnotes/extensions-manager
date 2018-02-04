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
      <div className="panel-section no-bottom-pad">
          <div className="horizontal-group">
            <a onClick={this.toggleForm} className="info">Import Extension</a>
          </div>

          {this.state.success &&
            <div className="panel-row justify-right">
              <p className="success">Extension successfully installed.</p>
            </div>
          }

          {this.state.showForm &&
            <div className="panel-row">
              <input
                className=""
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
            <div className="notification info panel-row justify-left" style={{textAlign: "center"}}>
              <div className="panel-column stretch">
                <h2 className="title">Confirm Installation</h2>

                <div className="panel-row centered">
                  <div>
                    <p><strong>Name: </strong></p>
                    <p>{packageDetails.name}</p>
                  </div>
                </div>

                <div className="panel-row centered">
                  <div>
                    <p><strong>Description: </strong></p>
                    <p>{packageDetails.description}</p>
                  </div>
                </div>

                {packageDetails.version &&
                  <div className="panel-row centered">
                    <div>
                      <p><strong>Version: </strong></p>
                      <p>{packageDetails.version}</p>
                    </div>
                  </div>
                }

                <div className="panel-row centered">
                  <div>
                    <p><strong>Hosted URL: </strong></p>
                    <p>{packageDetails.url}</p>
                  </div>
                </div>

                {packageDetails.download_url &&
                  <div className="panel-row centered">
                    <div>
                      <p><strong>Download URL: </strong></p>
                      <p>{packageDetails.download_url}</p>
                    </div>
                  </div>
                }

                <div className="panel-row centered">
                  <div>
                    <p><strong>Extension Type: </strong></p>
                    <p>{extType}</p>
                  </div>
                </div>

                <div className="panel-row centered">
                  <div onClick={this.confirmInstallation} className="button info">
                    <div className="label">Install</div>
                  </div>
                </div>
                <div className="panel-row centered">
                  <a className="danger" onClick={this.cancelInstallation}>Cancel</a>
                </div>
              </div>
            </div>
          }

      </div>
    )
  }

}
