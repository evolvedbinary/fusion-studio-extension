import { PebbleAction, PebbleSubMenu } from "../classes/action";
import { CommonMenus } from "@theia/core/lib/browser";
import { TEMPLATES } from "../common/templates";
import { PebbleTemplate } from "../classes/template";
import { PebbleCore } from "./core";

namespace check {
  export function connection(core: PebbleCore): boolean {
    return core.isConnection();
  }
  export function collection(core: PebbleCore): boolean {
    return core.isCollection();
  }
  export function document(core: PebbleCore): boolean {
    return core.isDocument();
  }
  export function selected(core: PebbleCore, count = 0): boolean {
    return !!core.node;
  }
  export function loading(core: PebbleCore): boolean {
    return !!core.node && !!core.node.loading;
  }
}

export const CONTEXT_MENU = ['pebble-context-menu'];
export const CONTEXT_MENU_CONNECTION = [...CONTEXT_MENU, 'a_connection'];
export const CONTEXT_MENU_NEW = [...CONTEXT_MENU, 'b_new'];
export const CONTEXT_MENU_REFRESH = [...CONTEXT_MENU, 'c_refresh'];
export const CONTEXT_MENU_NEW_SUBMENU = [...CONTEXT_MENU_NEW, 'a_from_template'];
export const CONTEXT_MENU_EDIT = [...CONTEXT_MENU, 'd_edit'];
export const CONTEXT_MENU_FILE = [...CONTEXT_MENU, 'e_file'];
export const MENU = CommonMenus.FILE;
export const actConnect: PebbleAction = {
  id: 'connect',
  order: 'a',
  label: 'Connect to a database',
  menu: MENU,
  menuLabel: 'Connect...',
  keys: 'ctrlcmd+alt+c',
  icon: 'fa fa-plug',
  execute: core => () => core.newConnection(),
};
export const actDisconnect: PebbleAction = {
  id: 'disconnect',
  order: 'b',
  label: 'Remove connection',
  contextMenu: CONTEXT_MENU_CONNECTION,
  icon: 'fa fa-minus',
  execute: core => () => core.deleteConnection(),
  enabled: core => () => check.connection(core),
  visible: core => () => check.connection(core),
};
export const actNewCollection: PebbleAction = {
  id: 'new-collection',
  order: 'd',
  label: 'New collection',
  contextMenu: CONTEXT_MENU_NEW,
  icon: 'fa fa-folder-o',
  execute: core => () => core.newItem(true),
  enabled: core => () => check.collection(core) && !check.loading(core),
  visible: core => () => check.collection(core) && !check.connection(core),
};
export const actNewDocument: PebbleAction = {
  id: 'new-document',
  order: 'a',
  label: 'Empty document',
  contextMenu: CONTEXT_MENU_NEW_SUBMENU,
  icon: 'fa fa-file-o',
  execute: core => () => core.newItem(),
  enabled: core => () => check.collection(core) && !check.loading(core),
  visible: core => () => check.collection(core) && !check.connection(core),
};
export const actUploadDocument: PebbleAction = {
  id: 'upload-document',
  order: 'c2',
  label: 'Upload document(s)',
  contextMenu: CONTEXT_MENU_NEW,
  icon: 'fa fa-upload',
  execute: core => () => core.uploadItem(),
  enabled: core => () => check.collection(core) && !check.loading(core),
  visible: core => () => check.collection(core) && !check.connection(core),
};
const templates: PebbleAction[] = TEMPLATES.map((template: PebbleTemplate, i: number) => ({
  id: 'new-document-template:' + template.name,
  label: template.name,
  order: 'b' + i.toString(),
  contextMenu: CONTEXT_MENU_NEW_SUBMENU,
  icon: 'fa fa-file-o',
  execute: core => () => core.newItemFromTemplate(template),
  enabled: core => () => check.collection(core) && !check.loading(core),
  visible: core => () => check.collection(core) && !check.connection(core),
} as PebbleAction));
export const actRename: PebbleAction = {
  id: 'rename',
  order: 'd',
  label: 'Rename',
  contextMenu: CONTEXT_MENU_EDIT,
  icon: 'fa fa-i-cursor',
  execute: core => () => core.renameItem(),
  enabled: core => () => (check.document(core) || check.collection(core)) && !check.loading(core),
  visible: core => () => check.selected(core) && !check.connection(core),
};
export const actCut: PebbleAction = {
  id: 'cut',
  order: 'a',
  label: 'Cut',
  contextMenu: CONTEXT_MENU_EDIT,
  icon: 'fa fa-scissors',
  execute: core => () => core.cut(),
  enabled: core => () => (check.document(core) || check.collection(core)) && !check.loading(core),
  visible: core => () => check.selected(core) && !check.connection(core),
};
export const actCopy: PebbleAction = {
  id: 'copy',
  order: 'd',
  label: 'Copy',
  contextMenu: CONTEXT_MENU_EDIT,
  icon: 'fa fa-files-o',
  execute: core => () => core.copy(),
  enabled: core => () => (check.document(core) || check.collection(core)) && !check.loading(core),
  visible: core => () => check.selected(core) && !check.connection(core),
};
export const actPaste: PebbleAction = {
  id: 'paste',
  order: 'd',
  label: 'Paste',
  contextMenu: CONTEXT_MENU_EDIT,
  icon: 'fa fa-clipboard',
  execute: core => () => core.paste(),
  enabled: core => () => (check.document(core) || check.collection(core)) && !check.loading(core),
  visible: core => () => check.collection(core),
};
export const actRefresh: PebbleAction = {
  id: 'refresh',
  order: 'a',
  label: 'Refresh',
  contextMenu: CONTEXT_MENU_FILE,
  icon: 'fa fa-refresh',
  execute: core => () => core.refresh(core.node as any),
  enabled: core => () => check.collection(core) && !check.loading(core),
  visible: core => () => check.collection(core) && !check.connection(core),
};
export const actDelete: PebbleAction = {
  id: 'delete',
  order: 'b',
  label: 'Delete',
  contextMenu: CONTEXT_MENU_FILE,
  icon: 'fa fa-trash',
  execute: core => () => core.deleteItem(),
  enabled: core => () => (check.document(core) || check.collection(core)) && !check.loading(core),
  visible: core => () => check.selected(core) && !check.connection(core),
};
export const actProperties: PebbleAction = {
  id: 'properties',
  order: 'c',
  label: 'Properties...',
  contextMenu: CONTEXT_MENU_FILE,
  keys: 'alt+enter',
  icon: 'fa fa-info-circle',
  execute: core => core.showPropertiesDialog.bind(core),
};
export const PEBBLE_COMMANDS: PebbleAction[] = [
  actConnect,
  actDisconnect,
  actNewCollection,
  actNewDocument,
  actUploadDocument,
  actCut,
  actCopy,
  actPaste,
  actRename,
  actRefresh,
  actDelete,
  actProperties,
  ...templates];
export const PEBBLE_SUBMENUES: PebbleSubMenu[] = [{
  label: 'New document...',
  menu: CONTEXT_MENU_NEW_SUBMENU,
}];