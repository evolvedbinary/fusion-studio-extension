import { WidgetFactory, Widget } from "@theia/core/lib/browser";
import { injectable, inject, interfaces, Container } from "inversify";
import { FSEvalWidget, FSEvalWidgetFactory } from "./widget/eval";
import { DisposableCollection } from "vscode-ws-jsonrpc";
import { FSCore } from "./core";

@injectable()
export class FSEvalService implements WidgetFactory {

  id = 'fusion-eval';

  protected widget?: FSEvalWidget;

  constructor(
    @inject(FSCore) protected core: FSCore,
    @inject(FSEvalWidgetFactory) protected factory: FSEvalWidgetFactory,
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

export function createFSEvalWidget(parent: interfaces.Container): FSEvalWidget {
  const child = new Container({ defaultScope: 'Singleton' });
  child.parent = parent;

  child.bind(FSEvalWidget).toSelf();

  return child.get(FSEvalWidget);
}
