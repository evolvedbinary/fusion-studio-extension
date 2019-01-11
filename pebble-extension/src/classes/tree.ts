import { TreeImpl, TreeModelImpl, CompositeTreeNode, TreeNode } from "@theia/core/lib/browser";
import { PebbleNode } from "./node";

export class PebbleTree extends TreeImpl {
  public _removeNode(node?: TreeNode) {
    this.removeNode(node);
  }
}
export class PebbleTreeModel extends TreeModelImpl {
  public removeNode(node: PebbleNode) {
    CompositeTreeNode.removeChild(node.parent as CompositeTreeNode, node);
    (this.tree as PebbleTree)._removeNode(node);
  }
}

