import { PebbleCollection, PebblePermission, PebblePermissions, PebbleResource, PebbleItem } from "../classes/item";
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
async function readResource(data: any, server: string, uri: string): Promise<PebbleResource> {
  return {
    ...readItem(data),
    lastModified: readDate(data['lastModified'] || null),
    content: 'uri',
    // TODO: add cors config to the api
    // content: await fetch(server + '/exist/rest' + uri).then(result => result.text()),
  };
}
function readCollection(data: any): PebbleCollection {
  return {
    ...readItem(data),
    collections: (data['collections'] || []).map((collection: any) => readCollection(collection)),
    resources: (data['documents'] || []).map((docoment: any) => readCollection(docoment)),
  };
}

async function load(server: string, uri: string): Promise<PebbleCollection | PebbleResource> {
  const result = await fetch(server + '/exist/restxq/pebble/explorer?uri=' + uri).then(result => result.json());
  return 'collections' in result ? readCollection(result) : readResource(result, server, uri);
}

async function connect(server: string): Promise<PebbleCollection> {
  const root = await load(server, '/') as PebbleCollection;
  return root;
}

export const PebbleApi = {
  load,
  connect,
};