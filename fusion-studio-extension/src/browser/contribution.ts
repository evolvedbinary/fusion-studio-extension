import { injectable, inject } from "inversify";
import { AbstractViewContribution, KeybindingRegistry, WidgetManager } from "@theia/core/lib/browser";
import { FSViewWidget } from "./widget/main";
import { MenuModelRegistry, CommandRegistry } from "@theia/core";
import { FSCore, FS_CONNECTIONS_WIDGET_FACTORY_ID } from "./core";
import { registerCommands, registerMenus, registerKeybindings, registerSubMenus } from "../classes/action";
import { FS_COMMANDS, FS_SUBMENUES } from "./commands";
import { FrontendApplicationStateService } from "@theia/core/lib/browser/frontend-application-state";
@injectable()
export class FSContribution extends AbstractViewContribution<FSViewWidget> {

  constructor(
    @inject(FSCore) protected readonly core: FSCore,
    @inject(CommandRegistry) protected readonly commands: CommandRegistry,
    @inject(WidgetManager) protected widgetManager: WidgetManager,
    @inject(FrontendApplicationStateService) protected applicationStateService: FrontendApplicationStateService,
  ) {
    super({
      widgetId: FS_CONNECTIONS_WIDGET_FACTORY_ID,
      widgetName: 'Servers',
      defaultWidgetOptions: {
        area: 'left'
      },
      toggleCommandId: 'FusionView:toggle',
      toggleKeybinding: 'ctrlcmd+shift+c'
    });
    this.applicationStateService.onStateChanged(e => {
      if (e === 'initialized_layout') {
        this.openView({ activate: true, reveal: true })
      }
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
    registerMenus(menus, ...FS_COMMANDS);
    registerSubMenus(menus, ...FS_SUBMENUES);
  }

  async prepare() {
    const serversWidget = await this.widgetManager.getWidget(FS_CONNECTIONS_WIDGET_FACTORY_ID);
    if (!serversWidget) {
      await this.commands.executeCommand('FusionView:toggle');
    }
  }

  registerCommands(registry: CommandRegistry): void {
    super.registerCommands(registry);
    registerCommands(this.core, this.prepare.bind(this), registry, ...FS_COMMANDS);
  }
  
  registerKeybindings(keybindings: KeybindingRegistry): void {
    super.registerKeybindings(keybindings);
    registerKeybindings(keybindings, ...FS_COMMANDS);
  }
}
