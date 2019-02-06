export interface FSTemplateFieldOption {
  label: string;
  value: any;
}
export interface FSTemplateFieldOptions {
  label: string;
  options: FSTemplateFieldOption[];
}
export type FSTemplateFields<T> = {
  [P in keyof T]: string | FSTemplateFieldOptions;
}
export interface FSTemplate<T = any> {
  name: string;
  defaults?: Partial<T>;
  fields?: FSTemplateFields<T>;
  execute: (params: T) => string;
  ext: (params: T) => string;
}