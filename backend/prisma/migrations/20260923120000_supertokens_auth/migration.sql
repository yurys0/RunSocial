-- Ядро SuperTokens держит свои таблицы отдельно от схемы приложения
CREATE SCHEMA IF NOT EXISTS "supertokens";

-- Пароли и роли переехали в SuperTokens, id пользователя приходит оттуда же
ALTER TABLE "User" DROP COLUMN "passwordHash";
