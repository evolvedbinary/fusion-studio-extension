import { injectable, inject } from "inversify";
import { AbstractViewContribution, KeybindingRegistry } from "@theia/core/lib/browser";
import { PebbleViewWidget } from "./widget";
import { MenuModelRegistry, CommandRegistry } from "@theia/core";
import { PebbleCore } from "./core";
import { registerCommands, registerMenus, registerKeybindings } from "../classes/action";
import { PEBBLE_COMMANDS } from "./commands";

export const PEBBLE_CONNECTIONS_WIDGET_FACTORY_ID = 'pebble-view';
@injectable()
export class PebbleContribution extends AbstractViewContribution<PebbleViewWidget> {
  @inject(PebbleCore) protected readonly core?: PebbleCore;

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
    registerMenus(menus, ...PEBBLE_COMMANDS);
  }

  registerCommands(registry: CommandRegistry): void {
    super.registerCommands(registry);
    registerCommands(this.core, registry, ...PEBBLE_COMMANDS);
  }
  
  registerKeybindings(keybindings: KeybindingRegistry): void {
    super.registerKeybindings(keybindings);
    registerKeybindings(keybindings, ...PEBBLE_COMMANDS);
  }
}
