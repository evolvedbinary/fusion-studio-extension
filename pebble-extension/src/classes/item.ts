export type PebblePermissionType = 'read' | 'write' | 'execute';
export const PERMISSION_TYPES = ['read', 'write', 'execute'];
export type PebblePermissionScope = 'user' | 'group' | 'other';
export const PERMISSION_SCOPES = ['user', 'group', 'other'];

export type PebblePermissionCheckboxes = {
  [K: string]: {
    [P: string]: HTMLInputElement;
  }
}


export type PebblePermission = {
  [K in PebblePermissionType]: boolean;
}
export type PebblePermissions = {
  [K in PebblePermissionScope]: PebblePermission;
}
export interface PebbleItem {
  name: string;
  created: Date;
  owner: string;
  group: string;
  permissions?: PebblePermissions;
  acl: string[];
}
export interface PebbleDocument extends PebbleItem {
  lastModified: Date;
  binaryDoc: boolean,
  content: string;
  size: number;
  mediaType: string;
}
export interface PebbleCollection extends PebbleItem {
  collections: PebbleCollection[];
  documents: PebbleDocument[];
}


export namespace PebbleItem {
  export function is(obj: any): obj is PebbleItem {
    return !!obj
      && 'name' in obj
      && 'created' in obj
      && 'owner' in obj
      && 'group' in obj
      && 'permissions' in obj;
  }
  export function isCollection(obj: any): obj is PebbleCollection {
    return PebbleItem.is(obj)
      && 'collections' in obj
      && 'documents' in obj;
  }
  export function isDocument(obj: any): obj is PebbleDocument {
    return PebbleItem.is(obj)
      && (
        ('content' in obj && 'lastModified' in obj)
        || !PebbleItem.isCollection(obj)
      );
  }
}

export const DEFAULT_PERMISSIONS = readPermissions('');

export function fromPermissions(data?: PebblePermissions): PebblePermissions {
  data = data || DEFAULT_PERMISSIONS;
  return {
    group: {
      execute: data.group.execute,
      read: data.group.read,
      write: data.group.write,
    },
    user: {
      execute: data.user.execute,
      read: data.user.read,
      write: data.user.write,
    },
    other: {
      execute: data.other.execute,
      read: data.other.read,
      write: data.other.write,
    },
  }
}
export function readDate(data: string): Date {
  return new Date(data);
}
export function writePermission(data: PebblePermission): string {
  return (data.read ? 'r' : '-') + (data.write ? 'w' : '-') + (data.execute ? 'x' : '-');
}
export function readPermission(data: string): PebblePermission {
  if (data.length !== 3) {
    return {
      read: false,
      write: false,
      execute: false,
    }
  }
  return {
    read: data[0] === 'r',
    write: data[1] === 'w',
    execute: data[2] === 'x',
  }
}
export function samePermissions(data1?: PebblePermissions, data2?: PebblePermissions): boolean {
  data1 = data1 || DEFAULT_PERMISSIONS;
  data2 = data2 || DEFAULT_PERMISSIONS;
  for (let scope of PERMISSION_SCOPES) {
    for (let type of PERMISSION_TYPES) {
      if ((data1 as any)[scope][type] !== (data2 as any)[scope][type]) {
        return false;
      }
    }
  }
  return true;
}
export function writePermissions(data?: PebblePermissions): string {
  data = data || DEFAULT_PERMISSIONS;
  return writePermission(data.user) + writePermission(data.group) + writePermission(data.other);
}
export function readPermissions(data: string): PebblePermissions {
  if (data.length !== 9) {
    return {
      user: readPermission(''),
      group: readPermission(''),
      other: readPermission(''),
    }
  }
  return {
    user: readPermission(data.substr(0, 3)),
    group: readPermission(data.substr(3, 3)),
    other: readPermission(data.substr(6, 3)),
  }
}
export function readItem(data: any, group = '', owner = ''): PebbleItem {
  return {
    created: readDate(data['created'] || null),
    group: data['group'] || group,
    owner: data['owner'] || owner,
    name: data['uri'] || '',
    acl: data['acl'] || [],
    permissions: readPermissions(data['mode'] || ''),
  };
}

