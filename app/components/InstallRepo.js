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
    /*

    .panel-section
                    %h3.title Update Account
                    %p Fill out the form below to update your email address and password.
                    .panel-row.panel-form.half
                      .column
                        %input{"placeholder" => "Email"}
                        %input{"placeholder" => "Password", "type" => "password"}

    */
    return (
      <div id="install-repo" className="panel-section">
        <h3 className="title panel-row">Install ProLink</h3>
        <div className="panel-row panel-form ">
          <div className="panel-column">
            <input
              placeholder="Enter ProLink URL"
              type="url"
              value={this.state.url}
              onKeyPress={this.handleKeyPress}
              onChange={this.handleChange}
            />
          </div>
        </div>
      </div>
    )
  }

}
