export interface FSErrorObject {
  code: number;
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
  nodeNotFound,
}

type FSErrorMessages = {
  [key in FSError]: string;
}

export function createError(code: number, ...data: any[]): FSErrorObject {
  const error = data.length > 0 ? data[0] : data;
  return FSErrorObject.is(error) ? error : {
    code,
    data,
  };
}

export const ERROR_MESSAGES: FSErrorMessages = {
  [FSError.unknown]: 'unknown error',
  [FSError.permissionDenied]: 'permission denied',
  [FSError.notFound]: 'Not found',
  [FSError.nodeNotFound]: 'Node not found',
}