import ComponentManager from 'sn-components-api';
import HttpManager from "./HttpManager";

export default class BridgeManager {

  /* Singleton */
  static instance = null;
  static get() {
    if (this.instance == null) { this.instance = new BridgeManager(); }
    return this.instance;
  }

  constructor(onReceieveItems) {
    BridgeManager.EventSaving = "EventSaving";
    BridgeManager.EventDoneSaving = "EventDoneSaving";
    BridgeManager.EventDownloadingPackages = "EventDownloadingPackages";
    BridgeManager.EventDoneDownloadingPackages = "EventDoneDownloadingPackages";
    BridgeManager.EventUpdatedValidUntil = "EventUpdatedValidUntil";

    BridgeManager.ExtensionRepoContentType = "SN|ExtensionRepo";

    this.updateObservers = [];
    this.items = [];
    this.packages = [];
    this.eventHandlers = [];
    this.size = null;
  }

  initiateBridge(onReady) {
    this.componentManager = new ComponentManager([], () => {
      document.querySelector("html").classList.add(this.componentManager.platform);
      this.reloadScrollBars();
      this.migrateInnateReposToExtensionRepoObjects();

      onReady && onReady();
    });
  }

  reloadScrollBars() {
    // For some reason, scrollbars don't update when the className for this.state.platform is set dynamically.
    // We're doing everything right, but on Chrome Windows, the scrollbars don't reload if adding className after
    // the page already loaded. So this seems to work in manually reloading.
    var container = document.querySelector("body");
    container.style.display = "none";
    setTimeout(() => {
      container.style.display = "block";
    }, 0);
  }

  getItemAppDataValue(item, key) {
    return this.componentManager.getItemAppDataValue(item, key);
  }

  addEventHandler(handler) {
    this.eventHandlers.push(handler);
  }

  notifyEvent(event, data) {
    for(var handler of this.eventHandlers) {
      handler(event, data || {});
    }
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
    let contentTypes = ["SN|Component", "SN|Theme", "SF|Extension", "Extension", BridgeManager.ExtensionRepoContentType];
    this.componentManager.streamItems(contentTypes, (items) => {
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
    return this.items.filter((item) => {
      return item.content_type != BridgeManager.ExtensionRepoContentType;
    });
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
        this.size = "short";
        this.componentManager.setSize("container", 800, 500);
      }
    }
  }

  // April 2019: We're migrating repos from being a component data value
  // to their own separate objects. This way, repos aren't tied down to the Extensions installation.
  migrateInnateReposToExtensionRepoObjects() {
    let urls = this.componentManager.componentDataValueForKey("repos") || [];
    if(urls.length == 0) {
      return;
    }
    this.addRepos(urls).then(() => {
      this.componentManager.setComponentDataValueForKey("repos", null);
      this.notifyObserversOfUpdate();
    })
  }

  async addRepo(url) {
    return this.addRepos([url]);
  }

  async addRepos(urls) {
    let itemParams = [];
    for(let url of urls) {
      itemParams.push({
        content_type: BridgeManager.ExtensionRepoContentType,
        content: { url: url }
      })
    }

    return new Promise((resolve, reject) => {
      this.componentManager.createItems(itemParams, (createdItems) => {
        resolve(createdItems);
      });
    })
  }

  get installedRepos() {
    return this.items.filter((item) => item.content_type == BridgeManager.ExtensionRepoContentType);
  }

  uninstallRepo(repo) {
    this.componentManager.deleteItem(repo);
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
      this.installPackage(response).then((component) => {
        callback(component);
      })
      callback(response);
    }, (error) => {
      console.log("Error installing from url", error);
      callback(null, error || {});
    })
  }

  async installPackage(aPackage, repo) {
    return new Promise((resolve, reject) => {
      let data = this.createComponentDataForPackage(aPackage, repo);
      this.componentManager.createItem(data, (component) => {
        resolve(component);
      });
    })
  }

  saveItems(items, callback) {
    this.notifyEvent(BridgeManager.EventSaving);
    this.componentManager.saveItems(items, () => {
      this.notifyEvent(BridgeManager.EventDoneSaving);
      callback && callback();
    })
  }

  createComponentDataForPackage(aPackage, repo) {
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
        valid_until: aPackage.valid_until,
        references: repo ? [{content_type: repo.content_type, uuid: repo.uuid}] : []
      }
    };
  }

  uninstallPackage(aPackage) {
    let item = this.itemForPackage(aPackage);
    this.uninstallComponent(item);
  }

  uninstallComponent(component) {
    let isSelf = component.uuid == BridgeManager.get().getSelfComponentUUID();
    let warning = component.content.package_info && component.content.package_info.deletion_warning;
    if(isSelf || warning) {
      let message = warning ? warning : "You are uninstalling the Extensions manager. After it has been uninstalled, please reload the application, and a new installation will be created.";
      if(!confirm(message)) {
        return;
      }
    }
    this.componentManager.deleteItem(component);
  }

  updateComponent(component) {
    let latestPackageInfo = this.latestPackageInfoForComponent(component);;

    component.content.package_info = latestPackageInfo;

    this.componentManager.saveItems([component], () => {
      this.componentManager.sendCustomEvent("install-local-component", component, (installedComponent) => {
      });
    })
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
