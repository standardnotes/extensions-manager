import React from 'react';
import Repo from "../models/Repo.js";
import RepoController from "../lib/RepoController.js";
import BridgeManager from "../lib/BridgeManager.js";

export default class InstallRepo extends React.Component {

  constructor(props) {
    super(props);
    this.state = {url: ""};
  }

  installProLink(url) {
    var decoded;
    try {
      // base64 decode
      decoded = atob(url);
    } catch (e) {}

    if(decoded) {
      url = decoded;
    }

    BridgeManager.get().installRepoUrl(url);
    this.setState({url: ""});
  }

  handleKeyPress = (e) => {
    if(e.key === 'Enter') {
      this.installProLink(this.state.url);
    }
  }

  handleChange = (event) => {
    this.setState({url: event.target.value});
  }

  submitUrl = () => {
    this.installProLink(this.state.url);
  }

  render() {
    return (
      <div id="install-repo" className="sk-panel-section">
        <div className="sk-panel-row centered">
          <div className="sk-h2"><strong>Enter Your Extended Activation Code</strong></div>
        </div>
        <div className="sk-notification contrast dashed one-line">
          <input
            className="sk-input clear center-text"
            placeholder="Enter Extended Code"
            type="url"
            value={this.state.url}
            onKeyPress={this.handleKeyPress}
            onChange={this.handleChange}
          />
        </div>

        {this.state.url && this.state.url.length > 0 &&
          <div id="submit-button" className="sk-panel-row centered">
            <a onClick={this.submitUrl} className="sk-button success big">
              <div className="sk-label">
                Submit Code
              </div>
            </a>
          </div>
        }

        <div className="sk-panel-row centered">
          <div className="sk-h1 center-text">
            <strong className="info">Standard Notes Extended</strong> gives you access to powerful editors, extensions, tools, themes, and cloud backup options.
          </div>
        </div>
        <div className="sk-panel-row" />
        <div className="sk-panel-row centered">
          <a href="https://standardnotes.org/extensions" target="_blank" className="sk-button info featured">
            <div className="sk-label">
              Learn More
            </div>
          </a>
        </div>
      </div>
    )
  }

}
