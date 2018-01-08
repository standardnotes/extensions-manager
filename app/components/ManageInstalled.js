import React from 'react';
import BridgeManager from "../lib/BridgeManager.js";

export default class ManageInstalled extends React.Component {

  constructor(props) {
    super(props);

    BridgeManager.get().addUpdateObserver(() => {
      console.log("ManageInstalled update observer");
      this.reload();
    })
  }

  reload() {
    this.forceUpdate();
  }

  uninstallExt = (ext) => {
    BridgeManager.get().uninstallComponent(ext);
  }

  renameExt = (ext) => {

  }

  render() {
    var extensions = BridgeManager.get().allInstalled();
    return (
      <div className="panel-section no-border">

        <div className="panel-row">
          <h3 className="title">Installed Extensions ({extensions.length})</h3>
        </div>

        {extensions.map((ext, index) =>
          <div key={ext.uuid} className="panel-row border-bottom default-padding">
            <div className="panel-column">
                <h4 className="title">{ext.content.name}</h4>
            </div>

            <div className="panel-column">
              <div className="horizontal-group right-aligned">
                <a onClick={() => {this.renameExt(ext)}} className="info">Rename</a>
                <a onClick={() => {this.uninstallExt(ext)}} className="danger">Uninstall</a>
              </div>
            </div>
          </div>
        )}

      </div>
    )
  }

}
