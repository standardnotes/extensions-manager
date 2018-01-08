import React from 'react';
import BridgeManager from "../lib/BridgeManager.js";

export default class Advanced extends React.Component {

  constructor(props) {
    super(props);

    BridgeManager.get().addUpdateObserver(() => {
      this.reload();
    })
  }

  reload() {
    this.forceUpdate();
  }

  uninstallExt = (ext) => {
  }


  render() {
    var extensions = BridgeManager.get().allInstalled();
    return (
      <div className="panel-section">
        <div className="panel-row">
          <div className="panel-column">
            <div className="horizontal-group">
              <a onClick={() => {this.renameExt(ext)}} className="info">Advanced</a>
            </div>
          </div>
        </div>
      </div>
    )
  }

}
