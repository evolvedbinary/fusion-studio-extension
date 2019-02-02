import { WidgetFactory, Widget, SelectableTreeNode, ExpandableTreeNode, createTreeContainer, Tree, TreeModel, TreeProps, TreeWidget, defaultTreeProps } from "@theia/core/lib/browser";
import { injectable, inject, interfaces } from "inversify";
import { PebbleViewWidget, PebbleViewWidgetFactory } from "./widget/main";
import { PebbleNode, PebbleDocumentNode } from "../classes/node";
import { DisposableCollection } from "vscode-ws-jsonrpc";
import { PebbleCore } from "./core";
import { PebbleTree, PebbleTreeModel } from "../classes/tree";
import { CONTEXT_MENU } from "./commands";

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
  
  async onOpen(node: Readonly<any>): Promise<void> {
    if (PebbleNode.isDocument(node as any)) {
      const document = node as PebbleDocumentNode;
      document.editor = await this.core.openDocument(document);
      this.widget && this.widget.model.refresh();
    } else if (PebbleNode.isConnection(node as any)) {
      this.core.showPropertiesDialog();
    }
  }
  
  async onExpansionChanged(node: Readonly<ExpandableTreeNode>): Promise<void> {
    if (!this.widget) {
      return;
    }
    if (node.expanded && PebbleNode.isContainer(node)) {
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
      this.core.status();
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

const TREE_PROPS = {
  multiSelect: true,
  contextMenuPath: CONTEXT_MENU,
}

export function createPebbleViewWidget(parent: interfaces.Container): PebbleViewWidget {
  const child = createTreeContainer(parent);

  child.bind(PebbleTree).toSelf();
  child.rebind(Tree).toService(PebbleTree);

  child.bind(PebbleTreeModel).toSelf();
  child.rebind(TreeModel).toService(PebbleTreeModel);

  child.rebind(TreeProps).toConstantValue({ ...defaultTreeProps, ...TREE_PROPS });

  child.unbind(TreeWidget);
  child.bind(PebbleViewWidget).toSelf();

  return child.get(PebbleViewWidget);
}
