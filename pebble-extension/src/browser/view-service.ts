import { WidgetFactory, Widget, SelectableTreeNode, ExpandableTreeNode } from "@theia/core/lib/browser";
import { injectable, inject } from "inversify";
import { PebbleViewWidget, PebbleViewWidgetFactory } from "./widget/main";
import { PebbleNode, PebbleDocumentNode } from "../classes/node";
import { DisposableCollection } from "vscode-ws-jsonrpc";
import { PebbleCore } from "./core";
// import { EditorWidget } from "@theia/editor/lib/browser";

@injectable()
export class PebbleViewService implements WidgetFactory {

  id = 'pebble-view';

  protected widget?: PebbleViewWidget;

  constructor(
    @inject(PebbleCore) protected core: PebbleCore,
    @inject(PebbleViewWidgetFactory) protected factory: PebbleViewWidgetFactory,
  ) { }

  get open(): boolean {
    return this.widget !== undefined && this.widget.isVisible;
  }

  // publish(roots: PebbleNode[]): void {
  //   if (this.core) {
  //     this.core.createRoot(roots);
  //     // this.onDidChangeOutlineEmitter.fire(roots);
  //   }
  // }
  
  async onOpen(node: Readonly<any>): Promise<void> {
    if (PebbleNode.isDocument(node as any)) {
      const document = node as PebbleDocumentNode;
      document.editor = await this.core.openDocument(document);
      this.widget && this.widget.model.refresh();
    } else if (PebbleNode.isCollection(node as any)) {
      this.core.refresh(node as any);
    }
  }
  
  async onExpansionChanged(node: Readonly<ExpandableTreeNode>): Promise<void> {
    if (!this.widget) {
      return;
    }
    if (node.expanded) {
      this.core.expanded(node);
    }
  }
  
  async onSelectionChanges(nodes: ReadonlyArray<Readonly<SelectableTreeNode>>): Promise<void> {
    if (!this.widget) {
      return;
    }
    const toolbar = nodes.find(node => PebbleNode.isToolbar(node));
    if (toolbar) {
      this.widget.model.toggleNode(toolbar);
    } else {
      const deleteButton = document.getElementById('pebble-toolbar-button-delete');
      if (deleteButton) {
        const enabled = nodes.length && PebbleNode.isConnection(nodes[0]);
        if (enabled) {
          deleteButton.removeAttribute('disabled');
        } else {
          deleteButton.setAttribute('disabled', 'disabled');
        }
      }
    }
  }

  createWidget(): Promise<Widget> {
    this.widget = this.factory();
    const disposables = new DisposableCollection();
    disposables.push(this.widget.model.onSelectionChanged(this.onSelectionChanges.bind(this)));
    disposables.push(this.widget.model.onOpenNode(this.onOpen.bind(this)));
    disposables.push(this.widget.model.onExpansionChanged(this.onExpansionChanged.bind(this)));
    this.widget.disposed.connect(() => {
      this.widget = undefined;
      disposables.dispose();
    });
    return Promise.resolve(this.widget);
  }
}
