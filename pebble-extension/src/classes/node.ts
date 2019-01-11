import { TreeNode, ExpandableTreeNode, SelectableTreeNode, CompositeTreeNode } from "@theia/core/lib/browser";
import { PebbleConnection } from "./connection";
import { PebbleDocument, PebbleCollection } from "./item";

export interface PebblecontainerNode extends CompositeTreeNode, ExpandableTreeNode {}

export interface PebbleNode extends TreeNode {
  type: 'connection' | 'toolbar' | 'item';
  connection?: PebbleConnection;
  uri: string;
  loading?: boolean;
}

export interface PebbleConnectionNode extends PebbleNode, PebblecontainerNode, SelectableTreeNode {
  type: 'connection';
  connection: PebbleConnection;
  loaded?: boolean;
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
  isCollection: boolean;
}
export interface PebbleCollectionNode extends PebbleItemNode, PebblecontainerNode {
  collection: PebbleCollection;
  isCollection: true;
}
export interface PebbleDocumentNode extends PebbleItemNode {
  document: PebbleDocument;
  isCollection: false;
  isNew: boolean;
  editor?: any;
}

export namespace PebbleNode {
  export function is(node?: TreeNode): node is PebbleNode {
    return !!node && 'type' in node;
  }
  export function isConnection(node?: TreeNode): node is PebbleConnectionNode {
    return PebbleNode.is(node) && node.type === 'connection';
  }
  export function isToolbar(node?: TreeNode): node is PebbleToolbarNode {
    return PebbleNode.is(node) && node.type === 'toolbar';
  }
  export function isItem(node?: TreeNode): node is PebbleCollectionNode {
    return PebbleNode.is(node) && node.type === 'item';
  }
  export function isCollection(node?: TreeNode): node is PebbleCollectionNode {
    return PebbleNode.isItem(node) && node.isCollection;
  }
  export function isDocument(node?: TreeNode): node is PebbleDocumentNode {
    return PebbleNode.isItem(node) && !node.isCollection;
  }
}