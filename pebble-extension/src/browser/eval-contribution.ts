import { injectable, inject } from "inversify";
import { AbstractViewContribution } from "@theia/core/lib/browser";
import { PebbleEvalWidget } from "./widget/eval";
import { PebbleCore } from "./core";
import { PEBBLE_EVAL_WIDGET_FACTORY_ID } from '../classes/eval';

@injectable()
export class PebbleEvalContribution extends AbstractViewContribution<PebbleEvalWidget> {

  constructor(
    @inject(PebbleCore) protected readonly core: PebbleCore,
  ) {
    super({
      widgetId: PEBBLE_EVAL_WIDGET_FACTORY_ID,
      widgetName: 'Evaluation',
      defaultWidgetOptions: {
        area: 'bottom'
      },
      toggleCommandId: 'PebbleEval:toggle',
      toggleKeybinding: 'ctrlcmd+shift+x'
    });
  }

  async initializeLayout(): Promise<void> {
    console.log('initializw layout: evel');
    await this.openView();
  }

  async onStart(): Promise<void> {
    // TODO: load saved state
  }

  onStop(): void {
    // TODO: save state
  }
}
