import HttpManager from "./HttpManager";

export default class RepoController {

  constructor(props) {
    this.repo = props.repo;
  }

  getPackages(callback) {
    HttpManager.get().getAbsolute(this.repo.url, {}, (response) => {
      console.log("Loaded repo:", response);
      this.response = response;
      callback(response.packages);
    }, (error) => {
      console.log("Error loading repo", error);
      callback(null, error || {});
    })
  }

}
