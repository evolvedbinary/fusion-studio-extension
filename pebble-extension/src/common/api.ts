import { PebbleCollection, PebbleDocument, readItem, readDate } from "../classes/item";
import { PebbleConnection } from "../classes/connection";
import { createError, PebbleError } from "../classes/error";
import { PebbleFileList } from "../classes/files";
import { PebbleUserData, writeUserData, readUser, PebbleUser } from "../classes/user";
import { PebbleGroupData, writeGroupData, readGroup, PebbleGroup } from "../classes/group";
import { readIndex, PebbleIndex } from "../classes/indexes";
import { PebbleRestURI } from "../classes/rest";

export const RANGE_START = 1;
export const RANGE_LENGTH = 4;
export interface PebblePostOptions {
  headers?: any;
  contentType?: string;
}

export namespace PebbleApi {

  // private methods
  async function _get(connection: PebbleConnection, uri: string): Promise<Response> {
    return fetch(connection.server + uri,  connection.username === '' ? undefined : {
      headers: {
        Authorization: 'Basic ' + btoa(connection.username + ':' + connection.password),
      }
    });
  }

  async function _remove(connection: PebbleConnection, uri: string): Promise<Response> {
    const options: any = {
      method: 'DELETE',
    };
    if (connection.username !== '') {
      options.headers = { Authorization: 'Basic ' + btoa(connection.username + ':' + connection.password) };
    }
    return fetch(connection.server + uri, options);
  }

  async function _put(connection: PebbleConnection, uri: string, body: any = '', contentType = ''): Promise<Response> {
    const isReady = contentType !== '' || (body instanceof FormData) || (body instanceof File) || (body instanceof Blob);
    const isString = typeof body === 'string';
    const isHeader = body && !isString && 'headers' in body;
    const headers: any = isHeader ? body.headers : {};
    if (connection.username !== '') {
      headers.Authorization = 'Basic ' + btoa(connection.username + ':' + connection.password);
    }
    if (contentType) {
      headers['Content-Type'] = contentType == 'bin' ? 'application/octet-stream' : contentType;
    }
    if (body && !isReady && !isString) {
      const formData = new FormData();
      let counter = 1;
      for (let i in body) {
        formData.append('file-upload-' + counter++, body[i], i);
      }
      body = formData;
    }
    return fetch(connection.server + uri, {
      headers,
      method: 'PUT',
      body: isHeader ? undefined : body
    });
  }

