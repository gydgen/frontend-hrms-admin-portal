export interface ResetPasswordData {
	verificationCode: string;
	email: string;
	newPassword: string;
	confirmPassword: string;
}

export interface ChangePasswordData {
	oldPassword: string;
	newPassword: string;
	confirmPassword: string;
}
