import { TreeImpl, TreeModelImpl, CompositeTreeNode, TreeNode } from "@theia/core/lib/browser";
import { FSNode } from "./node";

export class FSTree extends TreeImpl {
  public _removeNode(node?: TreeNode) {
    this.removeNode(node);
  }
}
export class FSTreeModel extends TreeModelImpl {
  public removeNode(node: FSNode) {
    CompositeTreeNode.removeChild(node.parent as CompositeTreeNode, node);
    (this.tree as FSTree)._removeNode(node);
  }
}

