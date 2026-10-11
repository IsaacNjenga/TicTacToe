import { apiClient } from '$lib/services/api/client';
import type { ServiceContext } from '../api/types';

export interface SignInInput {
	email: string;
	password: string;
}

export interface SignUpInput extends SignInInput {
	username: string;
}

export interface RequestOTPInput {
	email: string;
}

export interface VerifyOTPInput {
	email: string;
	otp: string;
}

export interface ResetPasswordInput {
	email: string;
	newPassword: string;
}

export interface SignInResponse {
	token?: string;
	refreshToken?: string;
	user?: {
		id: string;
		email: string;
		avatar: string | null;
		username: string;
	};
	message?: string;
}

export interface SignUpResponse {
	id: string;
	username: string;
	email: string;
	avatar: string | null;
	message?: string;
}

export interface RequestOTPResponse {
	message?: string;
}

export interface VerifyOTPResponse {
	message?: string;
}

export interface ResetPasswordResponse {
	message?: string;
}

export const authService = {
	async fetchSignIn(input: SignInInput, context?: ServiceContext): Promise<SignInResponse> {
		return apiClient.post<SignInResponse>('/auth/sign-in', input, context);
	},

	async fetchSignUp(input: SignUpInput, context?: ServiceContext): Promise<SignUpResponse> {
		return apiClient.post<SignUpResponse>('/auth/sign-up', input, context);
	},

	async fetchRequestOtp(
		input: RequestOTPInput,
		context?: ServiceContext
	): Promise<RequestOTPResponse> {
		return apiClient.post<RequestOTPResponse>('/auth/password-reset/request-otp', input, context);
	},

	async fetchVerifyOtp(
		input: VerifyOTPInput,
		context?: ServiceContext
	): Promise<VerifyOTPResponse> {
		return apiClient.post<VerifyOTPResponse>('/auth/password-reset/verify-otp', input, context);
	},

	async fetchPasswordReset(
		input: ResetPasswordInput,
		context?: ServiceContext
	): Promise<ResetPasswordResponse> {
		return apiClient.post<ResetPasswordResponse>('/auth/password-reset/reset', input, context);
	}
};
