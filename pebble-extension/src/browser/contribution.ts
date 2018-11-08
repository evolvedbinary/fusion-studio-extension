import { injectable } from "inversify";
import { AbstractViewContribution, CommonMenus, KeybindingRegistry } from "@theia/core/lib/browser";
import { PebbleViewWidget } from "./widget";
import { MenuModelRegistry, CommandRegistry } from "@theia/core";
import { PEBBLE_COMMANDS } from "./commands";
import { PebbleConnection } from "../classes/connection";
import { NewConnectionDialog } from "./new-connection-dialog";

export const PEBBLE_CONNECTIONS_WIDGET_FACTORY_ID = 'pebble-view';
@injectable()
export class PebbleContribution extends AbstractViewContribution<PebbleViewWidget> {

  constructor() {
    super({
      widgetId: PEBBLE_CONNECTIONS_WIDGET_FACTORY_ID,
      widgetName: 'Pebble Connections',
      defaultWidgetOptions: {
        area: 'left'
      },
      toggleCommandId: 'PebbleView:toggle',
      toggleKeybinding: 'ctrlcmd+shift+c'
    });
  }

  async initializeLayout(): Promise<void> {
    await this.openView();
  }

  async onStart(): Promise<void> {
    // TODO: load saved state
  }

  onStop(): void {
    // TODO: save state
  }

  registerMenus(menus: MenuModelRegistry): void {
    super.registerMenus(menus);
    menus.registerMenuAction(PebbleViewWidget.CONTEXT_MENU, {
      commandId: PEBBLE_COMMANDS.connect.id,
      label: PEBBLE_COMMANDS.connect.menu,
      icon: PEBBLE_COMMANDS.connect.icon,
    });
    menus.registerMenuAction(CommonMenus.FILE_NEW, {
      commandId: PEBBLE_COMMANDS.connect.id,
      label: PEBBLE_COMMANDS.connect.menu,
      icon: PEBBLE_COMMANDS.connect.icon,
    });
  }

  registerCommands(registry: CommandRegistry): void {
    super.registerCommands(registry);
    registry.registerCommand(PEBBLE_COMMANDS.connect, {
      execute: () => this.connect()
    });
  }

  registerKeybindings(keybindings: KeybindingRegistry): void {
    super.registerKeybindings(keybindings);
    keybindings.registerKeybinding({
      command: PEBBLE_COMMANDS.connect.id,
      keybinding: PEBBLE_COMMANDS.connect.shortcut,
    });
  }

  protected async connect(): Promise<PebbleConnection | null> {
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

}
