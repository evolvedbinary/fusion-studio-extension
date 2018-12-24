import { PebbleAction, PebbleSubMenu } from "../classes/action";
import { CommonMenus } from "@theia/core/lib/browser";
import { TEMPLATES } from "../common/templates";
import { PebbleTemplate } from "../classes/template";
import { PebbleCore } from "./core";

namespace check {
  export function connection(core?: PebbleCore): boolean {
    return !!core && core.isConnection();
  }
  export function collection(core?: PebbleCore): boolean {
    return !!core && core.isCollection();
  }
  export function document(core?: PebbleCore): boolean {
    return !!core && core.isDocument();
  }
  export function selected(core?: PebbleCore, count = 0): boolean {
    return !!core && !!core.node;
  }
  export function loading(core?: PebbleCore): boolean {
    return !!core && !!core.node && !!core.node.loading;
  }
}

export const CONTEXT_MENU = ['pebble-context-menu'];
export const CONTEXT_MENU_CONNECTION = [...CONTEXT_MENU, 'a_connection'];
export const CONTEXT_MENU_NEW = [...CONTEXT_MENU, 'b_new'];
export const CONTEXT_MENU_REFRESH = [...CONTEXT_MENU, 'c_new'];
export const CONTEXT_MENU_NEW_FROM_TEMPLATE = [...CONTEXT_MENU_NEW, 'z_from_template'];
export const CONTEXT_MENU_EDIT = [...CONTEXT_MENU, 'd_edit'];
export const MENU = CommonMenus.FILE;
export const actConnect: PebbleAction = {
  id: 'connect',
  order: 'a',
  label: 'Connect to a database',
  menu: MENU,
  menuLabel: 'Connect...',
  keys: 'ctrlcmd+alt+c',
  icon: 'fa fa-plug',
  execute: core => () => core && core.newConnection(),
};
export const actDisconnect: PebbleAction = {
  id: 'disconnect',
  order: 'b',
  label: 'Remove connection',
  contextMenu: CONTEXT_MENU_CONNECTION,
  icon: 'fa fa-minus',
  execute: core => () => core && core.deleteConnection(),
  enabled: core => () => check.connection(core),
  visible: core => () => check.connection(core),
};
export const actNewCollection: PebbleAction = {
  id: 'new-collection',
  order: 'd',
  label: 'New collection',
  contextMenu: CONTEXT_MENU_NEW,
  icon: 'fa fa-folder-o',
  execute: core => () => core && core.newItem(true),
  enabled: core => () => check.collection(core) && !check.loading(core),
  visible: core => () => check.collection(core) && !check.connection(core),
};
export const actNewDocument: PebbleAction = {
  id: 'new-document',
  order: 'c',
  label: 'New document',
  contextMenu: CONTEXT_MENU_NEW,
  icon: 'fa fa-file-o',
  execute: core => () => core && core.newItem(),
  enabled: core => () => check.collection(core) && !check.loading(core),
  visible: core => () => check.collection(core) && !check.connection(core),
};
export const actUploadDocument: PebbleAction = {
  id: 'upload-document',
  order: 'c2',
  label: 'Upload document',
  contextMenu: CONTEXT_MENU_NEW,
  icon: 'fa fa-upload',
  execute: core => () => core && core.uploadItem(),
  enabled: core => () => check.collection(core) && !check.loading(core),
  visible: core => () => check.collection(core) && !check.connection(core),
};
const templates: PebbleAction[] = TEMPLATES.map((template: PebbleTemplate) => ({
  id: 'new-document-template:' + template.name,
  label: template.name,
  contextMenu: CONTEXT_MENU_NEW_FROM_TEMPLATE,
  icon: 'fa fa-file-o',
  execute: core => () => core && core.newItemFromTemplate(template),
  enabled: core => () => check.collection(core) && !check.loading(core),
  visible: core => () => check.collection(core) && !check.connection(core),
} as PebbleAction));
export const actRefresh: PebbleAction = {
  id: 'refresh',
  order: 'e',
  label: 'Refresh',
  contextMenu: CONTEXT_MENU_REFRESH,
  icon: 'fa fa-refresh',
  execute: core => () => core && core.refresh(core.node as any),
  enabled: core => () => check.collection(core) && !check.loading(core),
  visible: core => () => check.collection(core) && !check.connection(core),
};
export const actDelete: PebbleAction = {
  id: 'delete',
  order: 'f',
  label: 'Delete',
  contextMenu: CONTEXT_MENU_EDIT,
  icon: 'fa fa-trash',
  execute: core => () => core && core.deleteItem(),
  enabled: core => () => (check.document(core) || check.collection(core)) && !check.loading(core),
  visible: core => () => check.selected(core) && !check.connection(core),
};
export const PEBBLE_COMMANDS: PebbleAction[] = [
  actConnect,
  actDisconnect,
  actNewCollection,
  actNewDocument,
  actUploadDocument,
  actRefresh,
  actDelete,
  ...templates];
export const PEBBLE_SUBMENUES: PebbleSubMenu[] = [{
  label: 'New from template...',
  menu: CONTEXT_MENU_NEW_FROM_TEMPLATE,
}];