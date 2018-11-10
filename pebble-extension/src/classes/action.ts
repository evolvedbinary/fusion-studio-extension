import { PebbleCore } from "../browser/core";
import { CommandRegistry, MenuModelRegistry, CommandHandler } from "@theia/core";
import { KeybindingRegistry } from "@theia/core/lib/browser";

export const ACTIONS_SCOPE = 'pebble';
export namespace PebbleAction {
  export function is(action: any): action is PebbleAction {
    return !!action && typeof action === 'object'
      && 'id' in action
      && 'label' in action
      && 'execute' in action;
  }
}
export interface PebbleAction {
  id: string,
  label: string,
  menu?: string[],
  menuLabel?: string,
  contextMenu?: string[],
  contextMenuLabel?: string,
  keys?: string,
  icon?: string,
  execute: (core: PebbleCore | undefined) => (...args: any[]) => any;
  enabled?(core: PebbleCore | undefined): (...args: any[]) => boolean;
  visible?(core: PebbleCore | undefined): (...args: any[]) => boolean;
  toggled?(core: PebbleCore | undefined): (...args: any[]) => boolean;
}

export function actionID(id: string): string {
  return id.indexOf('.') > -1 ? id : ACTIONS_SCOPE + '.' + id;
}

export function registerCommands(core: PebbleCore | undefined, commands: CommandRegistry, ...actions: PebbleAction[]) {
  actions.forEach(action => {
    const command = {
      id: actionID(action.id),
      label: action.label,
    }
    const handler: CommandHandler = {
      execute: action.execute(core),
    }
    if (action.enabled) {
      handler.isEnabled = action.enabled(core);
    }
    if (action.visible) {
      handler.isVisible = action.visible(core);
    }
    if (action.toggled) {
      handler.isToggled = action.toggled(core);
    }
    commands.registerCommand(command, handler);
  });
}
export function registerMenus(menus: MenuModelRegistry, ...actions: PebbleAction[]) {
  actions.forEach(action => {
    if (action.menu) {
      menus.registerMenuAction(action.menu, {
        commandId: action.id,
        icon: action.icon,
        label: action.menuLabel || action.label,
      })
    }
    if (action.contextMenu) {
      menus.registerMenuAction(action.contextMenu, {
        commandId: action.id,
        icon: action.icon,
        label: action.contextMenuLabel || action.label,
      })
    }
  });
}
export function registerKeybindings(keybindings: KeybindingRegistry, ...actions: PebbleAction[]) {
  actions.forEach(action => {
    if (action.keys) {
      keybindings.registerKeybinding({
        command: action.id,
        keybinding: action.keys,
      });
    }
  });
}