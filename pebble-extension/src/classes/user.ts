import * as Hash from 'ripemd160';
export type PebbleUserAttributes = {
  alias?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  country?: string;
  language?: string;
  timezone?: string;
  description?: string;
  [k: string]: string | undefined;
}
export const PEBBLE_USER_ATTRIBUTE_LABELS: PebbleUserAttributes = {
  alias:  'alias',
  firstName:  'first name',
  lastName:  'last name',
  fullName:  'full name',
  email:  'email',
  country:  'country',
  language:  'language',
  timezone:  'timezone',
  description:  'description',
};
export const PEBBLE_USER_ATTRIBUTES: PebbleUserAttributes = {
  alias:  'http://axschema.org/namePerson/friendly',
  firstName:  'http://axschema.org/namePerson/first',
  lastName:  'http://axschema.org/namePerson/last',
  fullName:  'http://axschema.org/namePerson',
  email:  'http://axschema.org/contact/email',
  country:  'http://axschema.org/contact/country/home',
  language:  'http://axschema.org/pref/language',
  timezone:  'http://axschema.org/pref/timezone',
  description:  'http://exist-db.org/security/description',
};

export interface PebbleUser {
  userName: string;
  enabled: boolean;
  expired: boolean;
  primaryGroup: string;
  groups: string[];
  metadata: PebbleUserAttributes;
};
export interface PebbleUserData extends PebbleUser {
  password: string;
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
    metadata: Object.keys(user.metadata).map(key => ({ key: PEBBLE_USER_ATTRIBUTES[key], value: user.metadata[key] })),
  });
}

export function readUser(userData: any): PebbleUser {
  if (typeof userData === 'string') {
    userData = JSON.parse(userData);
  }
  const metadata: PebbleUserAttributes = {};
  userData.metadata.forEach((attribute: any) => {
    Object.keys(PEBBLE_USER_ATTRIBUTES).find(v => {
      if (PEBBLE_USER_ATTRIBUTES[v] == attribute.key) {
        metadata[v] = attribute.value || '';
        return true;
      }
      return false;
    });
  });
  return {
    ...userData,
    metadata,
  };
}
