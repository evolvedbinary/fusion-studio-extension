import { PebbleAction } from "../classes/action";
import { CommonMenus } from "@theia/core/lib/browser";
import { PebbleConnection } from "../classes/connection";
import { NewConnectionDialog } from "./new-connection-dialog";
import { PebbleViewWidget } from "./widget";

const connect: PebbleAction = {
  id: 'pebble.connect',
  label: 'Connect to a database',
  menu: CommonMenus.FILE_NEW,
  menuLabel: 'Connect...',
  keys: 'alt+shift+u',
  icon: 'fa fa-plug',
  execute: session => async (): Promise<PebbleConnection | null> => {
    const dialog = new NewConnectionDialog({
      title: 'New connection',
      name: 'Localhost',
      server: 'http://localhost:8080',
      username: '',
      password: '',
    });
    const result = await dialog.open();
    return result ? result.connection : null;
  }
};
const disconnect: PebbleAction = {
  id: 'pebble.disconnect',
  label: 'Remove connection',
  contextMenu: PebbleViewWidget.CONTEXT_MENU,
  keys: 'alt+shift+i',
  icon: 'fa fa-plus',
  execute: session => () => alert('bo'),
  enabled: session => () => false,
};

export const PEBBLE_COMMANDS = {
  connect,
  disconnect,
};