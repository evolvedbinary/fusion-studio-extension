import { FSCollection, FSDocument, readItem, readDate } from "../classes/item";
import { FSServerConnection } from "../classes/connection";
import { createError, FSError } from "../classes/error";
import { FSFileList } from "../classes/files";
import { FSUserData, writeUserData, readUser, FSUser } from "../classes/user";
import { FSGroupData, writeGroupData, readGroup, FSGroup } from "../classes/group";
import { readIndex, FSIndex } from "../classes/indexes";
import { FSRestURI } from "../classes/rest";

export const API_MINIMUM_VERSION = '0.2.0';
export const [API_MAJOR, API_MINOR, API_PATCH] = API_MINIMUM_VERSION.split('.').map(val => Number.parseInt(val));
export const FS_API_URI = '/exist/restxq/fusiondb';
export const RANGE_START = 1;
export const RANGE_LENGTH = 4;
export interface FSPostOptions {
  headers?: any;
  contentType?: string;
}

export namespace FSApi {

  // private methods

  async function _get(connection: FSServerConnection, uri: string): Promise<Response> {
    return fetch(connection.server + uri,  connection.username === '' ? undefined : {
      headers: {
        Authorization: 'Basic ' + btoa(connection.username + ':' + connection.password),
      }
    });
  }

  async function _remove(connection: FSServerConnection, uri: string): Promise<Response> {
    const options: any = {
      method: 'DELETE',
    };
    if (connection.username !== '') {
      options.headers = { Authorization: 'Basic ' + btoa(connection.username + ':' + connection.password) };
    }
    return fetch(connection.server + uri, options);
  }

