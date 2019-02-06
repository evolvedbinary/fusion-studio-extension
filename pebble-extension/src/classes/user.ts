import * as Hash from 'ripemd160';
export type FSUserAttributes = {
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
export const FS_USER_ATTRIBUTE_LABELS: FSUserAttributes = {
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
export const FS_USER_ATTRIBUTES: FSUserAttributes = {
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

export interface FSUser {
  userName: string;
  enabled: boolean;
  expired: boolean;
  primaryGroup: string;
  groups: string[];
  metadata: FSUserAttributes;
};
export interface FSUserData extends FSUser {
  password: string | null;
};

export function encodePassword(password: string): string {
  return password;
}

export function sameUser(user1: FSUser, user2: FSUser): boolean {
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

export function writeUserData(user: FSUserData): string {
  const password = user.password === null ? null : new Hash().update(user.password).digest('base64');
  return JSON.stringify({
    ...user,
    password,
    metadata: Object.keys(user.metadata).map(key => ({ key: FS_USER_ATTRIBUTES[key], value: user.metadata[key] })),
  });
}

export function readUser(userData: any): FSUser {
  if (typeof userData === 'string') {
    userData = JSON.parse(userData);
  }
  const metadata: FSUserAttributes = {};
  userData.metadata.forEach((attribute: any) => {
    Object.keys(FS_USER_ATTRIBUTES).find(v => {
      if (FS_USER_ATTRIBUTES[v] == attribute.key) {
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
