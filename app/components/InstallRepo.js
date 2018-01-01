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

  render() {
    return (
      <div id="install-repo">
        <h3>Install ProLink</h3>
        <input
          placeholder="Enter ProLink URL"
          type="url"
          value={this.state.url}
          onKeyPress={this.handleKeyPress}
          onChange={this.handleChange}
        />
      </div>
    )
  }

}
