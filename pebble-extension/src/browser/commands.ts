import { PebbleAction, PebbleSubMenu } from "../classes/action";
import { CommonMenus } from "@theia/core/lib/browser";
import { TEMPLATES } from "../common/templates";
import { PebbleTemplate } from "../classes/template";

export const CONTEXT_MENU = ['pebble-context-menu'];
export const CONTEXT_MENU_CONNECTION = [...CONTEXT_MENU, 'a_connection'];
export const CONTEXT_MENU_NEW = [...CONTEXT_MENU, 'b_new'];
export const CONTEXT_MENU_REFRESH = [...CONTEXT_MENU, 'c_refresh'];
export const CONTEXT_MENU_NEW_SUBMENU = [...CONTEXT_MENU_NEW, 'a_from_template'];
export const CONTEXT_MENU_EDIT = [...CONTEXT_MENU, 'd_edit'];
export const CONTEXT_MENU_FILE = [...CONTEXT_MENU, 'e_file'];
export const CONTEXT_MENU_SECURITY = [...CONTEXT_MENU, 'f_security'];
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
  visible: core => () => core.isConnection,
};
export const actNewCollection: PebbleAction = {
  id: 'new-collection',
  order: 'd',
  label: 'New collection',
  contextMenu: CONTEXT_MENU_NEW,
  icon: 'fa fa-folder-o',
  execute: core => () => core.newItem(true),
  enabled: core => () => !core.isLoading,
  visible: core => () => core.isCollection,
};
export const actNewDocument: PebbleAction = {
  id: 'new-document',
  order: 'a',
  label: 'Empty document',
  contextMenu: CONTEXT_MENU_NEW_SUBMENU,
  icon: 'fa fa-file-o',
  execute: core => () => core.newItem(),
  enabled: core => () => !core.isLoading,
  visible: core => () => core.isCollection,
};
export const actNewDocumentFromResult: PebbleAction = {
  id: 'new-document-from-result',
  order: 'b',
  label: 'From last evaluation',
  contextMenu: CONTEXT_MENU_NEW_SUBMENU,
  icon: 'fa fa-file-code-o',
  execute: core => () => core.newItemFromResult(),
  enabled: core => () => !core.isLoading,
  visible: core => () => core.isCollection && !!core.result,
};
export const actUploadDocument: PebbleAction = {
  id: 'upload-document',
  order: 'c2',
  label: 'Upload document(s)',
  contextMenu: CONTEXT_MENU_NEW,
  icon: 'fa fa-upload',
  execute: core => () => core.uploadItem(),
  enabled: core => () => !core.isLoading,
  visible: core => () => core.isCollection,
};
const templates: PebbleAction[] = TEMPLATES.map((template: PebbleTemplate, i: number) => ({
  id: 'new-document-template:' + template.name,
  label: template.name,
  order: 'c' + i.toString(),
  contextMenu: CONTEXT_MENU_NEW_SUBMENU,
  icon: 'fa fa-file-o',
  execute: core => () => core.newItemFromTemplate(template),
  enabled: core => () => !core.isLoading,
  visible: core => () => core.isCollection,
} as PebbleAction));
export const actRename: PebbleAction = {
  id: 'rename',
  order: 'd',
  label: 'Rename',
  contextMenu: CONTEXT_MENU_EDIT,
  icon: 'fa fa-i-cursor',
  execute: core => () => core.renameItem(),
  enabled: core => () => !core.isLoading,
  visible: core => () => core.isItem,
};
export const actCut: PebbleAction = {
  id: 'cut',
  order: 'a',
  label: 'Cut',
  contextMenu: CONTEXT_MENU_EDIT,
  icon: 'fa fa-scissors',
  execute: core => () => core.cut(),
  enabled: core => () => !core.isLoading,
  visible: core => () => core.isItem,
};
export const actCopy: PebbleAction = {
  id: 'copy',
  order: 'd',
  label: 'Copy',
  contextMenu: CONTEXT_MENU_EDIT,
  icon: 'fa fa-files-o',
  execute: core => () => core.copy(),
  enabled: core => () => !core.isLoading,
  visible: core => () => core.isItem,
};
export const actPaste: PebbleAction = {
  id: 'paste',
  order: 'd',
  label: 'Paste',
  contextMenu: CONTEXT_MENU_EDIT,
  icon: 'fa fa-clipboard',
  execute: core => () => core.paste(),
  enabled: core => () => !core.isLoading && core.canPaste(),
  visible: core => () => core.isCollection,
};
export const actRefresh: PebbleAction = {
  id: 'refresh',
  order: 'a',
  label: 'Refresh',
  contextMenu: CONTEXT_MENU_FILE,
  icon: 'fa fa-refresh',
  execute: core => () => core.refresh(core.node as any),
  enabled: core => () => !core.isLoading,
  visible: core => () => core.isCollection,
};
export const actDelete: PebbleAction = {
  id: 'delete',
  order: 'b',
  label: 'Delete',
  contextMenu: CONTEXT_MENU_FILE,
  icon: 'fa fa-trash',
  execute: core => () => core.deleteItem(),
  enabled: core => () => !core.isLoading,
  visible: core => () => core.isItem,
};
export const actProperties: PebbleAction = {
  id: 'properties',
  order: 'c',
  label: 'Properties...',
  contextMenu: CONTEXT_MENU_FILE,
  keys: 'alt+enter',
  icon: 'fa fa-info-circle',
  execute: core => core.showPropertiesDialog.bind(core),
  visible: core => () => (core.isItem && !core.isNew) || core.isConnection,
};
export const actAddUser: PebbleAction = {
  id: 'add-user',
  order: 'a',
  label: 'Add user',
  contextMenu: CONTEXT_MENU_SECURITY,
  icon: 'fa fa-user-plus',
  execute: core => () => core.addUser(),
  visible: core => () => core.isUsers || core.isSecurity,
};
export const actEditUser: PebbleAction = {
  id: 'edit-user',
  order: 'b',
  label: 'Edit',
  contextMenu: CONTEXT_MENU_SECURITY,
  icon: 'fa fa-pencil',
  execute: core => () => core.editUser(),
  visible: core => () => core.isUser,
};
export const actDeleteUser: PebbleAction = {
  id: 'delete-user',
  order: 'c',
  label: 'Delete',
  contextMenu: CONTEXT_MENU_SECURITY,
  icon: 'fa fa-trash',
  execute: core => () => core.deleteUser(),
  enabled: core => () => core.canDeleteUser(),
  visible: core => () => core.isUser,
};
export const actAddGroup: PebbleAction = {
  id: 'add-group',
  order: 'd',
  label: 'Add group',
  contextMenu: CONTEXT_MENU_SECURITY,
  icon: 'fa fa-user-plus',
  execute: core => () => core.addGroup(),
  visible: core => () => core.isGroups || core.isSecurity,
};
export const actEditGroup: PebbleAction = {
  id: 'edit-group',
  order: 'e',
  label: 'Edit',
  contextMenu: CONTEXT_MENU_SECURITY,
  icon: 'fa fa-pencil',
  execute: core => () => core.editGroup(),
  visible: core => () => core.isGroup,
};
export const actDeleteGroup: PebbleAction = {
  id: 'delete-group',
  order: 'f',
  label: 'Delete',
  contextMenu: CONTEXT_MENU_SECURITY,
  icon: 'fa fa-trash',
  execute: core => () => core.deleteGroup(),
  enabled: core => () => core.canDeleteGroup(),
  visible: core => () => core.isGroup,
};
export const PEBBLE_COMMANDS: PebbleAction[] = [
  actConnect,
  actDisconnect,
  actNewCollection,
  actNewDocument,
  actNewDocumentFromResult,
  actUploadDocument,
  actCut,
  actCopy,
  actPaste,
  actRename,
  actRefresh,
  actDelete,
  actProperties,
  actAddUser,
  actEditUser,
  actDeleteUser,
  actAddGroup,
  actEditGroup,
  actDeleteGroup,
  ...templates];
export const PEBBLE_SUBMENUES: PebbleSubMenu[] = [{
  label: 'New document...',
  menu: CONTEXT_MENU_NEW_SUBMENU,
}];