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

export function sameUser(user1: PebbleUser, user2: PebbleUser): boolean {
  const same =
    (user1.enabled === user2.enabled) &&
    (user1.expired === user2.expired) &&
    (user1.primaryGroup === user2.primaryGroup);
  if (same) {
    if (user1.groups.length !== user2.groups.length) {
      return false
    }
    if (user1.groups.find(group => user2.groups.indexOf(group) < 0)) {
      return false
    }
    if (Object.keys(user1.metadata).length !== Object.keys(user2.metadata).length) {
      return false
    }
    if (Object.keys(user1.metadata).find(key => user2.metadata[key] != user1.metadata[key])) {
      return false
    }
    return true;
  }
  return false
}

export function writeUserData(user: PebbleUserData): string {
  return JSON.stringify({
    ...user,
    password: new Hash().update(user.password).digest('base64'),
    metadata: Object.keys(user.metadata).map(key => ({ key, value: user.metadata[key] })),
  });
}

export function readUser(userData: any): PebbleUser {
  if (typeof userData === 'string') {
    userData = JSON.parse(userData);
  }
  const metadata: PebbleAttributes = {};
  userData.metadata.forEach((attribute: any) => metadata[attribute.key] = attribute.value || '');
  return {
    ...userData,
    metadata,
  };
}
