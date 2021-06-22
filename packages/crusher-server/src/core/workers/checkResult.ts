import JobsService from "../services/JobsService";
import TestService from "../services/TestService";
import TestInstanceService from "../services/TestInstanceService";
import TestInstanceResultSetsService from "../services/TestInstanceResultSetsService";
import TestInstanceScreenShotsService from "../services/TestInstanceScreenShotsService";
import AlertingService from "../services/AlertingService";
import UserService from "../services/UserService";
import { InstanceStatus } from "../interfaces/InstanceStatus";
import { JobStatus } from "../interfaces/JobStatus";
import { TestInstance } from "../interfaces/db/TestInstance";
import { TestInstanceResultSetStatus } from "../interfaces/TestInstanceResultSetStatus";
import { TestInstanceScreenshot } from "../interfaces/db/TestInstanceScreenshot";
import { updateGithubCheckStatus } from "../../utils/github";
import { GithubCheckStatus } from "../interfaces/GithubCheckStatus";
import { GithubConclusion } from "../interfaces/GithubConclusion";
import AlertingManager from "../manager/AlertingManager";
import { Container } from "typedi";
import { iUser } from "@crusher-shared/types/db/iUser";
import { EmailManager } from "../manager/EmailManager";
import { resolvePathToFrontendURI } from "../utils/uri";
import { Job } from "bullmq";
import { REDDIS } from "../../../config/database";

import * as IORedis from "ioredis";
import JobReportServiceV2 from "../services/v2/JobReportServiceV2";
import { TestInstanceResultSetConclusion } from "../interfaces/TestInstanceResultSetConclusion";
import { JobReportStatus } from "../interfaces/JobReportStatus";
import * as ejs from "ejs";
import * as ReddisLock from "redlock";

const jobsService = Container.get(JobsService);
const jobsReportService = Container.get(JobReportServiceV2);

const testService = Container.get(TestService);
const testInstanceService = Container.get(TestInstanceService);
const testInstanceResultSetsService = Container.get(TestInstanceResultSetsService);
const testInstanceScreenshotsService = Container.get(TestInstanceScreenShotsService);
const alertingService = Container.get(AlertingService);
const userService = Container.get(UserService);

interface TestInstanceWithImages extends TestInstance {
	images: {
		[imageKey: string]: TestInstanceScreenshot;
	};
}
async function getOrganisedTestInstanceWithImages(testInstance: TestInstance): Promise<TestInstanceWithImages> {
	const images = await testInstanceScreenshotsService.getAllScreenShotsOfInstance(testInstance.id);

	const imagesMap = images.reduce((prevImages, image) => {
		return {
			...prevImages,
			[image.name + "_" + testInstance.platform]: image,
		};
	}, {});

	return {
		...testInstance,
		images: imagesMap,
	};
}
function getReferenceInstance(referenceJobId, testId, platform) {
	return testInstanceService.getReferenceTestInstance(referenceJobId, testId, platform);
}

function notifyResultWithEmail(jobRecord: any, result: JobReportStatus) {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise(async (resolve, reject) => {
		const emailTemplateFilePathMap = {
			[JobReportStatus.FAILED]: "/../../templates/failedJob.ejs",
			[JobReportStatus.MANUAL_REVIEW_REQUIRED]: "/../../templates/manualReviewRequiredJob.ejs",
		};

		const templatePath = emailTemplateFilePathMap[result];
		if (!templatePath) {
			return;
		}

		const usersInTeam = await testService.findMembersOfProject(jobRecord.project_id);
		return ejs.renderFile(
			__dirname + templatePath,
			{
				jobId: jobRecord.id,
				branchName: jobRecord.branch_name,
				jobReviewUrl: resolvePathToFrontendURI(`/app/job/review?jobId=${jobRecord.id}`),
			},
			function (err, str) {
				if (err) return reject("Can't load the invite member template");
				EmailManager.sendEmailToUsers(usersInTeam, `Job ${jobRecord.id} ${result}`, str);
				resolve(true);
			},
		);
	});
}

async function notifyResultWithSlackIntegrations(jobRecord: any, result: JobReportStatus, userWhoStartedTheJob: iUser, state) {
	const slackIntegrationsArr = await alertingService.getSlackIntegrationsInProject(jobRecord.project_id);

	for (let i = 0; i < slackIntegrationsArr.length; i++) {
		await AlertingManager.sendSlackMessage(
			slackIntegrationsArr[i].webhook_url,
			jobRecord,
			userWhoStartedTheJob,
			{
				passed: state.passedTestsArray.length,
				failed: state.failedTestsArray.length,
				review: state.markedForReviewTestsArray.length,
			},
			state.failedTestsArray,
			result,
		);
	}
}

async function notifyResultToGithubChecks(jobRecord: any, result: JobReportStatus) {
	await updateGithubCheckStatus(
		GithubCheckStatus.COMPLETED,
		{
			fullRepoName: jobRecord.repo_name,
			githubCheckRunId: jobRecord.check_run_id,
			githubInstallationId: jobRecord.installation_id,
		},
		result === JobReportStatus.PASSED ? GithubConclusion.SUCCESS : GithubConclusion.FAILURE,
	);
}

