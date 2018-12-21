export interface IDialogField {
  container: HTMLDivElement;
  input: HTMLInputElement;
  label: HTMLSpanElement;
}
export interface IDialogFields {
  [key: string]: IDialogField;
}