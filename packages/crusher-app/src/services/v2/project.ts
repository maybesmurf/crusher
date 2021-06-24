import { backendRequest } from "@utils/backendRequest";
import { RequestMethod } from "@interfaces/RequestOptions";

export const _updateProjectInfo = (info: { name: string }, projectId: number, headers?: any): Promise<any> => {
	return backendRequest(`/project/update/${projectId}`, {
		method: RequestMethod.PUT,
		headers: headers,
		payload: { info },
	});
};

export const runTestsInProject = (projectId: number, headers?: any): Promise<any> => {
	return backendRequest(`/project/run/${projectId}`, {
		method: RequestMethod.GET,
		headers: headers,
	});
};
