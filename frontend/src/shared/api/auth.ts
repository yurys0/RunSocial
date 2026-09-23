import SuperTokens from 'supertokens-web-js';
import EmailPassword from 'supertokens-web-js/recipe/emailpassword';
import Session from 'supertokens-web-js/recipe/session';
import { UserRoleClaim } from 'supertokens-web-js/recipe/userroles';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const ADMIN_ROLE = 'admin';

// VITE_API_URL — либо относительный префикс за nginx, либо полный адрес API в dev-режиме
const isAbsolute = /^https?:\/\//.test(API_URL);

export function initAuth(): void {
  SuperTokens.init({
    appInfo: {
      appName: 'RunSocial',
      apiDomain: isAbsolute ? API_URL : window.location.origin,
      apiBasePath: isAbsolute ? '/auth' : `${API_URL}/auth`,
    },
    recipeList: [EmailPassword.init(), Session.init()],
  });
}

// Тексты штатных проверок SuperTokens приходят по-английски, а их видит пользователь
const FIELD_ERRORS: Record<string, string> = {
  'This email already exists. Please sign in instead.': 'Логин уже занят',
  'Field is not optional': 'Поле обязательно',
};

type FormFieldError = { id: string; error: string };

export async function signIn(login: string, password: string): Promise<void> {
  const response = await EmailPassword.signIn({
    formFields: [
      { id: 'email', value: login },
      { id: 'password', value: password },
    ],
  });

  if (response.status === 'WRONG_CREDENTIALS_ERROR') {
    throw new Error('Неверный логин или пароль');
  }
  throwOnFieldError(response);
}

export async function signUp(
  login: string,
  password: string,
  displayName: string,
): Promise<void> {
  const response = await EmailPassword.signUp({
    formFields: [
      { id: 'email', value: login },
      { id: 'password', value: password },
      { id: 'displayName', value: displayName },
    ],
  });

  throwOnFieldError(response);
}

export function signOut(): Promise<void> {
  return Session.signOut();
}

export function hasSession(): Promise<boolean> {
  return Session.doesSessionExist();
}

export async function isAdmin(): Promise<boolean> {
  const roles = await Session.getClaimValue({ claim: UserRoleClaim });
  return roles?.includes(ADMIN_ROLE) ?? false;
}

function throwOnFieldError(response: {
  status: string;
  formFields?: FormFieldError[];
  reason?: string;
}): void {
  if (response.status === 'OK') {
    return;
  }
  const field = response.formFields?.[0];
  const message = field ? (FIELD_ERRORS[field.error] ?? field.error) : response.reason;
  throw new Error(message ?? 'Не удалось выполнить вход');
}
