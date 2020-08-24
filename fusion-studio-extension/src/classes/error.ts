export interface FSErrorObject {
  code: FSError;
  data?: any[];
}
export namespace FSErrorObject {
  export function is(error: any): error is FSErrorObject {
    return !!error && typeof error === 'object'
      && 'code' in error
      && typeof error.code == 'number'
      && (!('data' in error) || 'length' in error.data);
  }
}
export enum FSError {
  unknown = 0,
  permissionDenied = 401,
  notFound = 404,
  query,
  outdatedAPI,
  nodeNotFound,
}

type FSErrorMessages = {
  [key in FSError]: string;
}

export function createError(code: FSError, ...data: any[]): FSErrorObject {
  const error = data.length === 1 ? data[0] : data;
  return FSErrorObject.is(error) ? error : {
    code,
    data,
  };
}

export const ERROR_MESSAGES: FSErrorMessages = {
  [FSError.unknown]: 'unknown error',
  [FSError.permissionDenied]: 'permission denied',
  [FSError.notFound]: 'Not found',
  [FSError.query]: 'Query evaluation failed',
  [FSError.nodeNotFound]: 'Node not found',
  [FSError.outdatedAPI]: 'Outdated API',
}