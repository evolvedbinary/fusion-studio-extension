import { PebbleAction } from "../classes/action";
import { CommonMenus } from "@theia/core/lib/browser";

export const CONTEXT_MENU = ['pebble-context-menu'];
export const CONTEXT_MENU_CONNECTION = [...CONTEXT_MENU, 'a_connection'];
export const CONTEXT_MENU_NEW = [...CONTEXT_MENU, 'b_new'];
export const CONTEXT_MENU_EDIT = [...CONTEXT_MENU, 'c_edit'];
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
  enabled: core => () => !!core && core.isConnection(),
  visible: core => () => !!core && core.isConnection(),
};
export const actNewCollection: PebbleAction = {
  id: 'new-collection',
  order: 'd',
  label: 'New collection',
  contextMenu: CONTEXT_MENU_NEW,
  icon: 'fa fa-folder-o',
  execute: core => () => core && core.deleteConnection(),
  enabled: core => () => !!core && core.isCollection(),
  visible: core => () => !!core && core.selected && !core.isConnection(),
};
export const actNewDocument: PebbleAction = {
  id: 'new-document',
  order: 'c',
  label: 'New document',
  contextMenu: CONTEXT_MENU_NEW,
  icon: 'fa fa-file-o',
  execute: core => () => core && core.newDocument(),
  enabled: core => () => !!core && core.isCollection(),
  visible: core => () => !!core && core.selected && !core.isConnection(),
};
export const actRefresh: PebbleAction = {
  id: 'refresh',
  order: 'e',
  label: 'Refresh',
  contextMenu: CONTEXT_MENU_NEW,
  icon: 'fa fa-refresh',
  execute: core => () => core && core.refresh(core.node as any),
  enabled: core => () => !!core && core.isCollection(),
  visible: core => () => !!core && core.selected && !core.isConnection(),
};
export const actDelete: PebbleAction = {
  id: 'delete',
  order: 'f',
  label: 'Delete',
  contextMenu: CONTEXT_MENU_EDIT,
  icon: 'fa fa-trash',
  execute: core => () => core && core.deleteDocument(),
  enabled: core => () => !!core && core.isDocument(),
  visible: core => () => !!core && core.selected && !core.isConnection(),
};
export const PEBBLE_COMMANDS: PebbleAction[] = [actConnect, actDisconnect, actNewCollection, actNewDocument, actRefresh, actDelete];