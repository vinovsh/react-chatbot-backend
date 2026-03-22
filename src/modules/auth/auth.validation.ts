import { isEmail, isRequired, minLength, validate } from '../../utils/validate';

export const validateSignup = validate({
  email: [isRequired, isEmail],
  password: [isRequired, minLength(8)],
  name: [isRequired],
  // timezone is optional; no specific validation rules
  timezone: [],
});

export const validateLogin = validate({
  email: [isRequired, isEmail],
  password: [isRequired]
});

export const validateRefresh = validate({
  refreshToken: [isRequired]
});

export const validateForgotPassword = validate({
  email: [isRequired, isEmail]
});

export const validateResetPassword = validate({
  token: [isRequired],
  password: [isRequired, minLength(8)]
});

