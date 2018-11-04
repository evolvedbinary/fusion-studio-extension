export interface PebblePermission {
  read: boolean,
  write: boolean,
  execute: boolean,
}
export interface PebblePermissions {
  user: PebblePermission,
  group: PebblePermission,
  other: PebblePermission,
}
export interface PebbleItem {
  name: string;
  created?: Date;
  owner: string;
  group: string;
  permissions?: PebblePermissions
}
export interface PebbleResource extends PebbleItem {
  lastModified?: Date;
  content: string;
}
export interface PebbleCollection extends PebbleItem {
  collections: PebbleCollection[];
  resources: PebbleResource[];
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
  export function isCollection(obj: any): obj is PebbleItem {
    return PebbleItem.is(obj)
      && 'collections' in obj
      && 'resources' in obj;
  }
  export function isResource(obj: any): obj is PebbleItem {
    return PebbleItem.is(obj)
      && 'content' in obj
      && 'lastModified' in obj;
  }
}