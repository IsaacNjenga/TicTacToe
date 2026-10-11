export interface SignupDTO {
  username: string;
  email: string;
  password: string;
  avatar?: string;
}

export interface SigninDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface ChangePasswordDTO {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export interface VerifyOtpDTO {
  email: string;
  otp: string;
}

export interface ResetPasswordDTO {
  email: string;
  newPassword: string;
}

export interface RequestEmailDTO {
  email: string;
}

export interface RequestPasswordResetDTO {
  email: string;
}
