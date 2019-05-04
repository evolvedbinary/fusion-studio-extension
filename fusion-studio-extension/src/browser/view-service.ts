import { WidgetFactory, Widget, SelectableTreeNode, ExpandableTreeNode, createTreeContainer, Tree, TreeModel, TreeProps, TreeWidget, defaultTreeProps } from "@theia/core/lib/browser";
import { injectable, inject, interfaces } from "inversify";
import { FSViewWidget, FSViewWidgetFactory } from "./widget/main";
import { FSNode, FSDocumentNode } from "../classes/node";
import { DisposableCollection } from "vscode-ws-jsonrpc";
import { FSCore } from "./core";
import { FSTree, FSTreeModel } from "../classes/tree";
import { CONTEXT_MENU } from "./commands";

@injectable()
export class FSViewService implements WidgetFactory {

  id = 'fusion-view';

  protected widget?: FSViewWidget;

  constructor(
    @inject(FSCore) protected core: FSCore,
    @inject(FSViewWidgetFactory) protected factory: FSViewWidgetFactory,
  ) { }

  get open(): boolean {
    return this.widget !== undefined && this.widget.isVisible;
  }
  
  async onOpen(node: Readonly<any>): Promise<void> {
    if (FSNode.isDocument(node as any)) {
      const document = node as FSDocumentNode;
      document.editor = await this.core.openDocument(document);
      this.widget && this.widget.model.refresh();
    } else if (FSNode.isConnection(node as any)) {
      this.core.showPropertiesDialog();
    }
  }
  
  async onExpansionChanged(node: Readonly<ExpandableTreeNode>): Promise<void> {
    if (!this.widget) {
      return;
    }
    if (node.expanded && FSNode.isContainer(node)) {
      this.core.expanded(node);
    }
  }
  
  async onSelectionChanges(nodes: ReadonlyArray<Readonly<SelectableTreeNode>>): Promise<void> {
    if (!this.widget) {
      return;
    }
    const toolbar = nodes.find(node => FSNode.isToolbar(node));
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

export function createFSViewWidget(parent: interfaces.Container): FSViewWidget {
  const child = createTreeContainer(parent);

  child.bind(FSTree).toSelf();
  child.rebind(Tree).toService(FSTree);

  child.bind(FSTreeModel).toSelf();
  child.rebind(TreeModel).toService(FSTreeModel);

  child.rebind(TreeProps).toConstantValue({ ...defaultTreeProps, ...TREE_PROPS });

  child.unbind(TreeWidget);
  child.bind(FSViewWidget).toSelf();

  return child.get(FSViewWidget);
}
