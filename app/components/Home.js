import React from 'react';
import Repo from "../models/Repo.js";
import RepoView from "./RepoView.js";
import BridgeManager from "../lib/BridgeManager.js";

export default class Home extends React.Component {

  constructor(props) {
    super(props);

    BridgeManager.get().initiateBridge();

    this.repo = new Repo();
    this.repo.url = "http://localhost:3004/repos/";
  }

  render() {
    return (
      <div>
        <RepoView repo={this.repo} />
      </div>
    )
  }

}
