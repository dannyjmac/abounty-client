import { inject, injectable, postConstruct } from "inversify";
import { observable, action, makeAutoObservable, runInAction } from "mobx";
import { getRootContainer } from "../../config/ioc/root";
import { Speaker } from "../../model/types";
import navigationService, {
  mainRoutes,
} from "../../navigation/NavigationService";
import AuthStore from "../../stores/AuthStore/AuthStore";
import BountyStore from "../../stores/BountyStore/BountyStore";
import DiscoverStore from "../../stores/DiscoverStore/DiscoverStore";
import { useClassStore } from "../../utils/useClassStore";

@injectable()
class BountyPresenter {
  @postConstruct() onInit() {
    makeAutoObservable(this);
  }
  @inject(BountyStore) private bountyStore!: BountyStore;
  @inject(DiscoverStore) private discoverStore!: DiscoverStore;
  @inject(AuthStore) private authStore!: AuthStore;
  @observable error: string | null = null;
  @observable subject: string = "";
  @observable description: string = "";
  @observable tags: string[] = ["testing"];
  @observable step: number = 0;
  @observable speakerString: string = "";
  @observable tagString: string = "";
  @observable speakers: Speaker[] = [];

  @action public setSpeakers = (speakers: string) => {
    this.speakerString = speakers;
    const array = this.speakerString.split(" ");
    if (array.length > 1) {
      const newArray = array.map((string) => {
        if (!string.startsWith("@") && string.split("").length > 1) {
          return "@" + string;
        }
        return string;
      });
      this.speakerString = newArray.join(" ");
    }
  };

  @action public setTags = (tags: string) => {
    this.tagString = tags;
    const array = this.tagString.split(" ");
    if (array.length > 1) {
      const newArray = array.map((string) => {
        if (!string.startsWith("#") && string.split("").length > 1) {
          return "#" + string;
        }
        return string;
      });
      this.tagString = newArray.join(" ");
    }
  };

  @action public checkSpeakers = async () => {
    const users = this.speakerString.split(" ");
    if (users.length > 4) {
      this.error = "There is a limit of 4 speakers";
      return;
    }
    const response = await this.bountyStore.checkSpeakers(users);
    if (response.data.data.length !== users.length) {
      this.error = "Error, check usernames are valid usernames on twitter";
      return;
    }
    this.speakers = response.data.data.map((speaker: Speaker) => {
      return {
        ...speaker,
        confirmed: false,
        userId: this.authStore.currentUser.id,
      };
    });
    this.updateStep(this.step + 1);
  };

  @action public updateStep = (newStep: number) => {
    this.step = newStep;
  };

  @action public setDescription = (description: string) => {
    this.description = description;
  };

  @action public setSubject = (subject: string) => {
    this.subject = subject;
  };

  @action public createBountySubmit = async () => {
    const tags = this.tagString.split(" ");
    if (tags.length > 2) {
      this.error = "There is a limit of 2 hashtags";
      return;
    }
    const response = await this.discoverStore.createBounty({
      subject: this.subject,
      description: this.description,
      tags: this.tagString.split(""),
      speakers: this.speakers,
      user: {
        id: this.authStore.currentUser.id,
        username:
          this.authStore.currentUser.user_metadata.user_name.toLowerCase(),
      },
    });
    if (response) {
      navigationService.navigate(mainRoutes.Discover);
    }
  };
}

const useCreateBountyPresenter = () =>
  useClassStore<BountyPresenter>(getRootContainer().get(BountyPresenter));

export default useCreateBountyPresenter;
