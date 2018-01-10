import React from 'react';
import BridgeManager from "../lib/BridgeManager.js";
import ManageInstalled from "./ManageInstalled";

export default class Advanced extends React.Component {

  constructor(props) {
    super(props);
    this.state = {repoUrl: "", extensionUrl: "", showAdvanced: true}

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

  toggleAdvanced = () => {
    this.setState((prevState) => {
      return {showAdvanced: !prevState.showAdvanced}
    });
  }

  setInputType(type) {
    if(this.state.inputType == type) {
      // Close the panel
      this.setState({inputType: null});
    } else {
      this.setState({inputType: type});
    }
  }

  installRepo(url) {
    BridgeManager.get().installRepoUrl(url);
    this.setState({url: "", success: true});
  }

  installPackage(url) {
    BridgeManager.get().installPackageFromUrl(url, (installed) => {
      if(installed) {
        this.setState({url: "", success: installed});
      }
    });
  }

  handleInputChange = (event) => {
    this.setState({url: event.target.value});
  }

  handleKeyPress = (e) => {
    if(e.key === 'Enter') {
      if(this.state.inputType == "package") {
        this.installPackage(this.state.url);
      } else {
        this.installRepo(this.state.url);
      }
    }
  }

  handleInputChange = (event) => {
    this.setState({url: event.target.value});
  }

  toggleManage = () => {
    this.setState((prevState) => {
      return {showManage: !prevState.showManage}
    });
  }


  render() {
    var extensions = BridgeManager.get().allInstalled();
    return (
      <div className="panel-section no-bottom-pad">
          <div className="horizontal-group">
            <a onClick={() => {this.setInputType('repo')}} className="info">Import Repository</a>
            <a onClick={() => {this.setInputType('package')}} className="info">Import Extension</a>
          </div>

          {this.state.showAdvanced && this.state.inputType &&
            <div className="panel-row">
              <input
                className=""
                placeholder={this.state.inputType == 'package' ? "Enter Extension Link" : "Enter Repository Link"}
                type="url"
                value={this.state.url}
                onKeyPress={this.handleKeyPress}
                onChange={this.handleChange}
              />
            </div>
          }

      </div>
    )
  }

}
