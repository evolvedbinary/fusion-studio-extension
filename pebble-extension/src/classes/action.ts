import { PebbleCore } from "../browser/core";
import { CommandRegistry, MenuModelRegistry, CommandHandler } from "@theia/core";
import { KeybindingRegistry } from "@theia/core/lib/browser";

export interface PebbleAction {
  id: string,
  label: string,
  menu?: string[],
  menuLabel?: string,
  contextMenu?: string[],
  contextMenuLabel?: string,
  keys?: string,
  icon?: string,
  execute(session: PebbleCore | undefined): (...args: any[]) => any;
  enabled?(session: PebbleCore | undefined): (...args: any[]) => boolean;
  visible?(session: PebbleCore | undefined): (...args: any[]) => boolean;
  toggled?(session: PebbleCore | undefined): (...args: any[]) => boolean;
}
export function registerCommands(core: PebbleCore | undefined, commands: CommandRegistry, ...actions: PebbleAction[]) {
  actions.forEach(action => {
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
    commands.registerCommand(action, handler);
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