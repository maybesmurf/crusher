import { Authorized, Body, CurrentUser, Get, InternalServerError, JsonController, OnNull, Post, QueryParam, QueryParams, Req, Res } from "routing-controllers";
import { Inject, Service } from "typedi";
import UserService from "../../core/services/UserService";
import { UserV2Service } from "../../core/services/v2/UserV2Service";
import { resolvePathToBackendURI, resolvePathToFrontendURI } from "../../core/utils/uri";
import GoogleAPIService from "../../core/services/GoogleAPIService";
import { EMAIL_VERIFIED_WITH_VERIFICATION_CODE, NO_TEAM_JOINED, USER_NOT_REGISTERED, USER_REGISTERED } from "../../constants";
import TeamService from "../../core/services/TeamService";
import { decodeToken, encryptPassword, generateToken, generateVerificationCode } from "../../core/utils/auth";
import ProjectService from "../../core/services/ProjectService";
import { clearUserAuthorizationCookies, setUserAuthorizationCookies } from "../../utils/cookies";
import { Logger } from "../../utils/logger";
import { iUserInfoResponse } from "@crusher-shared/types/response/userInfoResponse";
import { InviteMembersService } from "../../core/services/mongo/inviteMembers";
import { getEdition } from "../../utils/helper";
import { EDITION_TYPE } from "@crusher-shared/types/common/general";
import { iUser } from "@crusher-shared/types/db/iUser";
import { iSignupUserRequest } from "@crusher-shared/types/request/signupUserRequest";
import { EmailManager } from "@manager/EmailManager";

const cookie = require("cookie");
import { google } from "googleapis";
const oauth2Client = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	resolvePathToBackendURI("/user/authenticate/google/callback"),
);

@Service()
@JsonController("/user")
export class UserController {
	@Inject()
	private userService: UserService;

	@Inject()
	private userV2Service: UserV2Service;

	@Inject()
	private googleAPIService: GoogleAPIService;
	@Inject()
	private teamService: TeamService;
	@Inject()
	private projectService: ProjectService;
	@Inject()
	private inviteMembersService: InviteMembersService;

	/**
	 * Tries to login user
	 *  | If successful, generate jwt and store it in session
	 * 	| Else
	 * 	  | If Not verified, throw error for validation and send link to user.
	 * 	  | Throw 401
	 * @param info
	 * @param res
	 */
	@Post("/login")
	async loginUser(@Body() info: any, @Res() res: any) {
		const { email, password } = info;
		const { status, token } = await this.userService.authenticateWithEmailAndPassword({
			email,
			password,
		});
		if (token) {
			setUserAuthorizationCookies(token, res);
			return { status };
		}
		return { status };
	}

	@Get("/getStatus")
	async getStatus(@CurrentUser({ required: false }) user) {
		const { user_id } = user;
		if (!user_id) {
			return { status: USER_NOT_REGISTERED, data: user };
		}

		return this.userService
			.getUserInfo(user_id)
			.then(async (info) => {
				const { id: user_id, team_id } = info;
				if (user_id && !team_id) {
					return { status: NO_TEAM_JOINED };
				}

				const userMeta = await this.userService.getUserMetaInfo(String(user_id));

				return {
					status: user_id ? USER_REGISTERED : USER_NOT_REGISTERED,
					user_meta: userMeta,
				};
			})
			.catch(() => {
				return { status: USER_NOT_REGISTERED };
			});
	}

	@Post("/user/get_plans")
	async getPricingPlans(
		@CurrentUser({ required: false }) user,
		@Body()
		metaArray,
	) {
		const { user_id } = user;
		if (!user_id) {
			return { status: USER_NOT_REGISTERED };
		}

		return this.userService
			.addUserMeta(metaArray, user_id)
			.then(async () => {
				return { status: "success" };
			})
			.catch(() => {
				return new InternalServerError("Some internal error occurred");
			});
	}

	@Post("/user/start_trial")
	async startUserTrial(
		@CurrentUser({ required: false }) user,
		@Body()
		metaArray,
	) {
		const { user_id } = user;

		if (!user_id) {
			return { status: USER_NOT_REGISTERED };
		}

		return this.userService
			.addUserMeta(metaArray, user_id)
			.then(async () => {
				return { status: "success" };
			})
			.catch(() => {
				return new InternalServerError("Some internal error occurred");
			});
	}

	@Authorized()
	@Post("/meta/add")
	async addUserMeta(
		@CurrentUser({ required: true }) user,
		@Body()
		metaArray,
	) {
		const { user_id } = user;

		return this.userService
			.addUserMeta(metaArray, user_id)
			.then(async () => {
				return { status: "success" };
			})
			.catch(() => {
				return new InternalServerError("Some internal error occurred");
			});
	}

	@Authorized()
	@OnNull(500)
	@Get("/info")
	async getUserInfo(@CurrentUser({ required: true }) user): Promise<iUserInfoResponse> {
		const { user_id } = user;
		const info = await this.userService.getUserInfo(user_id);
		if (info) {
			const userMeta = await this.userService.getUserMetaInfo(String(user_id));

			return {
				...info,
				name: info.first_name + " " + info.last_name,
				user_meta: userMeta,
			};
		}
		return null;
	}

