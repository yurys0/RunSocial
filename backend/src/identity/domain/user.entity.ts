export class User {
  constructor(
    readonly id: string,
    private _login: string,
    private _displayName: string,
    private _avatarKey: string | null,
    private _isPrivate: boolean,
    readonly createdAt: Date,
  ) {}

  get login(): string {
    return this._login;
  }

  changeLogin(login: string): void {
    const trimmed = login.trim();
    if (!trimmed) {
      throw new Error('login не может быть пустым');
    }
    this._login = trimmed;
  }

  get isPrivate(): boolean {
    return this._isPrivate;
  }

  setPrivate(isPrivate: boolean): void {
    this._isPrivate = isPrivate;
  }

  get displayName(): string {
    return this._displayName;
  }

  get avatarKey(): string | null {
    return this._avatarKey;
  }

  rename(displayName: string): void {
    const trimmed = displayName.trim();
    if (!trimmed) {
      throw new Error('displayName не может быть пустым');
    }
    this._displayName = trimmed;
  }

  attachAvatar(key: string): void {
    this._avatarKey = key;
  }

  detachAvatar(): void {
    this._avatarKey = null;
  }
}
