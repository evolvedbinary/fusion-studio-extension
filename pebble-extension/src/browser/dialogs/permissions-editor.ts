import { PebblePermissions, readPermissions, writePermissions, PebblePermissionCheckboxes, PERMISSION_SCOPES, PERMISSION_TYPES, fromPermissions, samePermissions } from "../../classes/item";

function createCheckboxes(): PebblePermissionCheckboxes {
  const base: PebblePermissionCheckboxes = {};
  for (let scope of PERMISSION_SCOPES) {
    base[scope] = {};
    for (let type of PERMISSION_TYPES) {
      base[scope][type] = document.createElement('input');
      base[scope][type].type = 'checkbox';
    }
  }
  return base;
}

export class PebblePermissionsEditor {
  public container: HTMLDivElement = document.createElement('div');
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
  private checks: PebblePermissionCheckboxes = createCheckboxes();
  constructor (permissions?: PebblePermissions) {
    this.permissions = permissions;
    this.write(this._permissions);
    this.rows.label = document.createElement('tr');
    this.table.append(this.rows.label);
    this.cells.label = { label: document.createElement('td') };
    this.rows.label.append(this.cells.label.label);
    for (let type of PERMISSION_TYPES) {
      this.cells.label[type] = document.createElement('td');
      this.cells.label[type].innerHTML = type;
      this.rows.label.append(this.cells.label[type]);
    }
    for (let scope of PERMISSION_SCOPES) {
      this.rows[scope] = document.createElement('tr');
      this.cells[scope] = { label: document.createElement('td') };
      this.cells[scope].label.innerHTML = scope;
      this.table.append(this.rows[scope]);
      this.rows[scope].append(this.cells[scope].label);
      for (let type of PERMISSION_TYPES) {
        this.cells[scope][type] = document.createElement('td');
        this.cells[scope][type].append(this.checks[scope][type]);
        this.rows[scope].append(this.cells[scope][type]);
      }
    }
    this.container.append(this.table);
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
        add(this.checks[scope][type], 'input');
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
