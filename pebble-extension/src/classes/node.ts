import { TreeNode, ExpandableTreeNode, SelectableTreeNode, CompositeTreeNode } from "@theia/core/lib/browser";
import { PebbleConnection } from "./connection";

export interface PebbleNode extends TreeNode {
  type: 'connection' | 'toolbar' | 'item' | 'loading';
  connection?: PebbleConnection;
  uri?: string;
}

export interface PebbleConnectionNode extends PebbleNode, CompositeTreeNode, SelectableTreeNode,  ExpandableTreeNode {
  type: 'connection';
  connection: PebbleConnection;
  loaded?: boolean;
}
export interface PebbleLoadingNode extends PebbleNode {
  type: 'loading';
  connection?: PebbleConnection;
}
export interface PebbleToolbarNode extends PebbleNode {
  type: 'toolbar';
  connection?: PebbleConnection;
}
export interface PebbleItemNode extends PebbleNode, SelectableTreeNode {
  type: 'item';
  connection: PebbleConnection;
  link: string;
  loaded?: boolean;
  loading?: boolean;
  collection: boolean;
}
export interface PebbleCollectionNode extends PebbleItemNode, CompositeTreeNode, ExpandableTreeNode {
  collection: true;
}
export interface PebbleDocumentNode extends PebbleItemNode {
  collection: false;
  isNew: boolean;
}

export namespace PebbleNode {
  export function is(node: TreeNode): node is PebbleNode {
    return !!node && 'type' in node;
  }
  export function isConnection(node: TreeNode): node is PebbleConnectionNode {
    return PebbleNode.is(node) && node.type === 'connection';
  }
  export function isToolbar(node: TreeNode): node is PebbleToolbarNode {
    return PebbleNode.is(node) && node.type === 'toolbar';
  }
  export function isLoading(node: TreeNode): node is PebbleLoadingNode {
    return PebbleNode.is(node) && node.type === 'loading';
  }
  export function isItem(node: TreeNode): node is PebbleCollectionNode {
    return PebbleNode.is(node) && node.type === 'item';
  }
  export function isCollection(node: TreeNode): node is PebbleCollectionNode {
    return PebbleNode.isItem(node) && node.collection;
  }
  export function isDocument(node: TreeNode): node is PebbleItemNode {
    return PebbleNode.isItem(node) && !node.collection;
  }
}