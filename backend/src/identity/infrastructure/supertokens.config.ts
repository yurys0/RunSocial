import { ConfigService } from '@nestjs/config';
import supertokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import UserRoles from 'supertokens-node/recipe/userroles';
import { TypeInput } from 'supertokens-node/types';

import { UserRepository } from '../domain/user.repository';

/** Логин пользователя SuperTokens хранит в поле email: формата адреса ядро не требует. */
export const LOGIN_FIELD = 'email';
export const PASSWORD_FIELD = 'password';
export const DISPLAY_NAME_FIELD = 'displayName';

export function buildSuperTokensOptions(
  config: ConfigService,
  users: UserRepository,
): TypeInput & { framework: 'express' } {
  const origin = config.getOrThrow<string>('PUBLIC_ORIGIN');

  return {
    framework: 'express',
    supertokens: {
      connectionURI: config.getOrThrow<string>('SUPERTOKENS_CONNECTION_URI'),
      apiKey: config.get<string>('SUPERTOKENS_API_KEY'),
    },
    appInfo: {
      appName: 'RunSocial',
      apiDomain: origin,
      websiteDomain: origin,
      apiBasePath: '/auth',
      // nginx срезает /api, поэтому у браузера путь длиннее, чем у бэкенда
      apiGatewayPath: '/api',
      websiteBasePath: '/login',
    },
    recipeList: [
      EmailPassword.init({
        signUpFeature: {
          formFields: [
            { id: LOGIN_FIELD, validate: validateLogin },
            { id: PASSWORD_FIELD, validate: validatePassword },
            { id: DISPLAY_NAME_FIELD, validate: validateDisplayName },
          ],
        },
        override: {
          apis: (original) => ({
            ...original,
            signUpPOST: async (input) => {
              const response = await original.signUpPOST!(input);
              if (response.status !== 'OK') {
                return response;
              }

              try {
                await users.create({
                  id: response.user.id,
                  login: formFieldValue(input.formFields, LOGIN_FIELD),
                  displayName: formFieldValue(input.formFields, DISPLAY_NAME_FIELD),
                });
              } catch (error) {
                // Иначе в ядре остался бы аккаунт без профиля, и вход вёл бы в никуда
                await supertokens.deleteUser(response.user.id);
                throw error;
              }
              return response;
            },
          }),
        },
      }),
      Session.init({
        // SSE не умеет слать заголовки, поэтому сессия всегда живёт в cookie
        getTokenTransferMethod: () => 'cookie',
      }),
      UserRoles.init(),
    ],
  };
}

type FormField = { id: string; value: unknown };

function formFieldValue(formFields: FormField[], id: string): string {
  return String(formFields.find((field) => field.id === id)?.value ?? '').trim();
}

async function validateLogin(value: unknown): Promise<string | undefined> {
  const login = typeof value === 'string' ? value.trim() : '';
  if (login.length < 1 || login.length > 50) {
    return 'Логин должен быть от 1 до 50 символов';
  }
  return undefined;
}

/** По брифу требований к сложности пароля нет. */
async function validatePassword(value: unknown): Promise<string | undefined> {
  if (typeof value !== 'string' || value.length < 1) {
    return 'Пароль не может быть пустым';
  }
  return undefined;
}

async function validateDisplayName(value: unknown): Promise<string | undefined> {
  const displayName = typeof value === 'string' ? value.trim() : '';
  if (displayName.length < 1 || displayName.length > 100) {
    return 'Имя должно быть от 1 до 100 символов';
  }
  return undefined;
}
