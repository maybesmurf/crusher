import { getEdition } from "./utils/helper";

require("dotenv").config();
require("./utils/logger");

import { authorization, getCurrentUserChecker } from "./server/middleware/Authorization";
import { Logger } from "./utils/logger";
import * as bodyParser from "body-parser";
import { useContainer, useExpressServer } from "routing-controllers";
import * as http from "http";
import { Container } from "typedi";
import { CorsMiddleware } from "./server/middleware/CorsMiddleware";
import { ReqLogger } from "./server/middleware/ResponseTime";
import * as express from "express";
import { UserController } from "./server/controllers/UserController";
import { ProjectsController } from "./server/controllers/ProjectsController";
import { TestController } from "./server/controllers/TestController";
import { TestInstanceController } from "./server/controllers/TestInstanceController";
import { DraftController } from "./server/controllers/DraftController";
import { JobsController } from "./server/controllers/JobsController";
import { CLIController } from "./server/controllers/CLIController";
import { AlertingController } from "./server/controllers/AlertingController";
import { ProjectHostsController } from "./server/controllers/ProjectHostsController";
import { CommentsController } from "./server/controllers/CommentsController";
import { TestInstanceResultSetsController } from "./server/controllers/TestInstanceResultSetsController";
import { TestInstanceResultsController } from "./server/controllers/TestInstanceResultsController";
import { MonitoringController } from "./server/controllers/MonitoringController";
import { Slack } from "./server/controllers/integrations/Slack";
import { PaymentController } from "./server/controllers/PaymentController";
import { JobReportsController } from "./server/controllers/JobReportsController";

import { InviteMembersController } from "./server/controllers/InviteMembersController";

import { LoginConnectionsController } from "./server/controllers/LoginConnectionsController";
import { GitIntegrationsController } from "./server/controllers/integrations/Github";
import { EmailManager } from "@manager/EmailManager";
import { EDITION_TYPE } from "@crusher-shared/types/common/general";
import MongoManager from "@manager/MongoManager";

const chalk = require("chalk");
Container.get(MongoManager);

useContainer(Container);
const expressApp = express();
expressApp.use(ReqLogger);
expressApp.use(bodyParser({ limit: "50mb" }));
expressApp.use(bodyParser.urlencoded({ extended: false }));

EmailManager.sendVerificationMail("test@gmail.com", "");

if (process.env.STORAGE_MODE === "local") {
	const serveStatic = require("serve-static");
	const finalhandler = require("finalhandler");
	const serve = serveStatic(process.env.BASE_STORAGE_FOLDER);

	const storagePort = parseInt(process.env.STORAGE_PORT, 10);
	const server = http.createServer(function (req: any, res: any) {
		const done = finalhandler(req, res);
		serve(req, res, done);
	});

	server.listen(storagePort);
}

const controllersArr: any = [
	UserController,
	ProjectsController,
	TestController,
	TestInstanceController,
	DraftController,
	JobsController,
	CLIController,
	AlertingController,
	ProjectHostsController,
	CommentsController,
	TestInstanceResultSetsController,
	TestInstanceResultsController,
	MonitoringController,
	Slack,
	PaymentController,
	JobReportsController,
	InviteMembersController,
	LoginConnectionsController,
	GitIntegrationsController,
];

if (getEdition() === EDITION_TYPE.EE) {
	const eeControllerArr: any = require("./ee/controllers");
	controllersArr.push(...Object.values(eeControllerArr));
}
useExpressServer(expressApp, {
	controllers: controllersArr,
	middlewares: [CorsMiddleware],
	authorizationChecker: authorization(),
	currentUserChecker: getCurrentUserChecker(),
	defaultErrorHandler: true,
});

process.on("unhandledRejection", (reason, p) => {
	p.catch((error) => {
		Logger.fatal("unhandledRejection", `Caught exception: ${reason}\n` + `Exception origin: ${p}`, { error });
	});
});

process.on("uncaughtException", (err: Error) => {
	Logger.fatal("uncaughtException", `Caught exception: ${err.message}\n` + `Exception origin: ${err.stack}`);
	process.exit(1);
});

const httpServer = http.createServer(expressApp);
const port = process.env.PORT || 8000;

httpServer.listen(port);

Logger.info("App", chalk.hex("#ec2e6a").bold(`Starting at ${port}`));
