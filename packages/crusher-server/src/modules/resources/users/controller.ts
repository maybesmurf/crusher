import { Authorized, Body, CurrentUser, Get, JsonController, Post, QueryParam, QueryParams, Req, Res } from "routing-controllers";
import { Inject, Service } from "typedi";
import { UserService } from "@modules/resources/users/service";
import { resolvePathToBackendURI, resolvePathToFrontendURI } from "@utils/uri";
import GoogleAPIService from "@core/services/GoogleAPIService";
import { EMAIL_VERIFIED_WITH_VERIFICATION_CODE, USER_REGISTERED } from "@constants";
import { clearUserAuthorizationCookies, setUserAuthorizationCookies } from "@utils/cookies";
import { getEdition } from "@utils/helper";
import { EDITION_TYPE } from "@crusher-shared/types/common/general";
import { iUser } from "@crusher-shared/types/db/iUser";
import { EmailManager } from "@manager/EmailManager";
import { decodeToken, encryptPassword, generateToken, generateVerificationCode } from "@utils/auth";
import { google } from "googleapis";
import { iSignupUserRequest } from "@crusher-shared/types/request/signupUserRequest";
import { IUserAndSystemInfoResponse } from "@crusher-shared/types/response/IUserAndSystemInfoResponse";
import * as cookie from "cookie";

let oauth2Client = null;

if (process.env.BACKEND_URL) {
	oauth2Client = new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		resolvePathToBackendURI("/v2/user/authenticate/google/callback"),
	);
}

@Service()
@JsonController("/user")
export class UserController {
	@Inject()
	private userService: UserService;
	@Inject()
	private googleAPIService: GoogleAPIService;

	// @OSS
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

					let user: iUser = await this.userService.getOpenSourceUser();
					if (!user) {
						user = await this.userService.createOpenSourceUser();
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

	@Get("/authenticate/google")
	async authenticateWithGoogle(@Res() res: any, @QueryParams() params) {
		if (!oauth2Client) {
			throw new Error("This functionality is not supported");
		}

		const { inviteCode, inviteType } = params;

		const scopes = ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"];

		const state = inviteCode && inviteType ? Buffer.from(JSON.stringify({ inviteCode, inviteType })).toString("base64") : null;
		const url = oauth2Client.generateAuthUrl({ scope: scopes, state: state });
		return res.redirect(url);
	}

	@Post("/signup")
	async createUser(@Body() userInfo: iSignupUserRequest, @Res() res) {
		const { firstName, lastName, email, password, inviteReferral } = userInfo;

		const userId = await this.userService.createUserRecord(userInfo, false);
		const { teamId } = inviteReferral
			? await this.userService.useReferral(userId, inviteReferral)
			: await this.userService.createInitialUserWorkspace(userId, userInfo);

		const token = await this.userService.setUserAuthCookies(userId, teamId, res);
		const systemInfo = await this.userService.getUserAndSystemInfo(userId);

		EmailManager.sendVerificationMail(email, generateVerificationCode(userId, email));
		return {
			status: USER_REGISTERED,
			token,
			systemInfo,
		};
	}

	@Get("/authenticate/google/callback")
	async googleCallback(@QueryParam("code") code: string, @QueryParam("state") encodedState, @Res() res) {
		if (!oauth2Client) {
			throw new Error("This functionality is not supported");
		}

		const { tokens } = await oauth2Client.getToken(code);
		const accessToken = tokens.access_token;
		let inviteCode, inviteType;
		try {
			const jsonStr = Buffer.from(encodedState, "base64").toString("hex");
			const state = JSON.parse(jsonStr);
			inviteCode = state.inviteCode;
			inviteType = state.inviteType;
		} catch (err) {}

		this.googleAPIService.setAccessToken(accessToken);
		const profileInfo = await this.googleAPIService.getProfileInfo();
		const { email, family_name, given_name } = profileInfo as any;

		const user = await this.userService.getUserByEmail(email);
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
			userId = await this.userService.createUserRecord(signUpUserInfo, true);

			const { teamId: _teamId } = inviteReferral
				? await this.userService.useReferral(userId, inviteReferral)
				: await this.userService.createInitialUserWorkspace(userId, signUpUserInfo);
			teamId = _teamId;
		}

		const token = await this.userService.setUserAuthCookies(userId, teamId, res);
		res.redirect(resolvePathToFrontendURI("/"));
		return true;
	}

	@Post("/login")
	async loginUser(@Body() info: any, @Res() res: any) {
		const { email, password } = info;
		const { status, token, userId } = await this.userService.authenticateWithEmailAndPassword({
			email,
			password,
		});

		const systemInfo = await this.userService.getUserAndSystemInfo(userId);

		if (token) {
			setUserAuthorizationCookies(token, res);
			return {
				status,
				systemInfo,
			};
		}
		return { status, systemInfo };
	}

	@Get("/getUserAndSystemInfo")
	async getUserAndSystemInfo(@CurrentUser() user): Promise<IUserAndSystemInfoResponse> {
		const { user_id } = user;

		return this.userService.getUserAndSystemInfo(user_id);
	}

	@Authorized()
	@Get("/verify")
	async verifyUser(@CurrentUser({ required: true }) user, @QueryParams() params, @Res() res) {
		const { code } = params;
		const { user_id } = decodeToken(code);
		if (user_id === user.user_id) {
			await this.userService.verify(user_id);
			res.redirect(resolvePathToFrontendURI("/"));
			return { status: EMAIL_VERIFIED_WITH_VERIFICATION_CODE };
		}

		res.redirect(resolvePathToFrontendURI("/"));
	}

	@Authorized()
	@Post("/resendVerification")
	async resendVerificationLink(@CurrentUser({ required: true }) user) {
		return this.userService.resendVerification(user.user_id);
	}

	@Get("/logout")
	async logout(@Req() req, @Res() res) {
		clearUserAuthorizationCookies(res);
		res.redirect(resolvePathToFrontendURI("/"));
	}
}