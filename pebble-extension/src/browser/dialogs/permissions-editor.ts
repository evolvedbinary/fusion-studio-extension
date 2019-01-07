import { PebblePermissions, readPermissions, writePermissions, PebblePermissionCheckboxes, PERMISSION_SCOPES, PERMISSION_TYPES } from "../../classes/item";
import { DEFAULT_PERMISSIONS } from "../../classes/item";

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
  public rows: {
    [K: string]: HTMLTableRowElement;
  } = {};
  public cells: {
    [K: string]: {
      [P: string]: HTMLTableCellElement;
    }
  } = {};
  private checks: PebblePermissionCheckboxes = createCheckboxes();
  constructor (private _permissions: PebblePermissions = DEFAULT_PERMISSIONS) {
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
    return this._permissions;
  }
  public set permissions(permissions: PebblePermissions | undefined) {
    this._permissions = permissions || DEFAULT_PERMISSIONS;
    this.write(this._permissions);
  }
  public get strPermissions(): string {
    this.read(this._permissions);
    return writePermissions(this._permissions);
  }
  public set strPermissions(permissions: string) {
    this.permissions = readPermissions(permissions);
  }
  private write(permissions: PebblePermissions) {
    for (let scope of PERMISSION_SCOPES) {
      for (let type of PERMISSION_TYPES) {
        this.checks[scope][type].checked = (permissions as any)[scope][type];
      }
    }
  }
  private read(permissions: PebblePermissions) {
    for (let scope of PERMISSION_SCOPES) {
      for (let type of PERMISSION_TYPES) {
        (permissions as any)[scope][type] = this.checks[scope][type].checked;
      }
    }
  }
}
