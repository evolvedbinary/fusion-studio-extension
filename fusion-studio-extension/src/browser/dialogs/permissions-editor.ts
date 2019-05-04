import { FSPermissions, readPermissions, writePermissions, FS_PERMISSION_SCOPES, FS_PERMISSION_TYPES, fromPermissions, samePermissions, FS_PERMISSION_SPECIAL } from "../../classes/item";
import { Checkbox } from "../../classes/checkbox";

export class FSPermissionsEditor {
  public table: HTMLTableElement = document.createElement('table');
  private _permissions: FSPermissions = fromPermissions();
  public rows: {
    [K: string]: HTMLTableRowElement;
  } = {};
  public cells: {
    [K: string]: {
      [P: string]: HTMLTableCellElement;
    }
  } = {};
  public labels: {
    [K: string]: {
      [P: string]: HTMLSpanElement;
    }
  } = {};
  private checks: {
    [K: string]: {
      [P: string]: Checkbox;
    }
  } = {};
  constructor (permissions?: FSPermissions) {
    this.table.className = 'permissions-editor';
    for (let i in FS_PERMISSION_SCOPES) {
      const scope = FS_PERMISSION_SCOPES[i];
      this.rows[scope] = document.createElement('tr');
      this.cells[scope] = { label: document.createElement('td') };
      this.cells[scope].label.innerHTML = scope;
      this.table.append(this.rows[scope]);
      this.rows[scope].append(this.cells[scope].label);
      this.labels[scope] = {};
      this.checks[scope] = {};
      for (let type of FS_PERMISSION_TYPES) {
        this.checks[scope][type] = new Checkbox(type === 'special' ? FS_PERMISSION_SPECIAL[i] : type);
        this.cells[scope][type] = document.createElement('td');
        this.cells[scope][type].append(this.checks[scope][type].container);
        this.rows[scope].append(this.cells[scope][type]);
      }
    }
    this.permissions = permissions;
  }
  public get permissions(): FSPermissions | undefined {
    this.read();
    return this._permissions;
  }
  public set permissions(permissions: FSPermissions | undefined) {
    if (!samePermissions(this._permissions, permissions)) {
      this._permissions = fromPermissions(permissions);
      this.write(this._permissions);
    }
  }
  public get strPermissions(): string {
    return writePermissions(this._permissions);
  }
  public set strPermissions(permissions: string) {
    this.permissions = readPermissions(permissions);
  }
  public addUpdateListeners(add: (element: HTMLElement, type: any, useCapture?: boolean) => void) {
    for (let scope of FS_PERMISSION_SCOPES) {
      for (let type of FS_PERMISSION_TYPES) {
        add(this.checks[scope][type].container, 'click');
      }
    }
  }
  private write(permissions: FSPermissions) {
    for (let scope of FS_PERMISSION_SCOPES) {
      for (let type of FS_PERMISSION_TYPES) {
        this.checks[scope][type].checked = (permissions as any)[scope][type];
      }
    }
  }
  private read() {
    for (let scope of FS_PERMISSION_SCOPES) {
      for (let type of FS_PERMISSION_TYPES) {
        (this._permissions as any)[scope][type] = this.checks[scope][type].checked;
      }
    }
  }
}
