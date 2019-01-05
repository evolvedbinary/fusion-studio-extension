import * as m from "moment";
import * as size from "filesize";
export type IKeyType = 'string' | 'number' | 'date' | 'size';
export interface IKey<T = any> {
  type: IKeyType;
  value: T;
}
export interface IKeys {
  [key: string]: string | number | Date | IKey;
}
export interface IKeysElement {
  container: HTMLDivElement;
  data: {
    [key: string]: {
      row: HTMLTableRowElement;
      label: HTMLTableDataCellElement;
      value: HTMLTableDataCellElement;
    };
  }
}

export function addKeys(keys: IKeys, element: IKeysElement) {
  for(let i in keys) {
    addKey(i, keys[i], element);
  }
}
export function renderKey(key: string | number | Date | IKey): string {
  let keyToRender: IKey;
  if (typeof key === 'object') {
    if ('type' in key && 'value' in key) {
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

export function addKey(index: string, key: string | number | Date | IKey, element: IKeysElement) {
  const row = document.createElement('tr');
  const label = document.createElement('td');
  const value = document.createElement('td');
  label.innerHTML = index;
  value.innerHTML = renderKey(key);
  row.append(label);
  row.append(value);
  element.container.append(row);
  element.data[index] = { row, label, value }
}
export function createKeys(keys: IKeys): IKeysElement {
  const result: IKeysElement = {
    container: document.createElement('table'),
    data: {},
  }
  addKeys(keys, result);
  return result;
}