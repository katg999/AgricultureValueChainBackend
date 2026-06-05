export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number;
    tokenType: string;
    userId: string;
    username: string;
    roles: string[];
    email: string;
  };
}
export interface OtpVerifyRequest {
  tempToken: string;
  otpCode: string;
}

export interface OtpVerifyResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  cooperativeId?: string;
  branchId?: string;
  permissions: string[];
}

export interface ForgotPasswordRequest {
  emailOrPhone: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  otpCode: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SignupRequest {
  cooperativeName: string;
  registrationNumber: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
  address: string;
  branchName: string;
  branchCode: string;
  geographicArea: string;
  branchAddress: string;
  adminFullName: string;
  adminEmail: string;
  adminPhone: string;
  password: string;
  confirmPassword: string;
}

export interface SignupResponse {
  message: string;
  cooperativeId: string;
  branchId: string;
  userId: string;
}
