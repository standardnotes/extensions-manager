import ComponentManager from 'sn-components-api';
import Repo from "../models/Repo.js";
import HttpManager from "./HttpManager";

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

  initiateBridge(onReady) {
    // var permissions = [
    //   {
    //     name: "stream-items",
    //     content_types: ["SN|Component", "SN|Theme", "SF|Extension", "Extension"]
    //   }
    // ]

    this.componentManager = new ComponentManager([], () => {
      onReady && onReady();
      // on ready
    });

    this.componentManager.acceptsThemes = false;

    this.componentManager.setSize("container", 800, 500);
  }

  didBeginStreaming() {
    return this._didBeginStreaming;
  }

  beginStreamingItems() {
    this._didBeginStreaming = true;
    this.componentManager.streamItems(["SN|Component", "SN|Theme", "SF|Extension", "Extension"], (items) => {
      // console.log("Prolink received items", items);
      for(var item of items) {
        if(item.deleted) {
          this.removeItemFromItems(item);
          continue;
        }
        if(item.isMetadataUpdate) {
          continue;
        }

        var index = this.indexOfItem(item);
        if(index >= 0) {
          this.items[index] = item;
        } else {
          this.items.push(item);
        }
      }

      this.notifyObserversOfUpdate();
    });

  }

  indexOfItem(item) {
    for(var index in this.items) {
      if(this.items[index].uuid == item.uuid) {
        return index;
      }
    }
    return -1;
  }

  removeItemFromItems(item) {
    this.items = this.items.filter((candidate) => {return candidate.uuid !== item.uuid});
  }

  allInstalled() {
    return this.items;
  }

  notifyObserversOfUpdate() {
    for(var observer of this.updateObservers) {
      observer.callback();
    }

    if(this.installedRepos.length > 0) {
      this.componentManager.setSize("container", 800, 700);
    }
  }

  get installedRepos() {
    var urls = this.componentManager.componentDataValueForKey("repos") || [];
    return urls.map((url) => {return new Repo(url)});
  }

  installRepoUrl(url) {
    var urls = this.installedRepos.map((repo) => {return repo.url});
    urls.push(url);
    this.componentManager.setComponentDataValueForKey("repos", urls);
    this.notifyObserversOfUpdate();
  }

  uninstallRepo(repo) {
    var urls = this.componentManager.componentDataValueForKey("repos") || [];
    urls.splice(urls.indexOf(repo.url), 1);
    this.componentManager.setComponentDataValueForKey("repos", urls);
    this.notifyObserversOfUpdate();
  }

  localComponentInstallationAvailable() {
    return this.componentManager.isRunningInDesktopApplication();
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
    return this.itemForPackage(aPackage);
  }

  itemForPackage(aPackage) {
    var result = this.items.filter((item) => {
      return item.content.package_info
      && !item.deleted
      && item.content.package_info.identifier == aPackage.identifier
    })[0];
    return result;
  }

  downloadPackageDetails(url, callback) {
    HttpManager.get().getAbsolute(url, {}, (response) => {
      console.log("Download package details:", response);
      callback(response);
    }, (error) => {
      console.log("Error downloading package details", error);
      callback(null, error || {});
    })
  }

  installPackageFromUrl(url, callback) {
    HttpManager.get().getAbsolute(url, {}, (response) => {
      console.log("Install from url response:", response);
      this.installPackage(response, (component) => {
        callback(component);
      })
      callback(response);
    }, (error) => {
      console.log("Error installing from url", error);
      callback(null, error || {});
    })
  }

  installPackage(aPackage, callback) {
    console.log("Installing", aPackage);
    this.componentManager.createItem(this.createComponentDataForPackage(aPackage), (component) => {
      if(this.localComponentInstallationAvailable()) {
        this.componentManager.sendCustomEvent("install-local-component", component, (installedComponent) => {
          console.log("Prolink Installed Local component", installedComponent);
          callback && callback(component);
        });
      } else {
        callback && callback(component);
      }
    });
  }

  saveItems(items, callback) {
    this.componentManager.saveItems(items, () => {
      console.log("Save items complete");
      callback && callback();
    })
  }

  createComponentDataForPackage(aPackage) {
    return {
      content_type: aPackage.content_type,
      content: {
        identifier: aPackage.identifier,
        name: aPackage.name,
        hosted_url: aPackage.url,
        url: aPackage.url,
        local_url: null,
        area: aPackage.area,
        package_info: aPackage
      }
    };
  }

  uninstallPackage(aPackage) {
    let item = this.itemForPackage(aPackage);
    console.log("Uninstalling", item);
    this.uninstallComponent(item);
  }

  uninstallComponent(component) {
    this.componentManager.deleteItem(component);
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

  toggleOpenEvent(component) {
    this.componentManager.sendCustomEvent("toggle-activate-component", component);
  }

  humanReadableTitleForExtensionType(type, pluralize) {
    let mapping = {
      "Extension" : "Action",
      "SF|Extension" : "Server Extension",
      "SN|Theme" : "Theme",
      "SN|Editor" : "Editor",
      "SN|Component" : "Component"
    }

    var value = mapping[type];
    if(pluralize) {
      value += "s";
    }
    return value;
  }

}
