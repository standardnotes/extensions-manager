import HttpManager from "./HttpManager";

export default class RepoController {

  constructor(props) {
    this.repo = props.repo;
  }

  getPackages(callback) {
    HttpManager.get().getAbsolute(this.repo.content.url, {}, (response) => {
      this.response = response;
      callback(response);
    }, (error) => {
      console.log("Error loading repo", error);
      callback(null);
    })
  }

}
