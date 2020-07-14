import * as m from "moment";
import * as size from "filesize";
export type IKeyType = 'string' | 'number' | 'date' | 'size';
export namespace IKey {
  export function is(key?: any): key is IKey {
    return !!key && typeof key === 'object' && 'type' in key && 'value' in key;
  }
}
export interface IKey<T = any> {
  type: IKeyType;
  value: T;
  el?: HTMLElement;
}
export interface IKeys {
  [key: string]: string | number | Date | IKey;
}
export interface IKeysElement {
  container: HTMLTableElement;
  data: {
    [key: string]: {
      row: HTMLTableRowElement;
      inputs?: {
        key: HTMLInputElement;
        value: HTMLInputElement;
      };
      label: HTMLTableDataCellElement;
      value: HTMLTableDataCellElement;
    };
  }
}

export function addKeys(keys: IKeys, element: IKeysElement, editable?: string) {
  for(let i in keys) {
    addKey(i, keys[i], element, editable);
  }
}
export function renderKey(key: string | number | Date | IKey): string {
  let keyToRender: IKey;
  if (typeof key === 'object') {
    if (IKey.is(key)) {
      keyToRender = key;
    } else {
      keyToRender = { value: key, type: 'date' } as IKey<Date>;
    }
  } else {
    keyToRender = { value: key, type: typeof key } as IKey;
  }
  switch (keyToRender.type) {
    case 'string': return keyToRender.value;
    case 'number': return keyToRender.value.toString();
    case 'size': return size(keyToRender.value);
    case 'date': return m(keyToRender.value).format('DD-MM-YYYY HH:mm');
  }
}

export function addKey(index: string, key: string | number | Date | IKey, element: IKeysElement, editable?: string) {
  const row = document.createElement('tr');
  const label = document.createElement('td');
  label.className = 'label';
  row.append(label);
  if (index[0] === '-' && key === '-') {
    label.colSpan = 2;
    label.append(document.createElement('hr'));
    element.data[index] = { row, label, value: label };
  } else {
    const value = document.createElement('td');
    if (editable) {
      label.classList.add('has-input');
      const inputs = {
        key: document.createElement('input'),
        value: document.createElement('input'),
      }
      inputs.key.placeholder = 'key...';
      inputs.key.className = 'theia-input';
      inputs.key.value = index;
      label.append(inputs.key);
      inputs.value.placeholder = 'value...';
      inputs.value.value = key as string;
      inputs.value.className = 'theia-input';
      value.append(inputs.value);
      element.data[editable] = { row, label, value, inputs };
    } else {
      label.innerHTML = index;
      value.innerHTML = renderKey(key);
      if (IKey.is(key) && key.el) {
        value.append(key.el);
      }
      element.data[index] = { row, label, value };
    }
    value.className = 'value';
    row.append(value);
  }
  element.container.append(row);
}
export function createKeys(keys: IKeys, editable?: string): IKeysElement {
  const result: IKeysElement = {
    container: document.createElement('table'),
    data: {},
  }
  result.container.className = 'keys';
  addKeys(keys, result, editable);
  return result;
}