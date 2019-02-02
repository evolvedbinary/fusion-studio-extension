import { TreeNode, ExpandableTreeNode, SelectableTreeNode, CompositeTreeNode } from "@theia/core/lib/browser";
import { PebbleDocument, PebbleCollection } from "./item";
import { PebbleConnection } from "./connection";
import { PebbleRestURI, PebbleRestMethod } from "./rest";


export type PebbleNodeType = 'connection' | 'toolbar' | 'item' | 'users' | 'groups' | 'user' | 'group' | 'security' | 'indexes' | 'index' | 'rest' | 'rest-uri' | 'rest-method';
export interface PebbleNode extends TreeNode {
  type: PebbleNodeType;
  connectionNode: PebbleConnectionNode;
  uri: string;
  loading?: boolean;
  loaded?: boolean;
}
export interface PebbleContainerNode extends PebbleNode, CompositeTreeNode, ExpandableTreeNode {}

export interface PebbleConnectionNode extends PebbleNode, PebbleContainerNode, SelectableTreeNode {
  type: 'connection';
  connection: PebbleConnection;
  db: PebbleCollectionNode;
  security: PebbleSecurityNode
  indexes: PebbleIndexesNode
  rest: PebbleRestNode
}
export interface PebbleToolbarNode extends PebbleNode {
  type: 'toolbar';
}
export interface PebbleItemNode extends PebbleNode, SelectableTreeNode {
  // type: 'item';
  link: string;
  isCollection: boolean;
}
export interface PebbleCollectionNode extends PebbleItemNode, PebbleContainerNode {
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
export interface PebbleUsersNode extends PebbleContainerNode, SelectableTreeNode {
  type: 'users',
}
export interface PebbleGroupNode extends PebbleNode, SelectableTreeNode {
  type: 'group',
}
export interface PebbleGroupsNode extends PebbleContainerNode, SelectableTreeNode {
  type: 'groups',
}
export interface PebbleSecurityNode extends PebbleContainerNode, SelectableTreeNode {
  type: 'security',
  users: PebbleUsersNode,
  groups: PebbleGroupsNode,
}
export interface PebbleIndexNode extends PebbleNode, SelectableTreeNode {
  type: 'index',
}
export interface PebbleIndexesNode extends PebbleContainerNode, SelectableTreeNode {
  type: 'indexes',
}

export interface PebbleRestNode extends PebbleContainerNode, SelectableTreeNode {
  type: 'rest',
}
export interface PebbleRestURINode extends PebbleContainerNode, SelectableTreeNode {
  type: 'rest-uri',
  restURI: PebbleRestURI,
}
export interface PebbleRestMethodNode extends PebbleNode, SelectableTreeNode {
  type: 'rest-method',
  restMethod: PebbleRestMethod,
}

export namespace PebbleNode {
  export function is(node?: TreeNode): node is PebbleNode {
    return !!node && 'type' in node;
  }
  export function isContainer(node?: TreeNode): node is PebbleContainerNode {
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
  export function isIndex(node?: TreeNode): node is PebbleIndexNode {
    return PebbleNode.is(node) && node.type === 'index';
  }
  export function isIndexes(node?: TreeNode): node is PebbleIndexesNode {
    return PebbleNode.isContainer(node) && node.type === 'indexes';
  }
  export function isRest(node?: TreeNode): node is PebbleRestNode {
    return PebbleNode.isContainer(node) && node.type === 'rest';
  }
  export function isRestURI(node?: TreeNode): node is PebbleRestURINode {
    return PebbleNode.isContainer(node) && node.type === 'rest-uri';
  }
  export function isRestMethod(node?: TreeNode): node is PebbleRestMethodNode {
    return PebbleNode.is(node) && node.type === 'rest-method';
  }
}