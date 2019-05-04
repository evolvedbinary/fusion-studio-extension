import { injectable, inject } from "inversify";
import { AbstractViewContribution } from "@theia/core/lib/browser";
import { FSEvalWidget } from "./widget/eval";
import { FSCore } from "./core";
import { FS_EVAL_WIDGET_FACTORY_ID } from '../classes/eval';

@injectable()
export class FSEvalContribution extends AbstractViewContribution<FSEvalWidget> {

  constructor(
    @inject(FSCore) protected readonly core: FSCore,
  ) {
    super({
      widgetId: FS_EVAL_WIDGET_FACTORY_ID,
      widgetName: 'Evaluation',
      defaultWidgetOptions: {
        area: 'bottom'
      },
      toggleCommandId: 'FusionEval:toggle',
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
