import * as Hash from 'ripemd160';
export interface PebbleAttributes {
  [k: string]: string;
}

export interface PebbleUser {
  userName: string;
  enabled: boolean;
  expired: boolean;
  primaryGroup: string;
  groups: string[];
  metadata: PebbleAttributes;
};
export interface PebbleUserData extends PebbleUser {
  password: string;
};
export interface PebbleGroup {
  groupName: string;
  managers: string[];
  metadata: PebbleAttributes;
};

export function encodePassword(password: string): string {
  return password;
}

export function writeUserData(user: PebbleUserData): string {
  return JSON.stringify({
    ...user,
    password: new Hash().update(user.password).digest('base64'),
    metadata: Object.keys(user.metadata).map(key => ({ key, value: user.metadata[key] })),
  });
}