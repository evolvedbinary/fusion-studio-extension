import { PebbleCollection, PebblePermission, PebblePermissions, PebbleResource, PebbleItem } from "../classes/item";
import { PebbleConnection } from "../classes/connection";
// import { xml2js } from 'xml-js';

// const TEMP = '';

function readDate(data: string): Date {
  return new Date(data);
}
function readPermission(data: string): PebblePermission {
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
function readPermissions(data: string): PebblePermissions {
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
function readItem(data: any): PebbleItem {
  return {
    created: readDate(data['created'] || null),
    group: data['group'] || '',
    owner: data['owner'] || '',
    name: data['uri'] || '',
    permissions: readPermissions(data['mode'] || ''),
  };
}
async function get(connection: PebbleConnection, uri: string): Promise<Response> {
  const headers = new Headers();
  console.log('Basic ' + btoa(connection.username + ':' + connection.password));
  headers.append('Authorization', 'Basic ' + btoa(connection.username + ':' + connection.password));
  console.log(headers);
  return fetch(connection.server + uri,  { headers: {
    'Authorization': 'Basic ' + btoa(connection.username + ':' + connection.password)
  } });
}
async function readResource(data: any, connection: PebbleConnection, uri: string): Promise<PebbleResource> {
  return {
    ...readItem(data),
    lastModified: readDate(data['lastModified'] || null),
    content: await get(connection, '/exist/restxq/pebble/document?uri=' + uri).then(result => result.text()),
  };
}
function readCollection(data: any): PebbleCollection {
  return {
    ...readItem(data),
    collections: (data['collections'] || []).map((collection: any) => readCollection(collection)),
    resources: (data['documents'] || []).map((docoment: any) => readCollection(docoment)),
  };
}

async function load(connection: PebbleConnection, uri: string): Promise<PebbleCollection | PebbleResource> {
  // try {
    const result = await get(connection, '/exist/restxq/pebble/explorer?uri=' + uri).then(result => result.json());
    return 'collections' in result ? readCollection(result) : readResource(result, connection, uri);
  // } catch (e) {
  //   throw e;
  // }
}

async function connect(connection: PebbleConnection): Promise<PebbleCollection> {
  // try {
    const root = await load(connection, '/') as PebbleCollection;
    return root;
  // } catch (e) {
  //   throw e;
  // }
}

export const PebbleApi = {
  load,
  connect,
};