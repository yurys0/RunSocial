// ключ объекта в S3 совпадает с путём GET /avatars/:userId/:fileId, адрес API подставляет фронт
export function avatarUrl(avatarKey: string | null): string | null {
  return avatarKey ? `/${avatarKey}` : null;
}
