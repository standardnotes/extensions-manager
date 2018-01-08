import React from 'react';
import Repo from "../models/Repo.js";
import RepoView from "./RepoView.js";
import BridgeManager from "../lib/BridgeManager.js";
import InstallRepo from "./InstallRepo";
import ManageInstalled from "./ManageInstalled";
import Advanced from "./Advanced";

export default class Home extends React.Component {

  constructor(props) {
    super(props);
    this.state = {repos: []};

    BridgeManager.get().initiateBridge(() => {
      this.setState({ready: true});
      this.reload();
    });

    BridgeManager.get().addUpdateObserver(() => {
      this.reload();
    })
  }

  reload() {
    var repos = BridgeManager.get().installedRepos;
    console.log("Repos", repos);
    this.setState({repos: repos});
  }

  render() {
    return (
      <div id="home" className="panel static">
        <div className="content">
          {this.state.repos.map((repo, index) =>
            <RepoView key={index} repo={repo} />
          )}
          {this.state.ready && this.state.repos.length == 0 &&
            <InstallRepo />
          }
          <ManageInstalled />
          <Advanced />
        </div>
      </div>
    )
  }

}
