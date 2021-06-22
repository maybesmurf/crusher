import { BaseRowInterface } from "./BaseRowInterface";

export interface Draft extends BaseRowInterface {
	id?: number;
	user_id: number;
	events?: string;
	code: string;
	name?: string;
	project_id?: number;
}