  async function _put(connection: FSServerConnection, uri: string, body: any = '', contentType = ''): Promise<Response> {
    const isReady = contentType !== '' || (body instanceof FormData) || (body instanceof File) || (body instanceof Blob);
    const isString = typeof body === 'string';
    const isHeader = body && !isString && 'headers' in body;
    const headers: any = isHeader ? body.headers : {};
    if (isHeader) {
      body = body.body;
    }
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

  async function _post(connection: FSServerConnection, uri: string, body: any = '', options?: FSPostOptions): Promise<Response> {
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
  function checkAPI(version: string): boolean {
    const [major, minor, patch] = version.split('.').map(val => Number.parseInt(val));;
    if (major > API_MAJOR) return true;
    if (major === API_MAJOR && minor > API_MINOR) return true;
    if (minor === API_MINOR && patch >= API_PATCH) return true;
    return false;
  }

  export async function readDocument(data: any, connection?: FSServerConnection, uri?: string): Promise<FSDocument> {
    return {
      ...readItem(data, 'dba', connection ? connection.username : ''),
      lastModified: readDate(data['lastModified'] || null),
      size: data['size'] || 0,
      mediaType: data['mediaType'] || 'text/plain',
      binaryDoc: data.binaryDoc,
      content: (connection && uri) ? await _get(connection, FS_API_URI + '/document?uri=' + uri).then(result => result.text()) : '',
    };
  }

  export async function readCollection(data: any, connection?: FSServerConnection): Promise<FSCollection> {
    return {
      ...readItem(data, 'dba', connection ? connection.username : ''),
      collections: await Promise.all((data['collections'] || []).map((collection: any) => readCollection(collection, connection)) as Promise<FSCollection>[]),
      documents: await Promise.all((data['documents'] || []).map((docoment: any) => readDocument(docoment, connection)) as Promise<FSDocument>[]),
    };
  }
  
  export async function load(connection: FSServerConnection, uri: string): Promise<FSCollection | FSDocument> {
    try {
      const result = await _get(connection, FS_API_URI + '/explorer?uri=' + uri);
      switch (result.status) {
        case 200:
          const object = await result.json();
          return 'collections' in object ? readCollection(object, connection) : readDocument(object, connection, uri);;
        case 401: throw createError(FSError.permissionDenied, result);
        default: throw createError(FSError.permissionDenied, result)
      }
    } catch (error) {
      throw createError(FSError.unknown, error);
    }
  }
  
  export async function save(connection: FSServerConnection, uri: string, content: string | Blob, contentType = ''): Promise<FSDocument | undefined> {
    try {
      const result = await _put(connection, FS_API_URI + '/document?uri=' + uri, content, contentType);
      switch (result.status) {
        case 201:
          const object = await result.json();
          return readDocument(object);
        case 401: throw createError(FSError.permissionDenied, result);
        default: throw createError(FSError.unknown, result);
      }
    } catch (error) {
      throw createError(FSError.unknown, error);
    }
    return undefined;
  }
  
  export async function saveDocuments(connection: FSServerConnection, collection: FSCollection, documents: FSFileList | FormData): Promise<FSDocument[]> {
    try {
      const result = await _put(connection, FS_API_URI + '/document?uri=' + collection.name, documents);
      switch (result.status) {
        case 201: return Promise.all((await result.json() as any[]).map(doc => readItem(doc, connection ? connection.username : '') as FSDocument));
        case 401: throw createError(FSError.permissionDenied, result);
        default: throw createError(FSError.unknown, result);
      }
    } catch (error) {
      throw createError(FSError.unknown, error);
    }
  }
  
  export async function newCollection(connection: FSServerConnection, uri: string): Promise<FSCollection> {
    try {
      const result = await _put(connection, FS_API_URI + '/collection?uri=' + uri);
      switch (result.status) {
        case 201:
          const json = await result.json();
          return readCollection(json, connection);
        case 401: throw createError(FSError.permissionDenied, result);
        default: throw createError(FSError.unknown, result);
      }
    } catch (error) {
      throw createError(FSError.unknown, error);
    }
  }
  
  export async function connect(connection: FSServerConnection): Promise<FSCollection> {
    try {
      const result = await _get(connection, FS_API_URI + '/version');
      switch (result.status) {
        case 200:
          const version = (await result.json())?.version;
          if (!version) {
            throw createError(FSError.unknown, result);
          }
          if (checkAPI(version)) {
            const root = await load(connection, '/') as FSCollection;
            return root;
          }
          throw createError(FSError.outdatedAPI, version);
        case 401: throw createError(FSError.permissionDenied, result);
        default: throw createError(FSError.unknown, result)
      }
    } catch (error) {
      throw createError(FSError.unknown, error);
    }
  }

  export async function remove(connection: FSServerConnection, uri: string, isCollection?: boolean): Promise<boolean> {
    try {
      const result = await _remove(connection, FS_API_URI + '/' + (isCollection ? 'collection' : 'document') + '?uri=' + uri);
      switch (result.status) {
        case 204: return true;
        case 401: throw createError(FSError.permissionDenied, result);
        default: throw createError(FSError.unknown, result);
      }
    } catch (error) {
      throw createError(FSError.unknown, error);
    }
  }
  
  export async function move(connection: FSServerConnection, source: string, destination: string, collection: boolean, copy: boolean): Promise<boolean> {
    try {
      const headers = {
        ['x-fs-' + (copy ? 'copy' : 'move') + '-source']: source,
      };
      const endpoint = collection ? 'collection' : 'document';
      const result = await _put(connection, FS_API_URI + '/' + endpoint + '?uri=' + destination, { headers });
      switch (result.status) {
        case 201: return true;
        case 401: throw createError(FSError.permissionDenied, result);
        default: throw createError(FSError.unknown, result);
      }
    } catch (error) {
      throw createError(FSError.unknown, error);
    }
    return false;
  }
  
  export async function chmod(connection: FSServerConnection, uri: string, owner: string, group: string, isCollection?: boolean): Promise<boolean> {
    return (await _put(connection, FS_API_URI + '/' + (isCollection ? 'collection' : 'document') + '?uri=' + uri, {
      headers: {
        'x-fs-owner': owner,
        'x-fs-group': group,
      },
    })).status === 200;
  }

  export async function convert(connection: FSServerConnection, document: FSDocument): Promise<boolean> {
    return (await _put(connection, FS_API_URI + '/document?uri=' + document.name, {
      headers: { 'x-fs-convert': !document.binaryDoc },
    })).status === 200;
  }

  export async function evaluate(connection: FSServerConnection, serialization: string, value: string, isContent?: boolean, start?: number, length?: number): Promise<string> {
    try {
      const body = {
        [isContent ? 'query' : 'query-uri']: value,
        defaultSerialization: { method: serialization }
      };
      const headers = {
        Range: `items=${start || RANGE_START}-${length || RANGE_LENGTH}`,
      };
      const result = await _post(connection, FS_API_URI + '/query', body, { headers });
      switch (result.status) {
        case 206:
        case 200:
          const json = await result.json();
          const results = json.results;
          return results;
        case 400: throw createError(FSError.query, await result.json());
        case 401: throw createError(FSError.permissionDenied, result);
        default: throw createError(FSError.unknown, result);
      }
    } catch (error) {
      throw createError(FSError.unknown, error);
    }
  }

  export async function getUsers(connection: FSServerConnection): Promise<string[]> {
    const result = await (await _get(connection, FS_API_URI + '/user')).json();
    connection.users.length = 0;
    connection.users.push(...result);
    return result;
  }

  export async function getUser(connection: FSServerConnection, user: string): Promise<FSUser> {
    const result = await (await _get(connection, FS_API_URI + '/user/' + user)).json();
    return readUser(result);
  }

  export async function addUser(connection: FSServerConnection, user: FSUserData): Promise<boolean> {
    try {
      const result = await _put(connection, FS_API_URI + '/user/' + user.userName, writeUserData(user), 'application/json');
      switch (result.status) {
        case 204: return true;
        case 401: throw createError(FSError.permissionDenied, result);
        default: throw createError(FSError.unknown, result);
      }
    } catch (error) {
      throw createError(FSError.unknown, error);
    }
  }

  export async function removeUser(connection: FSServerConnection, user: string): Promise<boolean> {
    try {
      const result = await _remove(connection, FS_API_URI + '/user/' + user);
      switch (result.status) {
        case 204: return true;
        case 401: throw createError(FSError.permissionDenied, result);
        case 404: throw createError(FSError.notFound, result);
        default: throw createError(FSError.unknown, result);
      }
    } catch (error) {
      throw createError(FSError.unknown, error);
    }
  }

  export async function getGroups(connection: FSServerConnection): Promise<string[]> {
    const result = await (await _get(connection, FS_API_URI + '/group')).json();
    connection.groups.length = 0;
    connection.groups.push(...result);
    return result;
  }

  export async function getGroup(connection: FSServerConnection, group: string): Promise<FSGroup> {
    const result = await (await _get(connection, FS_API_URI + '/group/' + group)).json();
    return readGroup(result);
  }

  export async function addGroup(connection: FSServerConnection, group: FSGroupData): Promise<boolean> {
    try {
      const result = await _put(connection, FS_API_URI + '/group/' + group.groupName, writeGroupData(group), 'application/json');
      switch (result.status) {
        case 204: return true;
        case 401: throw createError(FSError.permissionDenied, result);
        default: throw createError(FSError.unknown, result);
      }
    } catch (error) {
      throw createError(FSError.unknown, error);
    }
  }

  export async function removeGroup(connection: FSServerConnection, group: string): Promise<boolean> {
    try {
      const result = await _remove(connection, FS_API_URI + '/group/' + group);
      switch (result.status) {
        case 204: return true;
        case 401: throw createError(FSError.permissionDenied, result);
        case 404: throw createError(FSError.notFound, result);
        default: throw createError(FSError.unknown, result);
      }
    } catch (error) {
      throw createError(FSError.unknown, error);
    }
  }

  export async function getIndexes(connection: FSServerConnection): Promise<string[]> {
    return (await _get(connection, FS_API_URI + '/index')).json();
  }

  export async function getIndex(connection: FSServerConnection, uri: string): Promise<FSIndex | undefined> {
    try {
      const result = await (await _get(connection, FS_API_URI + '/index?uri=' + uri));
      switch (result.status) {
        case 200: return readIndex(await result.json());
        // case 404: throw createError(FSError.notFound, result);
        case 404: return undefined;
        default: throw createError(FSError.unknown, result);
      }
    } catch (error) {
      throw createError(FSError.unknown, error);
    }
  }

  export async function restxq(connection: FSServerConnection): Promise<FSRestURI[]> {
    return (await _get(connection, FS_API_URI + '/restxq')).json();
  }
}
