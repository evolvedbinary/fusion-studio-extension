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