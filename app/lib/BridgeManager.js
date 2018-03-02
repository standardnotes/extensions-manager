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
    this.packages = [];
    this.size = null;
  }

  initiateBridge(onReady) {
    this.componentManager = new ComponentManager([], () => {
      onReady && onReady();
    });

    this.componentManager.acceptsThemes = false;
  }

  getItemAppDataValue(item, key) {
    return this.componentManager.getItemAppDataValue(item, key);
  }

  registerPackages(packages) {
    this.packages = packages || [];
  }

  latestPackageInfoForComponent(component) {
    return this.packages.find((p) => {return p.identifier == component.content.package_info.identifier});
  }

  getSelfComponentUUID() {
    return this.componentManager.getSelfComponentUUID();
  }

  didBeginStreaming() {
    return this._didBeginStreaming;
  }

  beginStreamingItems() {
    this._didBeginStreaming = true;
    this.componentManager.streamItems(["SN|Component", "SN|Theme", "SF|Extension", "Extension"], (items) => {
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
      if(this.size != "tall") {
        this.size = "tall";
        this.componentManager.setSize("container", 800, 700);
      }
    } else {
      if(this.size != "short") {
        this.componentManager.setSize("container", 800, 500);
      }
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

  itemForPackage(packageInfo) {
    var result = this.items.find((item) => {
      if(!item.content.package_info) {
        if(!item.content.url) {
          return false;
        }
        // Legacy component without package_info, search by url or name
        // We also check if the item content url contains the substring that is packageInfo, since
        // newer URL formats remove extraneous query params from the end
        return item.content.url == packageInfo.url || item.content.url.includes(packageInfo.url) || item.content.name == packageInfo.name;
      }
      return item.content.package_info
      && !item.deleted
      && item.content.package_info.identifier == packageInfo.identifier
    });
    return result;
  }

  downloadPackageDetails(url, callback) {
    HttpManager.get().getAbsolute(url, {}, (response) => {
      callback(response);
    }, (error) => {
      console.log("Error downloading package details", error);
      callback(null, error || {});
    })
  }

  installPackageFromUrl(url, callback) {
    HttpManager.get().getAbsolute(url, {}, (response) => {
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
    let data = this.createComponentDataForPackage(aPackage);
    this.componentManager.createItem(data, (component) => {
      callback && callback(component);
    });
  }

  saveItems(items, callback) {
    this.componentManager.saveItems(items, () => {
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
        package_info: aPackage,
        valid_until: aPackage.valid_until
      }
    };
  }

  uninstallPackage(aPackage) {
    let item = this.itemForPackage(aPackage);
    this.uninstallComponent(item);
  }

  uninstallComponent(component) {
    this.componentManager.deleteItem(component);
  }

  updateComponent(component) {
    let latestPackageInfo = this.latestPackageInfoForComponent(component);;

    component.content.package_info.download_url = latestPackageInfo.download_url;

    this.componentManager.saveItems([component], () => {
      this.componentManager.sendCustomEvent("install-local-component", component, (installedComponent) => {
      });
    })
  }

  uninstallPackageOffline(aPackage) {
    let item = this.itemForPackage(aPackage, true);
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

  nameForNamelessServerExtension(extension) {
    var url = extension.content.url;
    if(!url) { return null; }

    if(url.includes("gdrive")) {
      return "Google Drive Sync";
    } else if(url.includes("file_attacher")) {
      return "File Attacher";
    } else if(url.includes("onedrive")) {
      return "OneDrive Sync";
    } else if(url.includes("backup.email_archive")) {
      return "Daily Email Backups";
    } else if(url.includes("dropbox")) {
      return "Dropbox Sync";
    } else if(url.includes("revisions")) {
      return "Revision History";
    } else {
      return null;
    }
  }

}
