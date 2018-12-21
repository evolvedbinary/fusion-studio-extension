export interface PebbleTemplateFieldOption {
  label: string;
  value: any;
}
export interface PebbleTemplateFieldOptions {
  label: string;
  options: PebbleTemplateFieldOption[];
}
export type PebbleTemplateFields<T> = {
  [P in keyof T]: string | PebbleTemplateFieldOptions;
}
export interface PebbleTemplate<T = any> {
  name: string;
  defaults?: Partial<T>;
  fields?: PebbleTemplateFields<T>;
  execute: (params: T) => string;
  ext: (params: T) => string;
}