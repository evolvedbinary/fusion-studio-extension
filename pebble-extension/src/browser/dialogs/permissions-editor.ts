import { PebblePermissions, readPermissions, writePermissions, PERMISSION_SCOPES, PERMISSION_TYPES, fromPermissions, samePermissions } from "../../classes/item";
import { Checkbox } from "../../classes/checkbox";

export class PebblePermissionsEditor {
  public table: HTMLTableElement = document.createElement('table');
  private _permissions: PebblePermissions = fromPermissions();
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
  constructor (permissions?: PebblePermissions) {
    this.table.className = 'permissions-editor';
    for (let scope of PERMISSION_SCOPES) {
      this.rows[scope] = document.createElement('tr');
      this.cells[scope] = { label: document.createElement('td') };
      this.cells[scope].label.innerHTML = scope;
      this.table.append(this.rows[scope]);
      this.rows[scope].append(this.cells[scope].label);
      this.labels[scope] = {};
      this.checks[scope] = {};
      for (let type of PERMISSION_TYPES) {
        this.checks[scope][type] = new Checkbox(type);
        this.cells[scope][type] = document.createElement('td');
        this.cells[scope][type].append(this.checks[scope][type].container);
        this.rows[scope].append(this.cells[scope][type]);
      }
    }
    this.permissions = permissions;
  }
  public get permissions(): PebblePermissions | undefined {
    this.read();
    return this._permissions;
  }
  public set permissions(permissions: PebblePermissions | undefined) {
    if (!samePermissions(this._permissions, permissions)) {
      this._permissions = fromPermissions(permissions);
    }
    this.write(this._permissions);
  }
  public get strPermissions(): string {
    return writePermissions(this._permissions);
  }
  public set strPermissions(permissions: string) {
    this.permissions = readPermissions(permissions);
  }
  public addUpdateListeners(add: (element: HTMLElement, type: any, useCapture?: boolean) => void) {
    for (let scope of PERMISSION_SCOPES) {
      for (let type of PERMISSION_TYPES) {
        add(this.checks[scope][type].container, 'click');
      }
    }
  }
  private write(permissions: PebblePermissions) {
    for (let scope of PERMISSION_SCOPES) {
      for (let type of PERMISSION_TYPES) {
        this.checks[scope][type].checked = (permissions as any)[scope][type];
      }
    }
  }
  private read() {
    for (let scope of PERMISSION_SCOPES) {
      for (let type of PERMISSION_TYPES) {
        (this._permissions as any)[scope][type] = this.checks[scope][type].checked;
      }
    }
  }
}