async function handlePostChecksOperations(reportId: number, totalTestCount, jobId: number) {
	const jobRecord = await jobsService.getJob(jobId);
	const userWhoStartedThisJob = await userService.getUserInfo(jobRecord.user_id);
	let jobConclusion = JobReportStatus.FAILED;

	const allResultSets = await testInstanceResultSetsService.getResultSets(reportId);
	const state = {
		passedTestsArray: [],
		failedTestsArray: [],
		markedForReviewTestsArray: [],
	};
	allResultSets.map((resultSet) => {
		const { conclusion } = resultSet;
		if (conclusion === TestInstanceResultSetConclusion.PASSED) {
			state.passedTestsArray.push(resultSet);
		} else if (conclusion === TestInstanceResultSetConclusion.FAILED) {
			state.failedTestsArray.push(resultSet);
		} else {
			state.markedForReviewTestsArray.push(resultSet);
		}
	});

	let explanation = "";
	if (state.passedTestsArray.length === totalTestCount) {
		jobConclusion = JobReportStatus.PASSED;
		explanation = "All tests passed with visual checks";
	} else if (state.failedTestsArray.length) {
		jobConclusion = JobReportStatus.FAILED;
		explanation = "There are some failed tests in this build";
	} else if (!state.failedTestsArray.length && state.markedForReviewTestsArray.length) {
		jobConclusion = JobReportStatus.MANUAL_REVIEW_REQUIRED;
		explanation = "No tests failed, but some of them requires manual review";
	}

	await jobsReportService.updateJobReportStatus(jobConclusion, reportId, explanation);

	await notifyResultToGithubChecks(jobRecord, jobConclusion);
	await notifyResultWithEmail(jobRecord, jobConclusion);
	await notifyResultWithSlackIntegrations(jobRecord, jobConclusion, userWhoStartedThisJob, state);
}

async function runChecks(details) {
    const {
        error,
        platform,
        reportId,
        testId,
        instanceId
    } = details;

    const currentJobReport = await jobsReportService.getJobReport(reportId);

    const testInstance = await testInstanceService.getTestInstance(instanceId);
    const referenceInstance = getReferenceInstance(currentJobReport.reference_job_id, testId, platform);

    // Create result set for this config
    const { insertId: resultSetId } = await testInstanceResultSetsService.createResultSet({
		instance_id: instanceId,
		target_instance_id: referenceInstance ? referenceInstance.id : instanceId,
		report_id: reportId,
		status: TestInstanceResultSetStatus.RUNNING_CHECKS,
	});

    const testInstanceWithImages = await getOrganisedTestInstanceWithImages(testInstance);
    const referenceInstanceWithImages = await getOrganisedTestInstanceWithImages(referenceInstance);
    console.log("Reference instance is", testInstanceWithImages, referenceInstanceWithImages);

    await testInstanceResultSetsService.updateResultSetStatus(resultSetId, error);
}

module.exports = async (bullJob: Job) => {
	const reddisClient = new IORedis({
		port: parseInt(REDDIS.port),
		host: REDDIS.host,
		password: REDDIS.password,
	});

	const reddisLock = new ReddisLock([reddisClient], {
		driftFactor: 0.01,
		retryCount: -1,
		retryDelay: 150,
		retryJitter: 200,
	});

	const {
		error,
		githubInstallationId,
		githubCheckRunId,
		testCount: totalTestCount,
		images: screenshots,
		testId,
		jobId,
		instanceId,
		reportId,
		fullRepoName,
		platform,
	} = bullJob.data;

	async function clearJobTempValues(jobId) {
		await reddisClient.multi().del(`${jobId}:started`).del(`${jobId}:completed`).exec();
	}

	try {
		await testInstanceService.updateTestInstanceStatus(InstanceStatus.FINISHED, instanceId);

		reddisLock.lock(`${jobId}:completed:lock1`, 15000).then(async function (lock) {
			await reddisClient.incr(`${jobId}:completed`);
			const completedTestsCount = parseInt(await reddisClient.get(`${jobId}:completed`));

			await runChecks({
                error,
                githubInstallationId,
                githubCheckRunId,
                totalTestCount,
                screenshots,
                testId,
                jobId,
                instanceId,
                reportId,
                fullRepoName,
                platform,
            });

			console.log("Cleaning up now", completedTestsCount, totalTestCount);
			if (completedTestsCount === totalTestCount) {
				const job = await jobsService.getJob(jobId);
				if (job.status !== JobStatus.ABORTED) {
					await jobsService.updateJobStatus(JobStatus.FINISHED, jobId);
				}
				await clearJobTempValues(jobId);
				await handlePostChecksOperations(reportId, totalTestCount, jobId);
			}

			try {
				return lock.unlock();
			} catch (ex) {
				console.error(ex);
				return true;
			}
		});
	} catch (Ex) {
		console.error(Ex);
	}
};
