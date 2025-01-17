import "reflect-metadata";
import { setupLogger } from "@crusher-shared/modules/logger";

setupLogger("crusher-server");

require("dotenv").config();

import { authorization, getCurrentUserChecker } from "./server/middleware/Authorization";
import * as bodyParser from "body-parser";
import { useContainer, useExpressServer } from "routing-controllers";
import * as http from "http";
import { Container } from "typedi";
import { CorsMiddleware } from "./server/middleware/CorsMiddleware";
import { ReqLogger } from "./server/middleware/ResponseTime";
import * as express from "express";
import { RedisManager } from "@modules/redis";
import { UserController } from "@modules/resources/users/controller";
import { TestController } from "@modules/resources/tests/controller";
import { BuildReportController } from "@modules/resources/buildReports/controller";
import { BuildsController } from "@modules/resources/builds/controller";
import { BuildTestInstancesController } from "@modules/resources/builds/instances/controller";
import { ReleaseController } from "./server/controllers/releaseController";
import { ProjectsController } from "@modules/resources/projects/controller";
import { TeamsController } from "@modules/resources/teams/controller";
import { ProjectMonitoringController } from "@modules/resources/projects/monitoring/controller";
import { ProjectEnvironmentController } from "@modules/resources/projects/environments/controller";
import { IntegrationsController } from "@modules/resources/integrations/controller";
import { CLIController } from "@modules/resources/cli/controller";
import { ProxyController } from "@modules/resources/proxy/controller";

Container.set(RedisManager, new RedisManager());

const chalk = require("chalk");

useContainer(Container);
const expressApp = express();
expressApp.use(ReqLogger);
expressApp.use(bodyParser({ limit: "50mb" }));
expressApp.use(bodyParser.urlencoded({ extended: false }));

const controllersArr: any = [
	UserController,
	TestController,
	BuildsController,
	BuildReportController,
	ReleaseController,
	ProjectsController,
	TeamsController,
	BuildTestInstancesController,
	ProjectMonitoringController,
	ProjectEnvironmentController,
	IntegrationsController,
	CLIController,
	ProxyController
];

// @TODO: Look into this
// if (getEdition() === EDITION_TYPE.EE) {
// 	const eeControllerArr: any = require("./ee/controllers");
// 	controllersArr.push(...Object.values(eeControllerArr));
// }
useExpressServer(expressApp, {
	controllers: controllersArr,
	middlewares: [CorsMiddleware],
	authorizationChecker: authorization(),
	currentUserChecker: getCurrentUserChecker(),
	defaultErrorHandler: true,
});

process.on("unhandledRejection", (reason, p) => {
	p.catch((error) => {
		console.error("unhandledRejection", `Caught exception: ${reason}\n` + `Exception origin: ${p}`, { error });
	});
});

process.on("uncaughtException", (err: Error) => {
	console.error("uncaughtException", `Caught exception: ${err.message}\n` + `Exception origin: ${err.stack}`);
	process.exit(1);
});

const httpServer = http.createServer(expressApp);
const port = process.env.PORT || 8000;

httpServer.listen(port);

console.info("App", chalk.hex("#ec2e6a").bold(`Starting at ${port}`));
