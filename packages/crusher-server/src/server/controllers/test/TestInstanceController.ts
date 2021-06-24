import { JsonController, Get, Authorized, CurrentUser, Body, Post, UnauthorizedError, Param } from "routing-controllers";
import { Service, Container, Inject } from "typedi";
import DBManager from "../../../core/manager/DBManager";
import UserService from "../../../core/services/UserService";
import ProjectService from "../../../core/services/ProjectService";
import TestInstanceService from "../../../core/services/TestInstanceService";
import JobsService from "../../../core/services/JobsService";
import { TestLogsService } from "../../../core/services/mongo/testLogs";

@Service()
@JsonController("/test_instance")
export class TestInstanceController {
	@Inject()
	private userService: UserService;
	@Inject()
	private testInstanceService: TestInstanceService;
	@Inject()
	private projectService: ProjectService;
	@Inject()
	private buildsService: JobsService;
	@Inject()
	private testLogsService: TestLogsService;

	private dbManager: DBManager;

	constructor() {
		// This passes on only one DB containers
		this.dbManager = Container.get(DBManager);
	}

	@Authorized()
	@Get("/getAll/:testId")
	async getAllTestInstances(@Param("testId") testId: number, @CurrentUser({ required: true }) user) {
		const { user_id } = user;
		const canAccessThisTest = await this.userService.canAccessTestWithID(testId, user_id);
		if (canAccessThisTest) {
			return this.testInstanceService.getAllTestInstances(testId);
		} else {
			throw new UnauthorizedError("User not authorized to access test with this id.");
		}
	}

	@Authorized()
	@Post("/updateTestInstance/:id")
	async updateTestInstance(@Param("id") testInstanceId: number, @Body() body, @CurrentUser({ required: true }) user) {
		const { user_id } = user;
		const { status } = body;

		const canAccessTestInstance = await this.userService.canAccessTestInstanceWithId(testInstanceId, user_id);
		if (canAccessTestInstance) {
			return this.testInstanceService.updateTestInstanceStatus(status, testInstanceId);
		} else {
			throw new UnauthorizedError("User not authorized to access test instance with this id.");
		}
	}

	@Authorized()
	@Get(`/logs/:instance_id`)
	async getJob(@CurrentUser({ required: true }) user, @Param(`instance_id`) instanceId: number) {
		const instanceLogs = (await this.testLogsService.getLogsOfInstanceInJob(instanceId)).map((log) => {
			return log[`_doc`];
		});

		return instanceLogs;
	}
}
