import ComponentManager from 'sn-components-api';

export default class BridgeManager {

  /* Singleton */
  static instance = null;
  static get() {
    if (this.instance == null) { this.instance = new BridgeManager(); }
    return this.instance;
  }

  constructor(onReceieveItems) {
    this.updateObservers = [];
    this.items = [];
  }

  initiateBridge() {
    var permissions = [
      {
        // name: "stream-context-item"
        name: "stream-items",
        content_types: ["SN|Component", "SN|Theme", "SF|Extension"]
      }
    ]

    this.componentManager = new ComponentManager(permissions, function(){
      console.log("Prolink Ready");
      // on ready
    });

    this.componentManager.streamItems(["SN|Component", "SN|Theme", "SF|Extension"], (items) => {
      console.log("Prolink received items", items);
      for(var item of items) {
        if(item.deleted) {
          this.items.splice(this.items.indexOf(this.itemForId(item.uuid)), 1);
          continue;
        }
        if(item.isMetadataUpdate) { continue; }
        var index = this.items.indexOf(item);
        if(index >= 0) {
          this.items[index] = item;
        } else {
          this.items.push(item);
        }
      }

      for(var observer of this.updateObservers) {
        observer.callback();
      }
    });


    console.log("Setting size.");
    this.componentManager.setSize("container", 500, 300);
  }

  itemForId(uuid) {
    return this.items.filter((item) => {return item.uuid == uuid})[0];
  }

  addUpdateObserver(callback) {
    let observer = {id: Math.random, callback: callback};
    this.updateObservers.push(observer);
    return observer;
  }

  removeUpdateObserver(observer) {
    this.updateObservers.splice(this.updateObservers.indexOf(observer), 1);
  }

  isPackageInstalled(aPackage) {
    return this.isPackageInstalledHosted(aPackage) || this.isPackageInstalledLocal(aPackage);
  }

  isPackageInstalledHosted(aPackage) {
    return this.items.filter((item) => {
      return !item.deleted && !item.content.local && item.content.package_info
    }).map((item) => {
      return item.content.package_info.identifier
    }).includes(aPackage.identifier);
  }

  isPackageInstalledLocal(aPackage) {
    return this.items.filter((item) => {
      return !item.deleted && item.content.local && item.content.package_info
    }).map((item) => {
      return item.content.package_info.identifier
    }).includes(aPackage.identifier);
  }

  itemForPackage(aPackage, local) {
    return this.items.filter((item) => {
      return item.content.package_info
      && item.content.package_info.identifier == aPackage.identifier
      && item.content.local == local
    })[0];
  }

  installPackageHosted(aPackage) {
    console.log("Installing", aPackage);
    let component = this.componentManager.createItem(this.createComponentDataForPackage(aPackage));
  }

  createComponentDataForPackage(aPackage) {
    return {
      content_type: aPackage.content_type,
      content: {
        identifier: aPackage.identifier,
        name: aPackage.name,
        url: aPackage.url,
        area: aPackage.area,
        package_info: aPackage
      }
    };
  }

  uninstallPackageHosted(aPackage) {
    let item = this.itemForPackage(aPackage);
    console.log("Uninstalling", item);
    this.componentManager.deleteItem(item);
  }

  installPackageOffline(aPackage) {
    console.log("Installing offline", aPackage);

    var run = (component) => {
      this.componentManager.sendCustomEvent("install-local-component", component, (installedComponent) => {
        console.log("Prolink Installed Local component", installedComponent);
      });
    }

    var existingComponent = this.itemForPackage(aPackage, true);
    if(existingComponent) {
      existingComponent.content.package_info = aPackage;
      run(existingComponent);
    } else {
      let data = this.createComponentDataForPackage(aPackage);
      this.componentManager.createItem(data, (item) => {
        console.log("installPackageOffline createItem response", item);
        run(item);
      });
    }

  }

  uninstallPackageOffline(aPackage) {
    let item = this.itemForPackage(aPackage, true);
    console.log("Uninstalling offline", item);
    this.componentManager.deleteItem(item);
  }

  sendOpenEvent(aPackage) {
    let component = this.itemForPackage(aPackage);
    this.componentManager.sendCustomEvent("open-component", component);
  }

}