  async function _post(connection: PebbleConnection, uri: string, body: any = '', options?: PebblePostOptions): Promise<Response> {
    const headers: any = options && options.headers || {};
    if (connection.username !== '') {
      headers.Authorization = 'Basic ' + btoa(connection.username + ':' + connection.password);
    }
    headers['Content-Type'] = options && options.contentType || 'application/json';
    return fetch(connection.server + uri, {
      headers,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // public methods
  export async function readDocument(data: any, connection?: PebbleConnection, uri?: string): Promise<PebbleDocument> {
    return {
      ...readItem(data, 'dba', connection ? connection.username : ''),
      lastModified: readDate(data['lastModified'] || null),
      size: data['size'] || 0,
      mediaType: data['mediaType'] || 'text/plain',
      binaryDoc: data.binaryDoc,
      content: (connection && uri) ? await _get(connection, '/exist/restxq/pebble/document?uri=' + uri).then(result => result.text()) : '',
    };
  }

  export async function readCollection(data: any, connection?: PebbleConnection): Promise<PebbleCollection> {
    return {
      ...readItem(data, 'dba', connection ? connection.username : ''),
      collections: await Promise.all((data['collections'] || []).map((collection: any) => readCollection(collection, connection)) as Promise<PebbleCollection>[]),
      documents: await Promise.all((data['documents'] || []).map((docoment: any) => readDocument(docoment, connection)) as Promise<PebbleDocument>[]),
    };
  }
  
  export async function load(connection: PebbleConnection, uri: string): Promise<PebbleCollection | PebbleDocument> {
    try {
      const result = await _get(connection, '/exist/restxq/pebble/explorer?uri=' + uri);
      switch (result.status) {
        case 200:
          const object = await result.json();
          return 'collections' in object ? readCollection(object, connection) : readDocument(object, connection, uri);;
        case 401: throw createError(PebbleError.permissionDenied, result);
        default: throw createError(PebbleError.permissionDenied, result)
      }
    } catch (error) {
      throw createError(PebbleError.unknown, error);
    }
  }
  
  export async function save(connection: PebbleConnection, uri: string, content: string | Blob, contentType = ''): Promise<PebbleDocument | undefined> {
    try {
      const result = await _put(connection, '/exist/restxq/pebble/document?uri=' + uri, content, contentType);
      switch (result.status) {
        case 201:
          const object = await result.json();
          return readDocument(object);
        case 401: throw createError(PebbleError.permissionDenied, result);
        default: throw createError(PebbleError.unknown, result);
      }
    } catch (error) {
      throw createError(PebbleError.unknown, error);
    }
    return undefined;
  }
  
  export async function saveDocuments(connection: PebbleConnection, collection: PebbleCollection, documents: PebbleFileList | FormData): Promise<PebbleDocument[]> {
    try {
      const result = await _put(connection, '/exist/restxq/pebble/document?uri=' + collection.name, documents);
      switch (result.status) {
        case 201: return Promise.all((await result.json() as any[]).map(doc => readItem(doc, connection ? connection.username : '') as PebbleDocument));
        case 401: throw createError(PebbleError.permissionDenied, result);
        default: throw createError(PebbleError.unknown, result);
      }
    } catch (error) {
      throw createError(PebbleError.unknown, error);
    }
  }
  
  export async function newCollection(connection: PebbleConnection, uri: string): Promise<PebbleCollection> {
    try {
      const result = await _put(connection, '/exist/restxq/pebble/collection?uri=' + uri);
      switch (result.status) {
        case 201:
          const json = await result.json();
          return readCollection(json, connection);
        case 401: throw createError(PebbleError.permissionDenied, result);
        default: throw createError(PebbleError.unknown, result);
      }
    } catch (error) {
      throw createError(PebbleError.unknown, error);
    }
  }
  
  export async function connect(connection: PebbleConnection): Promise<PebbleCollection> {
    const root = await load(connection, '/') as PebbleCollection;
    return root;
  }

  export async function remove(connection: PebbleConnection, uri: string, isCollection?: boolean): Promise<boolean> {
    try {
      const result = await _remove(connection, '/exist/restxq/pebble/' + (isCollection ? 'collection' : 'document') + '?uri=' + uri);
      switch (result.status) {
        case 204: return true;
        case 401: throw createError(PebbleError.permissionDenied, result);
        default: throw createError(PebbleError.unknown, result);
      }
    } catch (error) {
      throw createError(PebbleError.unknown, error);
    }
  }
  
  export async function move(connection: PebbleConnection, source: string, destination: string, collection: boolean, copy: boolean): Promise<boolean> {
    try {
      const headers = {
        ['x-pebble-' + (copy ? 'copy' : 'move') + '-source']: source,
      };
      const endpoint = collection ? 'collection' : 'document';
      const result = await _put(connection, '/exist/restxq/pebble/' + endpoint + '?uri=' + destination, { headers });
      switch (result.status) {
        case 201: return true;
        case 401: throw createError(PebbleError.permissionDenied, result);
        default: throw createError(PebbleError.unknown, result);
      }
    } catch (error) {
      throw createError(PebbleError.unknown, error);
    }
    return false;
  }
  
  export async function chmod(connection: PebbleConnection, uri: string, owner: string, group: string, isCollection?: boolean): Promise<boolean> {
    return (await _put(connection, '/exist/restxq/pebble/' + (isCollection ? 'collection' : 'document') + '?uri=' + uri, {
      headers: {
        'x-pebble-owner': owner,
        'x-pebble-group': group,
      },
    })).status === 200;
  }

  export async function convert(connection: PebbleConnection, document: PebbleDocument): Promise<boolean> {
    return (await _put(connection, '/exist/restxq/pebble/document?uri=' + document.name, {
      headers: { 'x-pebble-convert': !document.binaryDoc },
    })).status === 200;
  }

  export async function evaluate(connection: PebbleConnection, serialization: string, value: string, isContent?: boolean, start?: number, length?: number): Promise<string> {
    try {
      const body = {
        query: value,
        defaultSerialization: { method: serialization }
      };
      const headers = {
        Range: `items=${start || RANGE_START}-${length || RANGE_LENGTH}`,
      };
      const result = await _post(connection, '/exist/restxq/pebble/query', body, { headers });
      switch (result.status) {
        case 206:
        case 200:
          const json = await result.json();
          const results = json.results;
          return results;
        case 401: throw createError(PebbleError.permissionDenied, result);
        default: throw createError(PebbleError.unknown, result);
      }
    } catch (error) {
      throw createError(PebbleError.unknown, error);
    }
  }

  export async function getUsers(connection: PebbleConnection): Promise<string[]> {
    const result = await (await _get(connection, '/exist/restxq/pebble/user')).json();
    connection.users.length = 0;
    connection.users.push(...result);
    return result;
  }

  export async function getUser(connection: PebbleConnection, user: string): Promise<PebbleUser> {
    const result = await (await _get(connection, '/exist/restxq/pebble/user/' + user)).json();
    return readUser(result);
  }

  export async function addUser(connection: PebbleConnection, user: PebbleUserData): Promise<boolean> {
    try {
      const result = await _put(connection, '/exist/restxq/pebble/user/' + user.userName, writeUserData(user), 'application/json');
      switch (result.status) {
        case 204: return true;
        case 401: throw createError(PebbleError.permissionDenied, result);
        default: throw createError(PebbleError.unknown, result);
      }
    } catch (error) {
      throw createError(PebbleError.unknown, error);
    }
  }

  export async function removeUser(connection: PebbleConnection, user: string): Promise<boolean> {
    try {
      const result = await _remove(connection, '/exist/restxq/pebble/user/' + user);
      switch (result.status) {
        case 204: return true;
        case 401: throw createError(PebbleError.permissionDenied, result);
        case 404: throw createError(PebbleError.notFound, result);
        default: throw createError(PebbleError.unknown, result);
      }
    } catch (error) {
      throw createError(PebbleError.unknown, error);
    }
  }

  export async function getGroups(connection: PebbleConnection): Promise<string[]> {
    const result = await (await _get(connection, '/exist/restxq/pebble/group')).json();
    connection.groups.length = 0;
    connection.groups.push(...result);
    return result;
  }

  export async function getGroup(connection: PebbleConnection, group: string): Promise<PebbleGroup> {
    const result = await (await _get(connection, '/exist/restxq/pebble/group/' + group)).json();
    return readGroup(result);
  }

  export async function addGroup(connection: PebbleConnection, group: PebbleGroupData): Promise<boolean> {
    try {
      const result = await _put(connection, '/exist/restxq/pebble/group/' + group.groupName, writeGroupData(group), 'application/json');
      switch (result.status) {
        case 204: return true;
        case 401: throw createError(PebbleError.permissionDenied, result);
        default: throw createError(PebbleError.unknown, result);
      }
    } catch (error) {
      throw createError(PebbleError.unknown, error);
    }
  }

  export async function removeGroup(connection: PebbleConnection, group: string): Promise<boolean> {
    try {
      const result = await _remove(connection, '/exist/restxq/pebble/group/' + group);
      switch (result.status) {
        case 204: return true;
        case 401: throw createError(PebbleError.permissionDenied, result);
        case 404: throw createError(PebbleError.notFound, result);
        default: throw createError(PebbleError.unknown, result);
      }
    } catch (error) {
      throw createError(PebbleError.unknown, error);
    }
  }

  export async function getIndexes(connection: PebbleConnection): Promise<string[]> {
    return (await _get(connection, '/exist/restxq/pebble/index')).json();
  }

  export async function getIndex(connection: PebbleConnection, uri: string): Promise<PebbleIndex | undefined> {
    try {
      const result = await (await _get(connection, '/exist/restxq/pebble/index?uri=' + uri));
      switch (result.status) {
        case 200: return readIndex(await result.json());
        // case 404: throw createError(PebbleError.notFound, result);
        case 404: return undefined;
        default: throw createError(PebbleError.unknown, result);
      }
    } catch (error) {
      throw createError(PebbleError.unknown, error);
    }
  }

  export async function restxq(connection: PebbleConnection): Promise<PebbleRestURI[]> {
    return (await _get(connection, '/exist/restxq/pebble/restxq')).json();
  }
}
