import React from 'react';
import Repo from "../models/Repo.js";
import RepoView from "./RepoView.js";
import BridgeManager from "../lib/BridgeManager.js";
import InstallRepo from "./InstallRepo";
import Advanced from "./Advanced";
import ManageInstalled from "./ManageInstalled";

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
    this.setState({repos: repos});

    if(repos.length > 0 && !BridgeManager.get().didBeginStreaming()) {
      BridgeManager.get().beginStreamingItems();
    }
  }

  render() {
    return (
      <div id="home" className="panel static">
        <div className="content">
          <ManageInstalled />
          {this.state.repos.map((repo, index) =>
            <RepoView key={index} repo={repo} />
          )}
          {this.state.ready && this.state.repos.length == 0 &&
            <InstallRepo />
          }
        </div>

        <div className="footer">
          <div className="right">
            <Advanced />
          </div>
        </div>
      </div>
    )
  }

}
