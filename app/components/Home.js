import React from 'react';
import Repo from "../models/Repo.js";
import RepoView from "./RepoView.js";
import BridgeManager from "../lib/BridgeManager.js";
import InstallRepo from "./InstallRepo";

export default class Home extends React.Component {

  constructor(props) {
    super(props);
    this.state = {repos: []};

    BridgeManager.get().initiateBridge(() => {
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
      <div id="home" className="repos">
        {this.state.repos.map((repo, index) =>
          <RepoView key={index} repo={repo} />
        )}
        <InstallRepo />
      </div>
    )
  }

}
