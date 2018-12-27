export interface ErrorObject {
  code: number;
  data?: any[];
}
export namespace ErrorObject {
  export function is(error: any): error is ErrorObject {
    return !!error && typeof error === 'object'
      && 'code' in error
      && typeof error.code == 'number'
      && (!('data' in error) || 'length' in error.data);
  }
}
export enum Error {
  unknown = 0,
  permissionDenied = 401,
}

type ErrorMessages = {
  [key in Error]: string;
}

export function createError(code: number, ...data: any[]) {
  const error = data.length > 0 ? data[0] : data;
  return ErrorObject.is(error) ? error : {
    code,
    data,
  }
}

export const ERROR_MESSAGES: ErrorMessages = {
  [Error.unknown]: 'unknown error',
  [Error.permissionDenied]: 'permission denied',
}