import { Service, Container } from "typedi";
import DBManager from "../manager/DBManager";
import { Comment } from "../interfaces/db/Comment";

@Service()
export default class CommentsService {
	private dbManager: DBManager;

	constructor() {
		this.dbManager = Container.get(DBManager);
	}

	async createComment(details: Comment) {
		return this.dbManager.insertData(`INSERT INTO comments SET ?`, details);
	}

	async getCommentsOfResultSet(resultSetId: number): Promise<Comment[]> {
		return this.dbManager.fetchData(`SELECT * FROM comments WHERE result_set_id = ? LIMIT 1`, [resultSetId]);
	}

	async getCommentsOfResultSetWithUserName(resultSetId: number): Promise<Comment[]> {
		return this.dbManager.fetchData(
			`SELECT comments.*, users.first_name userFirstName, users.last_name userLastName FROM comments, users WHERE comments.result_set_id = ? AND users.id = comments.user_id`,
			[resultSetId],
		);
	}

	async getCommentsOfScreenshotInResultSet(screenshotId: number, resultSetId: number) {
		return this.dbManager.fetchData(`SELECT * FROM comments WHERE screenshot_id = ? AND result_set_id = ? `, [screenshotId, resultSetId]);
	}

	async deleteComment(commentId: number) {
		return this.dbManager.fetchSingleRow(`DELETE FROM comments WHERE id = ?`, [commentId]);
	}
}
