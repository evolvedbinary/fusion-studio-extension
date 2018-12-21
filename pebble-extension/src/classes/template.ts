export interface PebbleTemplate<T = any> {
  name: string;
  defaults?: Partial<T>;
  execute: (params: T) => string;
  ext: (params: T) => string;
}