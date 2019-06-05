import { WidgetFactory, Widget } from "@theia/core/lib/browser";
import { injectable, inject, interfaces, Container } from "inversify";
import { FSWelcomeWidget, FSWelcomeWidgetFactory } from "./widget/welcome";
import { DisposableCollection } from "vscode-ws-jsonrpc";
import { FSCore } from "./core";

@injectable()
export class FSWelcomeService implements WidgetFactory {

  id = 'fusion-welcome';

  protected widget?: FSWelcomeWidget;

  constructor(
    @inject(FSCore) protected core: FSCore,
    @inject(FSWelcomeWidgetFactory) protected factory: FSWelcomeWidgetFactory,
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

export function createFSWelcomeWidget(parent: interfaces.Container): FSWelcomeWidget {
  const child = new Container({ defaultScope: 'Singleton' });
  child.parent = parent;

  child.bind(FSWelcomeWidget).toSelf();

  return child.get(FSWelcomeWidget);
}
