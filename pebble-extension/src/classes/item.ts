export type FSPermissionType = 'read' | 'write' | 'execute' | 'special';
export const FS_PERMISSION_TYPES = ['read', 'write', 'execute', 'special'];
export type FSPermissionScope = 'user' | 'group' | 'other';
export const FS_PERMISSION_SCOPES = ['user', 'group', 'other'];
export const FS_PERMISSION_SPECIAL = [ 'setUID', 'setGID', 'sticky' ];

export interface ACE {
  mode: FSPermission;
  target: 'USER' | 'GROUP';
  accessType: 'ALLOWED' | 'DENIED';
  who: string;
}

export type FSSpecialPermission = {
  setUID: boolean,
  setGID: boolean,
  sticky: boolean,
}
export type FSPermission = {
  [K in FSPermissionType]: boolean;
}
export type FSPebblePermissions = {
  [K in FSPermissionScope]: FSPermission;
}
export interface FSItem {
  name: string;
  created: Date;
  owner: string;
  group: string;
  permissions?: FSPermissions;
  acl: ACE[];
}
export interface FSDocument extends FSItem {
  lastModified: Date;
  binaryDoc: boolean,
  content: string;
  size: number;
  mediaType: string;
}
export interface FSCollection extends FSItem {
  collections: FSCollection[];
  documents: FSDocument[];
}


export namespace FSItem {
  export function is(obj: any): obj is FSItem {
    return !!obj
      && 'name' in obj
      && 'created' in obj
      && 'owner' in obj
      && 'group' in obj
      && 'permissions' in obj;
  }
  export function isCollection(obj: any): obj is FSCollection {
    return FSItem.is(obj)
      && 'collections' in obj
      && 'documents' in obj;
  }
  export function isDocument(obj: any): obj is FSDocument {
    return FSItem.is(obj)
      && (
        ('content' in obj && 'lastModified' in obj)
        || !FSItem.isCollection(obj)
      );
  }
}

export const DEFAULT_PERMISSIONS = readPermissions('');

export function fromPermissions(data?: FSPermissions): FSPermissions {
  data = data || DEFAULT_PERMISSIONS;
  return {
    group: {
      execute: data.group.execute,
      read: data.group.read,
      write: data.group.write,
      special: data.group.special,
    },
    user: {
      execute: data.user.execute,
      read: data.user.read,
      write: data.user.write,
      special: data.user.special,
    },
    other: {
      execute: data.other.execute,
      read: data.other.read,
      write: data.other.write,
      special: data.other.special,
    },
  }
}
export function readDate(data: string): Date {
  return new Date(data);
}
export function writeSpecialPermission(data: FSPermissions, result: string): string {
  const arr = result.split('');
  if (data.user.special) {
    arr[2] = data.user.execute ? 's' : 'S';
  }
  if (data.group.special) {
    arr[5] = data.group.execute ? 's' : 'S';
  }
  if (data.other.special) {
    arr[8] = data.other.execute ? 't' : 'T';
  }
  return arr.join('');
}
export function writePermission(data: FSPermission): string {
  return (data.read ? 'r' : '-') + (data.write ? 'w' : '-') + (data.execute ? 'x' : '-');
}
export function readPermission(data: string): FSPermission {
  if (data.length !== 3) {
    return {
      read: false,
      write: false,
      execute: false,
      special: false,
    }
  }
  return {
    read: data[0] === 'r',
    write: data[1] === 'w',
    execute: (data[2] === 'x') || (data[2] === 's') || (data[2] === 't'),
    special: (data[2] === 's') || (data[2] === 'S') || (data[2] === 't') || (data[2] === 'T'),
  }
}
export function samePermissions(data1?: FSPermissions, data2?: FSPermissions): boolean {
  data1 = data1 || DEFAULT_PERMISSIONS;
  data2 = data2 || DEFAULT_PERMISSIONS;
  for (let scope of FS_PERMISSION_SCOPES) {
    for (let type of FS_PERMISSION_TYPES) {
      if ((data1 as any)[scope][type] !== (data2 as any)[scope][type]) {
        return false;
      }
    }
  }
  return true;
}
export function writePermissions(data?: FSPermissions): string {
  data = data || DEFAULT_PERMISSIONS;
  return writeSpecialPermission(data, writePermission(data.user) + writePermission(data.group) + writePermission(data.other));
}
export function readPermissions(data: string): FSPermissions {
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
export function readItem(data: any, group = '', owner = ''): FSItem {
  return {
    created: readDate(data['created'] || null),
    group: data['group'] || group,
    owner: data['owner'] || owner,
    name: data['uri'] || '',
    acl: (data['acl'] || []).map((ace: any) => {
      ace.mode = readPermission(ace.mode);
      return ace;
    }),
    permissions: readPermissions(data['mode'] || ''),
  };
}

