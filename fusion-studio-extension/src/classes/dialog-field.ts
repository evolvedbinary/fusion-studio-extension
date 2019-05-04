import { FSTemplateFieldOption } from './template';

export interface IDialogField {
  container: HTMLDivElement;
  input: HTMLInputElement | HTMLSelectElement;
  label: HTMLSpanElement;
}
export interface IDialogFields {
  [key: string]: IDialogField;
}

export function createField(label: string, className: string, type: string | FSTemplateFieldOption[] = 'text'): IDialogField {
  let input: HTMLInputElement | HTMLSelectElement;
  if (typeof type === 'string') {
    input = document.createElement('input');
    input.type = type;
  } else {
    input = document.createElement('select');
    type.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.innerText = option.label;
      input.appendChild(optionElement);
    });
  }
  const result: IDialogField = {
    container: document.createElement('div'),
    input,
    label: document.createElement('span'),
  };
  result.container.className = className;
  result.label.innerHTML = label;
  result.container.appendChild(result.label);
  result.container.appendChild(result.input);
  return result;
}