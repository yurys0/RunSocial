export function avatarUrl(avatarKey: string | null): string | null {
  return avatarKey ? `/${avatarKey}` : null;
}
