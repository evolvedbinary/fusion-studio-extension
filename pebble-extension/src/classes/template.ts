interface FieldOption {
  label: string;
  value: any;
}
export type PebbleTemplateFields<T> = {
  [P in keyof T]: string | FieldOption[];
}
export interface PebbleTemplate<T = any> {
  name: string;
  defaults?: Partial<T>;
  fields?: PebbleTemplateFields<T>;
  execute: (params: T) => string;
  ext: (params: T) => string;
}