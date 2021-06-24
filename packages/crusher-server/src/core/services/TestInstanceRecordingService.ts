import { Container, Service } from "typedi";
import DBManager from "../manager/DBManager";
import { TestInstanceRecording } from "../interfaces/db/TestInstanceRecording";

@Service()
export default class TestInstanceRecordingService {
	private dbManager: DBManager;

	constructor() {
		this.dbManager = Container.get(DBManager);
	}

	async createTestInstanceRecording(details: TestInstanceRecording) {
		return this.dbManager.insertData(`INSERT INTO test_instance_recordings SET ?`, {
			test_instance_id: details.test_instance_id,
			video_uri: details.video_uri,
			test_id: details.test_id,
		});
	}

	async getTestRecording(instanceId: number): Promise<TestInstanceRecording> {
		return this.dbManager.fetchSingleRow(`SELECT * FROM test_instance_recordings WHERE test_instance_id = ?`, [instanceId]);
	}
}
