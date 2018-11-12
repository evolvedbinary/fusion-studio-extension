import { PebbleCollection, PebblePermission, PebblePermissions, PebbleDocument, PebbleItem } from "../classes/item";
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
  return fetch(connection.server + uri,  connection.username === '' ? undefined : {
    headers: {
      Authorization: 'Basic ' + btoa(connection.username + ':' + connection.password),
    }
  });
}
async function remove(connection: PebbleConnection, uri: string): Promise<Response> {
  const options: any = {
    method: 'DELETE',
  };
  if (connection.username !== '') {
    options.headers = { Authorization: 'Basic ' + btoa(connection.username + ':' + connection.password) };
  }
  return fetch(connection.server + uri, options);
}
async function put(connection: PebbleConnection, uri: string, body: any): Promise<Response> {
  const headers: any = {};
  if (connection.username !== '') {
    headers.Authorization = 'Basic ' + btoa(connection.username + ':' + connection.password);
  }
  console.log(headers);
  return fetch(connection.server + uri, {
    headers,
    method: 'PUT',
    body,
  }).then(result => {
    console.log('put', result);
    return result;
  });
}
async function readDocument(data: any, connection: PebbleConnection, uri: string): Promise<PebbleDocument> {
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
    documents: (data['documents'] || []).map((docoment: any) => readCollection(docoment)),
  };
}

async function load(connection: PebbleConnection, uri: string): Promise<PebbleCollection | PebbleDocument> {
  // try {
    const result = await get(connection, '/exist/restxq/pebble/explorer?uri=' + uri).then(result => result.json());
    return 'collections' in result ? readCollection(result) : readDocument(result, connection, uri);
  // } catch (e) {
  //   throw e;
  // }
}

async function save(connection: PebbleConnection, uri: string, content: string = ' '): Promise<boolean> {
  // try {
    const result = await put(connection, '/exist/restxq/pebble/document?uri=' + uri, content).then(result => result.json()).catch(err => console.log('save failed', err));
    console.log('saved:', result);
    return true;
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
async function removeDoc(connection: PebbleConnection, uri: string): Promise<boolean> {
  // try {
    return remove(connection, '/exist/restxq/pebble/document?uri=' + uri).then(result => result.status === 204)
      .then(result => true)
      .catch(err => false);
  // } catch (e) {
  //   throw e;
  // }
}

export const PebbleApi = {
  load,
  save,
  connect,
  remove: removeDoc,
};