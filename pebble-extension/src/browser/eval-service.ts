import { WidgetFactory, Widget } from "@theia/core/lib/browser";
import { injectable, inject, interfaces, Container } from "inversify";
import { PebbleEvalWidget, PebbleEvalWidgetFactory } from "./widget/eval";
import { DisposableCollection } from "vscode-ws-jsonrpc";
import { PebbleCore } from "./core";

@injectable()
export class PebbleEvalService implements WidgetFactory {

  id = 'pebble-eval';

  protected widget?: PebbleEvalWidget;

  constructor(
    @inject(PebbleCore) protected core: PebbleCore,
    @inject(PebbleEvalWidgetFactory) protected factory: PebbleEvalWidgetFactory,
  ) {}
  
  createWidget(): Promise<Widget> {
    this.widget = this.factory();
    const disposables = new DisposableCollection();
    this.widget.disposed.connect(() => {
      this.widget = undefined;
      disposables.dispose();
    });
    return Promise.resolve(this.widget);
  }
}

export function createPebbleEvalWidget(parent: interfaces.Container): PebbleEvalWidget {
  const child = new Container({ defaultScope: 'Singleton' });
  child.parent = parent;

  child.bind(PebbleEvalWidget).toSelf();

  return child.get(PebbleEvalWidget);
}
