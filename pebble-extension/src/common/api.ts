import { PebbleCollection, PebblePermission, PebblePermissions, PebbleDocument, PebbleItem } from "../classes/item";
import { PebbleConnection } from "../classes/connection";
import { createError, Error } from "./error";
import { PebbleFileList } from "./files";
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
async function put(connection: PebbleConnection, uri: string, body: any = '', binary = false): Promise<Response> {
  const useBody = (typeof body === 'string') || (body instanceof Blob);
  const headers: any = {};
  if (connection.username !== '') {
    headers.Authorization = 'Basic ' + btoa(connection.username + ':' + connection.password);
  }
  if (binary) {
    headers['Content-Type'] = 'application/octet-stream';
  }
  if (!useBody) {
    headers['Content-Type'] = 'multipart/form-data';
    const formData = new FormData();
    for (let i in body) {
      formData.append(i, body[i]);
    }
    body = formData;
  }
  return fetch(connection.server + uri, {
    headers,
    method: 'PUT',
    body
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
  try {
    const result = await get(connection, '/exist/restxq/pebble/explorer?uri=' + uri);
    switch (result.status) {
      case 200:
        const object = await result.json();
        return 'collections' in object ? readCollection(object) : readDocument(object, connection, uri);;
      case 401: throw createError(Error.permissionDenied, result);
      default: throw createError(Error.permissionDenied, result)
    }
  } catch (error) {
    throw createError(Error.unknown, error);
  }
}

async function save(connection: PebbleConnection, uri: string, content: string | Blob, binary = false): Promise<boolean> {
  try {
    const result = await put(connection, '/exist/restxq/pebble/document?uri=' + uri, content, binary);
    switch (result.status) {
      case 201: return true;
      case 401: throw createError(Error.permissionDenied, result);
      default: throw createError(Error.unknown, result);
    }
  } catch (error) {
    throw createError(Error.unknown, error);
  }
  return false;
}

async function saveDocuments(connection: PebbleConnection, documents: PebbleFileList): Promise<boolean> {
  try {
    const result = await put(connection, '/exist/restxq/pebble/documents', documents);
    switch (result.status) {
      case 201: return true;
      case 401: throw createError(Error.permissionDenied, result);
      default: throw createError(Error.unknown, result);
    }
  } catch (error) {
    throw createError(Error.unknown, error);
  }
  return false;
}

async function newCollection(connection: PebbleConnection, uri: string): Promise<PebbleCollection> {
  try {
    const result = await put(connection, '/exist/restxq/pebble/collection?uri=' + uri);
    switch (result.status) {
      case 201:
        const json = await result.json();
        return readCollection(json);
      case 401: throw createError(Error.permissionDenied, result);
      default: throw createError(Error.unknown, result);
    }
  } catch (error) {
    throw createError(Error.unknown, error);
  }
}

async function connect(connection: PebbleConnection): Promise<PebbleCollection> {
  const root = await load(connection, '/') as PebbleCollection;
  return root;
}
async function removeDoc(connection: PebbleConnection, uri: string, isCollection?: boolean): Promise<boolean> {
  try {
    const result = await remove(connection, '/exist/restxq/pebble/' + (isCollection ? 'collection' : 'document') + '?uri=' + uri);
    switch (result.status) {
      case 204: return true;
      case 401: throw createError(Error.permissionDenied, result);
      default: throw createError(Error.unknown, result);
    }
  } catch (error) {
    throw createError(Error.unknown, error);
  }
}

async function move(connection: PebbleConnection, source: string, destination: string, collection: boolean, copy: boolean): Promise<boolean> {
  try {
    const headers = {
      ['x-pebble-' + (copy ? 'copy' : 'move') + '-source']: source,
    };
    const endpoint = collection ? 'collection' : 'document';
    const result = await put(connection, '/exist/restxq/pebble/' + endpoint + '?uri=' + destination, headers);
    switch (result.status) {
      case 201: return true;
      case 401: throw createError(Error.permissionDenied, result);
      default: throw createError(Error.unknown, result);
    }
  } catch (error) {
    throw createError(Error.unknown, error);
  }
  return false;
}

export const PebbleApi = {
  load,
  save,
  saveDocuments,
  connect,
  remove: removeDoc,
  move,
  newCollection,
};