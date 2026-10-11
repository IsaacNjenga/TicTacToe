export const authCookies = {
	accessToken: 'tic_tac_toe_access_token',
	refreshToken: 'tic_tac_toe_refresh_token',
	user: 'tic_tac_toe_user'
} as const;

export interface AuthUser {
	id: string;
	email: string;
	avatar: string | null;
	username: string;
}

export interface LoginResult {
	token: string;
	refreshToken: string;
	user: AuthUser;
}
