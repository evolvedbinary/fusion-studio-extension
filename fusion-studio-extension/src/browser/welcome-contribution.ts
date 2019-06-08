import { injectable, inject } from "inversify";
import { AbstractViewContribution, CommonMenus } from "@theia/core/lib/browser";
import { FSWelcomeWidget } from "./widget/welcome";
import { FS_WELCOME_WIDGET_FACTORY_ID } from '../classes/welcome';
import { FrontendApplicationStateService } from "@theia/core/lib/browser/frontend-application-state";
import { MenuModelRegistry } from "@theia/core";

@injectable()
export class FSWelcomeContribution extends AbstractViewContribution<FSWelcomeWidget> {

  constructor(
    @inject(FrontendApplicationStateService) protected applicationStateService: FrontendApplicationStateService,
  ) {
    super({
      widgetId: FS_WELCOME_WIDGET_FACTORY_ID,
      widgetName: 'Welcome',
      defaultWidgetOptions: {
        mode: 'tab-after',
      },
      toggleCommandId: 'FusionEval:welcome',
    });
    this.applicationStateService.onStateChanged(e => {
      if (e === 'initialized_layout') {
        this.openView({ activate: true, reveal: true });
        this.widget.then(w => {
          if (!w.restore()) {
            this.openView({ toggle: true });
          }
        });
      }
    });
  }

  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(CommonMenus.HELP, {
      commandId: 'FusionEval:welcome',
      label: 'Fusion Studio',
      icon: 'fa fa-plug',
      order: '0',
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
}
