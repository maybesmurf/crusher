import { Get, JsonController, MethodNotAllowedError } from "routing-controllers";
import { Inject, Service } from "typedi";
import UserService from "../../../core/services/UserService";

@Service()
@JsonController("/integration/slack")
export class Slack {
	@Inject()
	private userService: UserService;

	// Return webhook url to particular channel after
	@Get("/add_to_slack")
	async connectGithub() {
		if (!process.env.GITHUB_CLIENT_ID) {
			throw new MethodNotAllowedError();
		}
	}
}
