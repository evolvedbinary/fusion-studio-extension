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
export enum PebbleError {
  unknown = 0,
  permissionDenied = 401,
}

type ErrorMessages = {
  [key in PebbleError]: string;
}

export function createError(code: number, ...data: any[]) {
  const error = data.length > 0 ? data[0] : data;
  return ErrorObject.is(error) ? error : {
    code,
    data,
  }
}

export const ERROR_MESSAGES: ErrorMessages = {
  [PebbleError.unknown]: 'unknown error',
  [PebbleError.permissionDenied]: 'permission denied',
}