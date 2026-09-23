import { PrismaClient } from '@prisma/client';

type LegacyUser = { id: string; login: string; passwordHash: string };

type ImportResponse = { status: string; user?: { id: string } };
type MappingResponse = { status: string };

/**
 * Разовый перенос паролей в SuperTokens при переходе на него с собственной
 * аутентификации. Запускать до миграции, которая удаляет колонку passwordHash.
 * Аккаунт в ядре получает свой идентификатор, а наш User.id привязывается к нему
 * внешним: на него ссылаются пробежки, лайки, трекеры и дружбы.
 */
async function main(): Promise<void> {
  const core = requireEnv('SUPERTOKENS_CONNECTION_URI').replace(/\/$/, '');
  const prisma = new PrismaClient();

  const users = await readLegacyUsers(prisma);
  if (users.length === 0) {
    console.log('Переносить нечего: пользователей с паролями нет.');
    return;
  }

  let imported = 0;
  let skipped = 0;

  for (const user of users) {
    const result = await call<ImportResponse>(core, '/recipe/user/passwordhash/import', {
      email: user.login,
      passwordHash: user.passwordHash,
      hashingAlgorithm: 'bcrypt',
    });
    if (result.status !== 'OK' || !result.user) {
      throw new Error(`${user.login}: ядро отклонило хэш (${result.status})`);
    }

    const mapping = await call<MappingResponse>(core, '/recipe/userid/map', {
      superTokensUserId: result.user.id,
      externalUserId: user.id,
    });

    if (mapping.status === 'USER_ID_MAPPING_ALREADY_EXISTS_ERROR') {
      skipped++;
      continue;
    }
    if (mapping.status !== 'OK') {
      throw new Error(`${user.login}: не удалось привязать идентификатор (${mapping.status})`);
    }
    imported++;
  }

  console.log(`Перенесено: ${imported}, уже было перенесено: ${skipped}.`);
  await prisma.$disconnect();
}

async function readLegacyUsers(prisma: PrismaClient): Promise<LegacyUser[]> {
  try {
    return await prisma.$queryRaw<LegacyUser[]>`
      SELECT id, login, "passwordHash" FROM "User" ORDER BY "createdAt"
    `;
  } catch {
    throw new Error(
      'Не удалось прочитать колонку passwordHash: миграция уже применена, переносить нечего или поздно.',
    );
  }
}

async function call<T>(core: string, path: string, body: unknown): Promise<T> {
  const apiKey = process.env.SUPERTOKENS_API_KEY;
  const response = await fetch(`${core}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'api-key': apiKey } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`${path}: ядро ответило ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as T;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Не задана переменная ${name}`);
  }
  return value;
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
