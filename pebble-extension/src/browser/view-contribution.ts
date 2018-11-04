import { AbstractViewContribution, FrontendApplicationContribution, FrontendApplication } from "@theia/core/lib/browser";
import { PebbleViewWidget } from "./widget";
import { injectable } from "inversify";

export const PEBBLE_CONNECTIONS_WIDGET_FACTORY_ID = 'pebble-view';
@injectable()
export class PebbleViewContribution extends AbstractViewContribution<PebbleViewWidget> implements FrontendApplicationContribution {
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
  async initializeLayout(app: FrontendApplication): Promise<void> {
    await this.openView();
  }
}