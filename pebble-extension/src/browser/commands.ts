import { PebbleAction } from "../classes/action";
import { CommonMenus } from "@theia/core/lib/browser";
import { PebbleViewWidget } from "./widget";

const connect: PebbleAction = {
  id: 'connect',
  label: 'Connect to a database',
  menu: CommonMenus.FILE_NEW,
  menuLabel: 'Connect...',
  keys: 'alt+shift+u',
  icon: 'fa fa-plug',
  execute: core => () => core && core.newConnection(),
};
const disconnect: PebbleAction = {
  id: 'disconnect',
  label: 'Remove connection',
  contextMenu: PebbleViewWidget.CONTEXT_MENU,
  keys: 'alt+shift+i',
  icon: 'fa fa-minus',
  execute: core => () => core && core.deleteConnection(),
  enabled: core => () => !!core && core.isConnection(),
  visible: core => () => !!core && core.selected,
};

export const PEBBLE_COMMANDS = {
  connect,
  disconnect,
};