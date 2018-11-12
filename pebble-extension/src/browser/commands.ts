import { PebbleAction } from "../classes/action";
import { CommonMenus } from "@theia/core/lib/browser";

export const CONTEXT_MENU = ['pebble-context-menu'];
export const CONTEXT_MENU_CONNECTION = [...CONTEXT_MENU, 'a_connection'];
export const CONTEXT_MENU_NEW = [...CONTEXT_MENU, 'b_new'];
export const CONTEXT_MENU_EDIT = [...CONTEXT_MENU, 'c_edit'];
export const MENU = CommonMenus.FILE_NEW;
export const PEBBLE_COMMANDS: PebbleAction[] = [{
  id: 'connect',
  order: 'a',
  label: 'Connect to a database',
  menu: MENU,
  menuLabel: 'Connect...',
  keys: 'alt+shift+u',
  icon: 'fa fa-plug',
  execute: core => () => core && core.newConnection(),
}, {
  id: 'disconnect',
  order: 'b',
  label: 'Remove connection',
  contextMenu: CONTEXT_MENU_CONNECTION,
  keys: 'alt+shift+i',
  icon: 'fa fa-minus',
  execute: core => () => core && core.deleteConnection(),
  enabled: core => () => !!core && core.isConnection(),
  visible: core => () => !!core && core.isConnection(),
}, {
  id: 'new-collection',
  order: 'd',
  label: 'New collection',
  menu: MENU,
  contextMenu: CONTEXT_MENU_NEW,
  // keys: 'alt+shift+i',
  icon: 'fa fa-folder-o',
  execute: core => () => core && core.deleteConnection(),
  enabled: core => () => !!core && core.isCollection(),
  visible: core => () => !!core && core.selected,
}, {
  id: 'new-document',
  order: 'c',
  label: 'New document',
  menu: MENU,
  contextMenu: CONTEXT_MENU_NEW,
  // keys: 'alt+shift+i',
  icon: 'fa fa-file-o',
  execute: core => () => core && core.newDocument(),
  enabled: core => () => !!core && core.isCollection(),
  visible: core => () => !!core && core.selected,
}, {
  id: 'delete',
  order: 'e',
  label: 'Delete',
  menu: MENU,
  contextMenu: CONTEXT_MENU_EDIT,
  // keys: 'alt+shift+i',
  icon: 'fa fa-trash',
  execute: core => () => core && core.deleteDocument(),
  enabled: core => () => !!core && core.isDocument(),
  visible: core => () => !!core && core.selected,
}];