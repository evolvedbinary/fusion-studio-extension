import { TreeNode, ExpandableTreeNode, SelectableTreeNode, CompositeTreeNode } from "@theia/core/lib/browser";
import { PebbleConnection } from "./connection";
import { PebbleDocument, PebbleCollection } from "./item";


export type PebbleNodeType = 'connection' | 'toolbar' | 'item' | 'users' | 'groups' | 'user' | 'group' | 'security';
export interface PebbleNode extends TreeNode {
  type: PebbleNodeType;
  connection: PebbleConnection;
  uri: string;
  loading?: boolean;
}
export interface PebblecontainerNode extends PebbleNode, CompositeTreeNode, ExpandableTreeNode {}

export interface PebbleConnectionNode extends PebbleNode, PebblecontainerNode, SelectableTreeNode {
  type: 'connection';
  loaded?: boolean;
}
export interface PebbleToolbarNode extends PebbleNode {
  type: 'toolbar';
}
export interface PebbleItemNode extends PebbleNode, SelectableTreeNode {
  // type: 'item';
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
export interface PebbleUserNode extends PebbleNode, SelectableTreeNode {
  type: 'user',
}
export interface PebbleUsersNode extends PebblecontainerNode, SelectableTreeNode {
  type: 'users',
}
export interface PebbleGroupNode extends PebbleNode, SelectableTreeNode {
  type: 'group',
}
export interface PebbleGroupsNode extends PebblecontainerNode, SelectableTreeNode {
  type: 'groups',
}
export interface PebbleSecurityNode extends PebblecontainerNode, SelectableTreeNode {
  type: 'security',
  users: PebbleUsersNode,
  groups: PebbleGroupsNode,
}

export namespace PebbleNode {
  export function is(node?: TreeNode): node is PebbleNode {
    return !!node && 'type' in node;
  }
  export function isContainer(node?: TreeNode): node is PebblecontainerNode {
    return PebbleNode.is(node) && CompositeTreeNode.is(node) && ExpandableTreeNode.is(node);
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
  export function isUser(node?: TreeNode): node is PebbleUserNode {
    return PebbleNode.is(node) && node.type === 'user';
  }
  export function isUsers(node?: TreeNode): node is PebbleUsersNode {
    return PebbleNode.isContainer(node) && node.type === 'users';
  }
  export function isGroup(node?: TreeNode): node is PebbleGroupNode {
    return PebbleNode.is(node) && node.type === 'group';
  }
  export function isGroups(node?: TreeNode): node is PebbleGroupsNode {
    return PebbleNode.isContainer(node) && node.type === 'groups';
  }
  export function isSecurity(node?: TreeNode): node is PebbleSecurityNode {
    return PebbleNode.isContainer(node) && node.type === 'security';
  }
}