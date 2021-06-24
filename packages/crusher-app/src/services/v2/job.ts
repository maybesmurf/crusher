import { backendRequest } from "@utils/backendRequest";
import { RequestMethod } from "@interfaces/RequestOptions";
import { JobInfo } from "@interfaces/JobInfo";

export class JobService {
	static getJob(jobId: number, headers = null): Promise<JobInfo> {
		return backendRequest(`/job/get/${jobId}`, {
			method: RequestMethod.GET,
			headers: headers,
		});
	}
}