	/**
	 * Check for does user already exist
	 * If not, then create user with verified tag, generate jwt and store it in session
	 * @param user
	 * @param params
	 * @param res
	 */
	@Authorized()
	@Get("/verify")
	async verify(@CurrentUser({ required: true }) user, @QueryParams() params, @Res() res) {
		const { code } = params;
		const { user_id } = decodeToken(code);
		if (user_id === user.user_id) {
			await this.userService.verify(user_id);
			res.redirect(resolvePathToFrontendURI("/"));
			return { status: EMAIL_VERIFIED_WITH_VERIFICATION_CODE };
		}

		res.redirect(resolvePathToFrontendURI("/"));
	}

	/**
	 * Check for does user already exist
	 * If not, then create user with verified tag, generate jwt and store it in session
	 * @param user
	 */
	@Authorized()
	@Post("/resendVerification")
	async resendVerificationLink(@CurrentUser({ required: true }) user) {
		return this.userService.resendVerification(user.user_id);
	}

	@Authorized()
	@Get("/refreshToken")
	async refreshToken(@CurrentUser({ required: true }) user, @Res() res) {
		const { user_id } = user;
		return this.userService
			.getUserInfo(user_id)
			.then((user) => {
				const token = generateToken(user.id, user.team_id);
				setUserAuthorizationCookies(token, res);
				return { status: "REFRESHED", token: token };
			})
			.catch((err) => {
				Logger.error("UserController::refreshToken", "401 Bad request", { err });
				return { status: "REFRESHED_TOKEN_FAILED" };
			});
	}

	@Get("/logout")
	async logout(@Req() req, @Res() res) {
		clearUserAuthorizationCookies(res);
		res.redirect(resolvePathToFrontendURI("/"));
	}

	@Get("/init")
	initUser(@Req() req: any, @Res() res: any): Promise<boolean> {
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve, reject) => {
			try {
				if (getEdition() === EDITION_TYPE.OPEN_SOURCE) {
					const { token } = cookie.parse(req.headers.cookie || "");
					if (token && decodeToken(token)) {
						res.redirect(resolvePathToFrontendURI("/"));
						return resolve(res);
					}

					let user: iUser = await this.userV2Service.getOpenSourceUser();
					if (!user) {
						user = await this.userV2Service.createOpenSourceUser();
					}

					const generatedToken = generateToken(user.id, user.team_id);
					clearUserAuthorizationCookies(res);
					setUserAuthorizationCookies(generatedToken, res);
				}
				res.redirect(resolvePathToFrontendURI("/"));
				resolve(res);
			} catch (err) {
				reject(err);
			}
		});
	}
	/**
	 * Redirect user to new url
	 */
	@Get("/authenticate/google")
	authenticateWithGoogle(@Res() res: any, @QueryParams() params) {
		const { inviteCode, inviteType } = params;

		const scopes = ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"];

		const state = inviteCode && inviteType ? Buffer.from(JSON.stringify({ inviteCode, inviteType })).toString("base64") : null;
		const url = oauth2Client.generateAuthUrl({ scope: scopes, state: state });
		res.redirect(url);
	}
	/**
	 * Creates new user entry. And sends a link to DB.
	 */
	@Post("/signup")
	async createUser(@Body() userInfo: iSignupUserRequest, @Res() res) {
		const { email, inviteReferral } = userInfo;

		const userId = await this.userV2Service.createUserRecord(userInfo, false);
		const { teamId } = inviteReferral
			? await this.userV2Service.useReferral(userId, inviteReferral)
			: await this.userV2Service.createInitialUserWorkspace(userId, userInfo);

		const token = await this.userV2Service.setUserAuthCookies(userId, teamId, res);

		EmailManager.sendVerificationMail(email, generateVerificationCode(userId, email));
		return { status: USER_REGISTERED, token };
	}

	/**
	 * Endpoint to redirect to login with google.
	 * @param code
	 * @param res
	 */
	@Get("/authenticate/google/callback")
	async googleCallback(@QueryParam("code") code: string, @QueryParam("state") encodedState, @Res() res) {
		const { tokens } = await oauth2Client.getToken(code);
		const accessToken = tokens.access_token;
		let inviteCode;
		let inviteType;
		try {
			const jsonStr = Buffer.from(encodedState, "base64").toString("hex");
			const state = JSON.parse(jsonStr);
			inviteCode = state.inviteCode;
			inviteType = state.inviteType;
		} catch {}

		this.googleAPIService.setAccessToken(accessToken);
		const profileInfo = await this.googleAPIService.getProfileInfo();
		const { email, family_name, given_name } = profileInfo as any;

		const user = await this.userV2Service.getUserByEmail(email);
		let userId = user ? user.id : null;
		let teamId = user ? user.team_id : null;

		if (!user) {
			const inviteReferral = inviteType && inviteCode ? { type: inviteType, code: inviteCode } : null;

			const signUpUserInfo = {
				firstName: given_name,
				lastName: family_name,
				email: email,
				password: encryptPassword(Date.now().toString()),
				inviteReferral: inviteReferral,
			};
			userId = await this.userV2Service.createUserRecord(signUpUserInfo, true);

			const { teamId: _teamId } = inviteReferral
				? await this.userV2Service.useReferral(userId, inviteReferral)
				: await this.userV2Service.createInitialUserWorkspace(userId, signUpUserInfo);
			teamId = _teamId;
		}

		res.redirect(resolvePathToFrontendURI("/"));
		return true;
	}
}
