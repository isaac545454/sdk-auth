export type AuthErrorCode = 'INVALID_INPUT' | 'EMAIL_IN_USE' | 'INVALID_CREDENTIALS';

export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}
