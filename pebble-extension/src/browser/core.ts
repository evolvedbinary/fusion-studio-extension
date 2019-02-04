import { injectable, inject } from "inversify";
import { PebbleNode, PebbleDocumentNode, PebbleCollectionNode, PebbleToolbarNode, PebbleConnectionNode, PebbleItemNode, PebbleSecurityNode, PebbleUsersNode, PebbleGroupsNode, PebbleUserNode, PebbleGroupNode, PebbleContainerNode, PebbleIndexesNode, PebbleIndexNode, PebbleRestNode, PebbleRestURINode, PebbleRestMethodNode } from "../classes/node";
import { open, TreeNode, CompositeTreeNode, ConfirmDialog, SingleTextInputDialog, OpenerService, StatusBar, StatusBarAlignment, WidgetManager } from "@theia/core/lib/browser";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { OpenFileDialogProps, FileDialogService } from "@theia/filesystem/lib/browser";
import { PebbleDocument, PebbleCollection, PebbleItem } from "../classes/item";
import { PebbleConnection, ServerConnections, ServerConnectionsChangeEvent } from "../classes/connection";
import { CommandRegistry, Event, Emitter } from "@theia/core";
import { actionID } from "../classes/action";
import { PebbleApi } from "../common/api";
import URI from "@theia/core/lib/common/uri";
import { PebbleDragOperation } from "./widget/drag";
import { PebbleTemplate } from "../classes/template";
import { PebbleConnectionDialog, NewFromTemplateDialog, PebblePropertiesDialog } from "./dialogs";
import { PebbleFiles, PebbleFileList } from "../classes/files";
import { isArray } from "util";
import { lookup } from "mime-types";
import { createError, PebbleError } from "../classes/error";
import { asyncForEach } from "../common/asyncForEach";
import { PebbleStatusEntry } from "../classes/status";
import { actProperties } from "./commands";
import { PebbleTreeModel } from "../classes/tree";
import { PebbleUserDialog } from "./dialogs/user-dialog";
import { PebbleGroupDialog } from "./dialogs/group-dialog";
import { PEBBLE_EVAL_WIDGET_FACTORY_ID, XQ_EXT } from '../classes/eval';

export const PEBBLE_RESOURCE_SCHEME = 'pebble';
const TRAILING_SYMBOL = '/';
const STATUSBAR_ELEMENT = 'pebble-statusbar';
@injectable()
export class PebbleCore {
  protected statusEntry: PebbleStatusEntry = { text: '', alignment: StatusBarAlignment.LEFT, command: actionID(actProperties.id) };
  protected clipboard: Partial<PebbleDragOperation> = {};
  protected lastNameID: number = 1;
  public result: string = '';
  public connectionsChange = new Emitter<ServerConnectionsChangeEvent>();
  public connections: ServerConnections = {};
  constructor(
    @inject(CommandRegistry) protected readonly commands: CommandRegistry,
    @inject(WorkspaceService) protected readonly workspace: WorkspaceService,
    @inject(FileDialogService) protected readonly fileDialog: FileDialogService,
    @inject(PebbleFiles) protected readonly files: PebbleFiles,
    @inject(OpenerService) private readonly openerService: OpenerService,
    @inject(StatusBar) protected readonly statusBar: StatusBar,
    @inject(WidgetManager) protected widgetManager: WidgetManager,
  ) {}

  // tree model
  private _model?: PebbleTreeModel;
  public set model(model: PebbleTreeModel | undefined) {
    if (this._model != model) {
      this._model = model;
      this.createRoot();
    }
  }
  public get model(): PebbleTreeModel | undefined {
    return this._model;
  }

  // connections list

  get onConnectionsChange(): Event<ServerConnectionsChangeEvent> {
    return this.connectionsChange.event;
  }

  protected connectionAdded(connectionNode: PebbleConnectionNode) {
    this.connectionsChange.fire({ id: connectionNode.id, action: 'add' })
    this.connections[connectionNode.id] = connectionNode.connection;
  }

  protected connectionDeleted(connectionNode: PebbleConnectionNode) {
    this.connectionsChange.fire({ id: connectionNode.id, action: 'delete' })
    delete(this.connections[connectionNode.id]);
  }

  // nodes:

  protected sortItems(a: PebbleNode, b: PebbleNode): number {
    if (PebbleNode.isItem(a) && PebbleNode.isItem(b)) {
      if (a.isCollection === b.isCollection) {
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
      } else {
        return a.isCollection ? -1 : 1;
      }
    } else {
      return PebbleNode.isItem(a) ? 1 : PebbleNode.isItem(b) ? -1 : a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    }
  }

  protected sortRest(a: PebbleNode, b: PebbleNode): number {
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  }

  protected async sort(node: CompositeTreeNode, sortfunc: (a: PebbleNode, b: PebbleNode) => number) {
    if (this._model) {
      console.log('sorting...', node.id);
      if (PebbleNode.isContainer(node)) {
        node.children = (node.children as PebbleNode[]).sort(sortfunc);
      }
      await this._model.refresh(node);
    }
  }

  protected createRoot() {
    if (this._model) {
      this._model.root = {
        id: 'pebble-connections-view-root',
        name: 'Servers Root',
        visible: false,
        children: [],
        parent: undefined
      } as CompositeTreeNode;
      this.addToolbar(this._model.root as CompositeTreeNode);
    }
  }

  protected async addNode(child: PebbleNode, parent: CompositeTreeNode): Promise<PebbleNode> {
    CompositeTreeNode.addChild(parent as CompositeTreeNode, child);
    if (PebbleNode.isCollection(parent)) {
      await this.sort(parent, this.sortItems);
    } else {
      if (this._model) {
        await this._model.refresh();
      }
    }
    return this.getNode(child.id) as PebbleNode;
  }

  protected addToolbar(parent: CompositeTreeNode): void {
    this.addNode({
      type: 'toolbar',
      id: 'pebble-toolbar',
      uri: 'toolbar',
      name: 'Pebble Toolbar',
      parent: parent,
      selected: false,
      connectionNode: undefined as any,
    } as PebbleToolbarNode, parent);
  }

  protected removeNode(child: PebbleNode) {
    this._model && this._model.removeNode(child);
    this.refresh();
  }

  public get selectedCount(): number {
    return this._model ? this._model.selectedNodes.length : 0;
  }

  public get node(): PebbleNode | undefined {
    if (this._model && this._model.selectedNodes.length > 0) {
      return this._model.selectedNodes[0] as any as PebbleNode;
    }
  }

  public get selection(): PebbleItemNode[] {
    return this._model ? this._model.selectedNodes as any : [];
  }

  public select(node: PebbleItemNode | PebbleConnectionNode | PebbleRestMethodNode | PebbleUserNode | PebbleGroupNode) {
    if (!PebbleNode.isToolbar(node)) {
      this._model && this._model.selectNode(node);
    }
  }

  protected async empty(node: CompositeTreeNode) {
    while (node.children.length) {
      this.removeNode(node.children[node.children.length - 1] as PebbleNode);
    }
  }
  
  public expanded(node: PebbleContainerNode) {
    if (node.loaded) {
      if (PebbleNode.isCollection(node)) {
        this.asyncLoad(node);
      } else if (PebbleNode.isUsers(node)) {
        this.refreshUsers(node.connectionNode.security);
      } else if (PebbleNode.isGroups(node)) {
        this.refreshGroups(node.connectionNode.security);
      } else if (PebbleNode.isIndexes(node)) {
        this.refreshIndexes(node.connectionNode);
      }
    } else {
      if (PebbleNode.isConnection(node)) {
        this.connect(node);
      } else if (PebbleNode.isCollection(node)) {
        this.load(node, node.uri);
      }
    }
  }

  public expand(node: CompositeTreeNode) {
    this._model && this._model.expandNode(node as any);
  }

  public getNode(id: string): PebbleNode | undefined {
    return this._model ? this._model.getNode(id) as PebbleNode : undefined;
  }

  // Pebble nodes detection

  public get isSelected(): boolean {
    return !!this._model && this._model.selectedNodes.length > 0;
  }

  public get isNew(): boolean {
    return PebbleNode.isDocument(this.node) && this.node.isNew;
  }

  public get isItem(): boolean {
    return this.isSelected && PebbleNode.isItem(this.node);
  }

  public get isConnection(): boolean {
    return this.isSelected && PebbleNode.isConnection(this.node);
  }

  public get isCollection(): boolean {
    return this.isSelected && PebbleNode.isCollection(this.node);
  }

  public get isDocument(): boolean {
    return this.isSelected && PebbleNode.isDocument(this.node);
  }

  public get isLoading(): boolean {
    return this.isSelected && !!this.node && !!this.node.loading;
  }

  public get isSecurity(): boolean {
    return this.isSelected && PebbleNode.isSecurity(this.node);
  }
  public get isUsers(): boolean {
    return this.isSelected && PebbleNode.isUsers(this.node);
  }

  public get isUser(): boolean {
    return this.isSelected && PebbleNode.isUser(this.node);
  }

  public get isGroups(): boolean {
    return this.isSelected && PebbleNode.isGroups(this.node);
  }

  public get isGroup(): boolean {
    return this.isSelected && PebbleNode.isGroup(this.node);
  }

  // Pebble nodes

  protected async connect(connectionNode: PebbleConnectionNode) {
    if (this.startLoading(connectionNode)) {
      try {
        const root = await PebbleApi.connect(connectionNode.connection);
        connectionNode.loaded = true;
        // connectionNode.db = await this.addCollection(connectionNode, root);
        // connectionNode.db.loaded = true;
        // root.collections.forEach(subCollection => this.addCollection(connectionNode, subCollection));
        this.addCollection(connectionNode, root.collections[0]);
        // root.documents.forEach(document => this.addDocument(connectionNode, document));
        this.expand(connectionNode.db);
        // await this.sort(connectionNode.db, this.sortItems);
        connectionNode.security = await this.addSecurity(connectionNode);
        connectionNode.indexes = await this.addIndexes(connectionNode);
        connectionNode.rest = await this.addRestNode(connectionNode);
      } catch (error) {
        connectionNode.expanded = false;
        console.error('caught:', error);
      }
      this.endLoading(connectionNode);
    }
  }

  protected startLoading(node: TreeNode): boolean {
    if (PebbleNode.is(node)) {
      if (node.loading) {
        return false;
      } else {
        let parentNode = node.parent;
        while (PebbleNode.isItem(parentNode)) {
          if (parentNode.loading) {
            return false;
          }
          parentNode = parentNode.parent;
        }
      }
      node.loading = true;
      this.refresh();
      return true;
    }
    return false;
  }

  protected endLoading(node: TreeNode): void {
    if (PebbleNode.is(node)) {
      node.loading = false;
      this.refresh();
    }
  }
  
  protected async asyncLoad(node: PebbleCollectionNode) {
    try {
      const result = await PebbleApi.load(node.connectionNode.connection, node.uri);
      if (PebbleItem.isCollection(result)) {
        const collection = result;
        // refresh collections
        let collectionsOld = node.children.filter(child => PebbleNode.isCollection(child)) as PebbleCollectionNode[];
        const collectionsNew = collection.collections.filter(subCollection => {
          const collectionNode = this.getNode(this.itemID(node.connectionNode.connection, subCollection));
          if (PebbleNode.isCollection(collectionNode) && collectionNode.parent === node) {
            collectionsOld = collectionsOld.filter(old => old !== collectionNode);
            collectionNode.collection = subCollection;
            return false;
          }
          return true;
        });
        collectionsOld.forEach(node => this.removeNode(node));
        collectionsNew.forEach(collection => this.addCollection(node, collection));
        // refresh documents
        let documentsOld = node.children.filter(child => PebbleNode.isDocument(child)) as PebbleDocumentNode[];
        const documentsNew = collection.documents.filter(subDocument => {
          const documentNode = this.getNode(this.itemID(node.connectionNode.connection, subDocument));
          if (PebbleNode.isDocument(documentNode) && documentNode.parent === node) {
            documentsOld = documentsOld.filter(old => old !== documentNode);
            documentNode.document = subDocument;
            return false;
          }
          return true;
        });
        documentsOld.forEach(node => this.removeNode(node));
        documentsNew.forEach(document => this.addDocument(node, document));
        // done refreshing
        (node as PebbleCollectionNode).collection = collection;
      }
    } catch (error) {
      (node as PebbleCollectionNode).loaded = false;
      (node as PebbleCollectionNode).expanded = false;
      console.error('caught:', error);
    }
  }
  
  protected async load(node: PebbleCollectionNode, uri: string) {
    if (this.startLoading(node)) {
      try {
        const result = await PebbleApi.load(node.connectionNode.connection, uri);
        if (PebbleItem.isCollection(result)) {
          node.loaded = true;
          const collection = result as PebbleCollection;
          await this.addCollectionIndex(node);
          await Promise.all(collection.collections.map(subCollection => this.addCollection(node, subCollection)));
          await Promise.all(collection.documents.map(document => this.addDocument(node, document)));
          node.collection = collection;
        }
      } catch (error) {
        node.expanded = false;
        console.error('caught:', error);
      }
      this.endLoading(node);
    }
  }

  public async saveByUri(uri: string, connection: PebbleConnection, content: string) {
    return await PebbleApi.save(connection, uri, content);
  }

  public async save(document: PebbleDocumentNode, content: string) {
    try {
      const doc = await this.saveByUri(document.uri, document.connectionNode.connection, content);
      if (doc) {
        document.isNew = false;
        document.document = doc;
        this.refresh();
      }
    } catch (error) {
      console.error('caught:', error);
    }
  }

  protected async saveDocument(connection: PebbleConnection, uri: string, content: string | Blob, contenType = ''): Promise<boolean> {
    try {
      return await !!PebbleApi.save(connection, uri, content, contenType);
    } catch (error) {
      console.error('caught:', error);
      return false;
    }
  }

  public async saveDocuments(node: PebbleCollectionNode, documents: PebbleFileList | FormData): Promise<PebbleDocument[]> {
    try {
      this.startLoading(node);
      const docs = await PebbleApi.saveDocuments(node.connectionNode.connection, node.collection, documents);
      this.endLoading(node);
      this.load(node, node.uri);
      return docs;
    } catch (error) {
      this.endLoading(node);
      console.error('caught:', error);
      return [];
    }
  }

  protected async addConnection(connection: PebbleConnection, parent: CompositeTreeNode, expanded?: boolean): Promise<PebbleConnectionNode> {
    const connectionNode = await this.addNode({
      type: 'connection',
      children: [],
      expanded,
      id: this.connectionID(connection),
      name: connection.name,
      connectionNode: (parent as PebbleContainerNode).connectionNode,
      connection,
      parent: parent as any,
      selected: false,
      uri: connection.server,
      db: undefined as any,
      security: undefined as any,
      indexes: undefined as any,
      rest: undefined as any,
    } as PebbleConnectionNode, parent) as PebbleConnectionNode;
    connectionNode.connectionNode = connectionNode;
    this.connectionAdded(connectionNode);
    return connectionNode;
  }
  protected async addCollectionRecursive(connection: PebbleConnection, uri: string): Promise<PebbleCollectionNode> {
    const node = this.getNode(this.connectionID(connection) + uri);
    if (node) {
      if (PebbleNode.isCollection(node)) {
        return node;
      } else {
        throw createError(PebbleError.unknown);
      }
    } else {
      const parent = await this.addCollectionRecursive(connection, this.parentCollection(uri));
      return this.addCollection(parent, {
        created: new Date(),
        name: uri,
        acl: [],
        collections: [],
        documents: [],
        group: 'dba',
        owner: connection.username,
      });
    }
  }

  protected async addDocumentRecursive(connection: PebbleConnection, document: PebbleDocument, isNew: boolean = false): Promise<PebbleDocumentNode> {
    const parent = await this.addCollectionRecursive(connection, this.parentCollection(document.name));
    return this.addDocument(parent, document);
  }

  protected addDocument(parent: PebbleCollectionNode, document: PebbleDocument, isNew: boolean = false): PebbleDocumentNode {
    const name = this.getName(document.name);
    if (PebbleNode.isCollection(parent)) {
      document.name = this.collectionDir(parent.uri, name);
    }
    const node: PebbleDocumentNode = {
      type: 'item',
      connectionNode: parent.connectionNode,
      isCollection: false,
      id: this.itemID(parent.connectionNode.connection, document),
      name,
      parent: parent,
      link: PEBBLE_RESOURCE_SCHEME + ':' + document.name,
      isNew,
      selected: false,
      uri: document.name,
      document,
    };
    this.addNode(node, parent);
    return node;
  }

  protected async addCollection(parent: PebbleCollectionNode | PebbleConnectionNode, collection: PebbleCollection): Promise<PebbleCollectionNode> {
    const name = this.getName(collection.name);
    if (PebbleNode.isCollection(parent)) {
      collection.name = this.collectionDir(parent.uri, name);
    }
    const node: PebbleCollectionNode = {
      type: 'item',
      connectionNode: parent.connectionNode,
      isCollection: true,
      children: [],
      id: this.itemID(parent.connectionNode.connection, collection),
      link: PEBBLE_RESOURCE_SCHEME + ':' + collection.name,
      name,
      parent: parent as CompositeTreeNode,
      selected: false,
      expanded: false,
      collection,
      uri: collection.name,
    };
    return this.addNode(node, parent) as Promise<PebbleCollectionNode>;
  }

  protected async addUserNode(parent: PebbleUsersNode, user: string): Promise<PebbleNode> {
    const node: PebbleUserNode = {
      type: 'user',
      connectionNode: parent.connectionNode,
      id: this.userID(parent.connectionNode.connection, user),
      description: user,
      name: user,
      parent,
      uri: '/users/' + user,
      selected: false,
    };
    return this.addNode(node, parent) as Promise<PebbleNode>;
  }

  protected async refreshUsers(node: PebbleSecurityNode): Promise<void> {
    const users = await PebbleApi.getUsers(node.users.connectionNode.connection);
    let usersOld = node.users.children.filter(child => PebbleNode.isUser(child)) as PebbleUserNode[];
    const usersNew = users.filter(user => {
      const userNode = this.getNode(this.userID(node.users.connectionNode.connection, user));
      if (PebbleNode.isUser(userNode) && userNode.parent === node.users) {
        usersOld = usersOld.filter(old => old !== userNode);
        return false;
      }
      return true;
    });
    usersOld.forEach(node => this.removeNode(node));
    usersNew.forEach(user => this.addUserNode(node.connectionNode.security.users, user));
  }

  protected async addUsersNode(parent: PebbleSecurityNode, users: string[]): Promise<PebbleUsersNode> {
    const usersNode = await this.addNode({
      type: 'users',
      connectionNode: parent.connectionNode,
      children: [],
      id: this.userID(parent.connectionNode.connection),
      description: 'Users',
      name: 'Users',
      parent,
      uri: '/users',
      expanded: false,
      selected: false,
    } as PebbleUsersNode, parent) as PebbleUsersNode;
    await Promise.all(users.map(user => this.addUserNode(usersNode, user)));
    usersNode.loaded = true;
    return usersNode as PebbleUsersNode;
  }

  protected async addGroupNode(parent: PebbleGroupsNode, group: string): Promise<PebbleNode> {
    const node: PebbleGroupNode = {
      type: 'group',
      connectionNode: parent.connectionNode,
      id: this.groupID(parent.connectionNode.connection, group),
      description: group,
      name: group,
      parent,
      uri: '/groups/' + group,
      selected: false,
    };
    return this.addNode(node, parent) as Promise<PebbleNode>;
  }

  protected async refreshGroups(node: PebbleSecurityNode): Promise<void> {
    const groups = await PebbleApi.getGroups(node.groups.connectionNode.connection);
    let groupsOld = node.groups.children.filter(child => PebbleNode.isGroup(child)) as PebbleGroupNode[];
    const groupsNew = groups.filter(group => {
      const groupNode = this.getNode(this.groupID(node.groups.connectionNode.connection, group));
      if (PebbleNode.isGroup(groupNode) && groupNode.parent === node.groups) {
        groupsOld = groupsOld.filter(old => old !== groupNode);
        return false;
      }
      return true;
    });
    groupsOld.forEach(node => this.removeNode(node));
    groupsNew.forEach(group => this.addGroupNode(node.connectionNode.security.groups, group));
  }

  protected async addGroupsNode(parent: PebbleSecurityNode, groups: string[]): Promise<PebbleGroupsNode> {
    const groupsNode = await this.addNode({
      type: 'groups',
      connectionNode: parent.connectionNode,
      children: [],
      id: this.groupID(parent.connectionNode.connection),
      description: 'Groups',
      name: 'Groups',
      parent,
      uri: '/groups',
      expanded: false,
      selected: false,
    } as PebbleGroupsNode, parent) as PebbleGroupsNode;
    await Promise.all(groups.map(group => this.addGroupNode(groupsNode, group)));
    groupsNode.loaded = true;
    return groupsNode as PebbleGroupsNode;
  }

  protected async addSecurity(connectionNode: PebbleConnectionNode): Promise<PebbleSecurityNode> {
    const securityNode = await this.addNode({
      type: 'security',
      connectionNode,
      children: [],
      id: this.securityID(connectionNode.connection),
      description: 'Security',
      name: 'Security',
      parent,
      uri: '/security',
      expanded: false,
      selected: false,
    } as any, connectionNode) as PebbleSecurityNode;
    const users = await PebbleApi.getUsers(connectionNode.connection);
    securityNode.users = await this.addUsersNode(securityNode, users);
    const groups = await PebbleApi.getGroups(connectionNode.connection);
    securityNode.groups = await this.addGroupsNode(securityNode, groups);
    return securityNode;
  }

  protected createIndexNode(parent: PebbleContainerNode, uri: string): PebbleIndexNode {
    return {
      connectionNode: parent.connectionNode,
      id: this.indexID(parent.connectionNode.connection, uri),
      name: uri,
      parent: parent,
      uri: uri,
      type: 'index',
      selected: false,
    };
  }

  protected async addCollectionIndex(collectionNode: PebbleCollectionNode): Promise<PebbleIndexNode | undefined> {
    const index = await PebbleApi.getIndex(collectionNode.connectionNode.connection, collectionNode.uri);
    const indexNode = this.createIndexNode(collectionNode, collectionNode.uri);
    (indexNode as any).name = 'Indexes';
    return index ? await this.addNode(indexNode, collectionNode) as PebbleIndexNode : undefined;
  }

  protected async addIndex(indexesNode: PebbleIndexesNode, uri: string): Promise<PebbleIndexNode> {
    return await this.addNode(this.createIndexNode(indexesNode, uri), indexesNode) as PebbleIndexNode;
  }

  protected async refreshIndexes(connectionNode: PebbleConnectionNode): Promise<void> {
    const indexes = await PebbleApi.getIndexes(connectionNode.connection);
    let indexesOld = connectionNode.indexes.children.filter(child => PebbleNode.isIndex(child)) as PebbleIndexNode[];
    const indexesNew = indexes.filter(index => {
      const indexNode = this.getNode(this.indexID(connectionNode.connection, index));
      if (PebbleNode.isIndex(indexNode) && indexNode.parent === connectionNode.indexes) {
        indexesOld = indexesOld.filter(old => old !== indexNode);
        return false;
      }
      return true;
    });
    indexesOld.forEach(node => this.removeNode(node));
    indexesNew.forEach(index => this.addIndex(connectionNode.indexes, index));
  }

  protected async addIndexes(connectionNode: PebbleConnectionNode): Promise<PebbleIndexesNode> {
    const indexes = await PebbleApi.getIndexes(connectionNode.connection);
    const indexesNode = await this.addNode({
      connectionNode,
      children: [],
      id: this.indexID(connectionNode.connection),
      name: 'Indexes',
      parent: connectionNode,
      uri: '/index',
      type: 'indexes',
      selected: false,
      expanded: false,
    } as PebbleIndexesNode, connectionNode) as PebbleIndexesNode;
    await Promise.all(indexes.map(index => this.addIndex(indexesNode, index)));
    indexesNode.loaded = true;
    return indexesNode;
  }

  protected async addRestNode(connectionNode: PebbleConnectionNode): Promise<PebbleRestNode> {
    const rest = await this.addNode({
      type: 'rest',
      children: [],
      id: this.restID(connectionNode.connection),
      uri: 'rest',
      name: 'RestXQ',
      parent: connectionNode,
      selected: false,
      expanded: false,
      connectionNode,
    } as PebbleRestNode, connectionNode) as PebbleRestNode;
    const uris = await PebbleApi.restxq(connectionNode.connection);
    await Promise.all(uris.filter(uri => uri.uri !== '/').map(async uri => {
      const uriNode = await this.addNode({
        type: 'rest-uri',
        children: [],
        id: this.restID(connectionNode.connection, uri.uri),
        uri: 'rest',
        restURI: uri,
        name: uri.uri,
        parent: rest,
        selected: false,
        expanded: false,
        connectionNode,
      } as PebbleRestURINode, rest) as PebbleRestURINode;
      uri.methods.forEach(method => this.addNode({
        type: 'rest-method',
        id: this.restID(connectionNode.connection, uri.uri, method.name),
        uri: 'rest',
        name: method.name,
        restMethod: method,
        parent: uriNode,
        selected: false,
        connectionNode,
      } as PebbleRestMethodNode, uriNode))
    }));
    await this.sort(rest, this.sortRest);
    return rest;
  }

  public status() {
    const nodes = this.topNodes(this.selection);
    if (nodes.length) {
      this.statusEntry.active = true;
      if (nodes.length > 1) {
        this.statusEntry.text = 'selection: ' + nodes.length.toString();
        this.statusEntry.arguments = [];
      } else {
        const node = nodes[0];
        this.statusEntry.arguments = [node.id];
        if (PebbleNode.isConnection(node)) {
          this.statusEntry.text = `$(toggle-on) "${node.connectionNode.name}" by "${node.connectionNode.connection.username}" to ${node.connectionNode.connection.server}`;
        } else if (PebbleNode.isCollection(node)) {
          this.statusEntry.text = `$(folder) ${node.name} (${this.getGroupOwner(node.collection)})`;
        } else if (PebbleNode.isDocument(node)) {
          this.statusEntry.text = `$(file${node.document.binaryDoc ? '' : '-code'}-o) ${node.name} (${this.getGroupOwner(node.document)})`;
        }
      }
    } else {
      this.statusEntry.active = false;
    }
    if (this.statusEntry.active) {
      this.statusBar.setElement(STATUSBAR_ELEMENT, this.statusEntry);
    } else {
      this.statusBar.removeElement(STATUSBAR_ELEMENT);
    }
  }

  // clipboard
  public canMoveTo(source: PebbleItemNode[], collectionUri: string): boolean {
    return !source.map(node => node.uri)
      .find(source => collectionUri.indexOf(source) >= 0 || collectionUri === source.substr(0, source.lastIndexOf('/')));
  }

  protected setClipboard(nodes: PebbleItemNode[], copy?: boolean) {
    this.clipboard.source = nodes;
    this.clipboard.copy = copy;
  }

  public canPaste(): boolean {
    return !!this.clipboard.source &&
      this.clipboard.source.length > 0 &&
      this.canMoveTo(this.clipboard.source, this.node ? this.node.uri : '/');
  }

  // info

  // functionalities
  
  protected getConnectionIcon(node: PebbleConnectionNode): string {
    return 'toggle-' + (node.loaded ? 'on' : 'off');
  }
  
  protected getCollectionIcon(node: PebbleCollectionNode): string {
    return 'folder' + (node.expanded ? '-open' : '') + (node.loaded ? '' : '-o');
  }

  protected getDocumentIcon(node: PebbleDocumentNode): string {
    return 'file' + (node.loaded ? '' : '-o');
  }

  public getIcon(node: PebbleNode): string {
    const loading = 'spin fa-spinner';
    if (PebbleNode.isConnection(node)) {
      return 'fa fa-fw fa-' + (node.loading ? loading : this.getConnectionIcon(node));
    }
    if (PebbleNode.isCollection(node)) {
      return 'fa fa-fw fa-' + (node.loading ? loading : this.getCollectionIcon(node));
    }
    if (PebbleNode.isDocument(node)) {
      return 'fa fa-fw fa-' + (node.loading ? loading : this.getDocumentIcon(node));
    }
    if (PebbleNode.isGroup(node) || PebbleNode.isGroups(node)) {
      return 'fa fa-fw fa-' + (node.loading ? loading : 'users');
    }
    if (PebbleNode.isUser(node) || PebbleNode.isUsers(node)) {
      return 'fa fa-fw fa-' + (node.loading ? loading : 'user');
    }
    if (PebbleNode.isSecurity(node)) {
      return 'fa fa-fw fa-' + (node.loading ? loading : 'lock');
    }
    if (PebbleNode.isIndexes(node) || PebbleNode.isIndex(node)) {
      return 'fa fa-fw fa-' + (node.loading ? loading : 'list-ul');
    }
    if (PebbleNode.isRest(node)) {
      return 'fa fa-fw fa-server';
    }
    if (PebbleNode.isRestURI(node)) {
      return 'fa fa-fw fa-link';
    }
    if (PebbleNode.isRestMethod(node)) {
      let icon: string;
      switch(node.name) {
        case 'GET': icon = 'upload'; break;
        case 'PUT': icon = 'download'; break;
        case 'POST': icon = 'paper-plane'; break;
        case 'DELETE': icon = 'trash'; break;
        default: icon = 'link'; break;
      }
      return 'fa fa-fw fa-' + icon;
    }
    return '';
  }

  protected getGroupOwner(item: PebbleItem): string {
    let result = '';
    if (item.group) {
      result = item.group;
    }
    if (item.owner) {
      result += (result ? ':' : '') + item.owner;
    }
    return (item.owner || '(n/a)') + ':' + (item.group || '(n/a)');
  }

  public execute(action: string) {
    this.commands.executeCommand(actionID(action));
  }

  public topNodes(nodes: PebbleItemNode[]): PebbleItemNode[] {
    return nodes.filter(node => PebbleNode.isItem(node))
      .filter(node => {
      let parent = node.parent
      while (parent && PebbleNode.isCollection(parent)) {
        if (this.selection.indexOf(parent as any) > -1) {
          return false;
        }
        parent = parent.parent;
      }
      return true;
    });
  }

  public topNodesSp(nodes: PebbleItemNode[]): PebbleItemNode[] {
    return nodes.filter(node => PebbleNode.is(node))
      .filter(node => {
      let parent = node.parent
      while (parent && PebbleNode.isContainer(parent)) {
        if (this.selection.indexOf(parent as any) > -1) {
          return false;
        }
        parent = parent.parent;
      }
      return true;
    });
  }

  protected fileExists(name: string, node?: PebbleCollectionNode): boolean {
    node = (node && PebbleNode.isCollection(node)) ? node : ((this.node && PebbleNode.isCollection(this.node)) ? this.node : undefined);
    if (node) {
      return !!node.children.find(file => file.name === name);
    }
    return false;
  }
  
  protected getName(id: string): string {
    return id.split('/').pop() || id;
  }
  
  public generateID(connection: PebbleConnection, text: string, prefix?: string): string {
    return this.connectionID(connection) + (prefix ? prefix + '/' : '') + text;
  }
  
  public connectionID(connection: PebbleConnection): string {
    return (connection.username ? connection.username : '(guest)') + '@' + connection.server;
  }

  public itemID(connection: PebbleConnection, item: PebbleItem): string {
    return this.connectionID(connection) + item.name;
  }
  
  public securityID(connection: PebbleConnection, prefix?: string, text?: string): string {
    return this.connectionID(connection) + 'security' + (prefix ? prefix + '/' + (text ? '/' + text : ''): '');
  }

  public userID(connection: PebbleConnection, user: string = ''): string {
    return this.securityID(connection, 'user', user);
  }

  public groupID(connection: PebbleConnection, group: string = ''): string {
    return this.securityID(connection, 'group', group);
  }

  protected indexID(connection: PebbleConnection, uri: string = ''): string {
    return this.connectionID(connection) + '/index' + uri;
  }
  
  protected restID(connection: PebbleConnection, prefix?: string, text?: string): string {
    return this.connectionID(connection) + 'rest' + (prefix ? prefix + '/' + (text ? '/' + text : ''): '');
  }

  protected parentCollection(uri: string): string {
    const parent = uri.split(TRAILING_SYMBOL);
    parent.pop();
    return parent.join(TRAILING_SYMBOL);
  }
  
  protected async changeOwner(node: PebbleItemNode, owner: string, group: string): Promise<boolean> {
    const isCollection = PebbleNode.isCollection(node);
    return await PebbleApi.chmod(node.connectionNode.connection, node.uri, owner, group, isCollection);
  }
  
  protected async rename(node: PebbleItemNode, name: string): Promise<boolean> {
    if (PebbleNode.isCollection(node.parent)) {
      const parent = node.parent;
      const nodes = await this.move({
        copy: false,
        destination: [this.collectionDir(parent.uri, name)],
        destinationContainer: node.parent,
        source: [node],
        event: undefined as any,
      });
      if (nodes.length === 1) {
        this.select(nodes[0]);
        return true;
      } else {
        return false;
      }
    } else {
      throw createError(PebbleError.unknown);
    }
  }

  public async openDocumentByURI(uri: string, connection: PebbleConnection): Promise<any> {
    const uriObj = new URI(PEBBLE_RESOURCE_SCHEME + ':' + this.connectionID(connection) + uri);
    const evalWidget = await this.widgetManager.getWidget(PEBBLE_EVAL_WIDGET_FACTORY_ID);
    if (!evalWidget) {
      const ext = uri.substr(uri.lastIndexOf('.') + 1);
      if (XQ_EXT.indexOf(ext) >= 0) {
        this.commands.executeCommand('PebbleEval:toggle');
      }
    }
    const result = await open(this.openerService, uriObj, {
      node: 123,
    });
    return result;
  }

  public async openDocument(node: PebbleDocumentNode): Promise<any> {
    if (this.startLoading(node)) {
      const result = await this.openDocumentByURI(node.uri, node.connectionNode.connection);
      this.endLoading(node);
      node.loaded = true;
      return result;
    }
  }

  protected async createDocument(collection: PebbleCollectionNode, name: string, content = '', group = '', owner = '') {
    const doc = await this.openDocument(this.addDocument(collection, {
      content,
      name,
      created: new Date(),
      lastModified: new Date(),
      binaryDoc: false,
      acl: [],
      size: content.length,
      mediaType: lookup(name) || 'text/plain',
      group: group || 'dba',
      owner: owner || collection.connectionNode.connection.username,
    }, true));
    if (content !== '') {
      doc.editor.document.setDirty(true);
      doc.editor.document.contentChanges.push({
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 }
        },
        rangeLength: 0,
        content,
      });
    }
    return doc;
  }

  protected blob(text: string, type: string): Blob {
    return new Blob([new Uint8Array(text.split('').map(c => c.charCodeAt(0)))], { type });
  }

  protected collectionDir(collection: string, document: string): string {
    if ((collection[collection.length - 1] != TRAILING_SYMBOL) &&
        (document[0] != TRAILING_SYMBOL)) {
          collection += TRAILING_SYMBOL;
        }
    return collection + document;
  }

  protected clean(array: string[], topDir: string = '') {
    if (topDir !== '') {
      return array.map(i => i.substr(topDir.length));
    }
    const testArray: (string | undefined)[][] = array.map(i => i.split(TRAILING_SYMBOL));
    if (array.length > 0) {
      if (array.length === 1) {
        testArray[0] = [testArray[0].pop()];
      } else {
        while (testArray[0].length > 1) {
          const test = testArray[0][0];
          let check = true;
          testArray.forEach(i => check = check && i[0] === test);
          if (check) {
            testArray.forEach(i => i.shift());
          }
        }
      }
    }
    return testArray.map(i => i.join(TRAILING_SYMBOL));
  }

  protected cleanItems(array: PebbleDocument[], topDir: string): PebbleItem[] {
    let result = array.map(doc => {
      let pos = doc.name.indexOf(TRAILING_SYMBOL, topDir.length + 1);
      return {
        ...doc,
        name: pos > 0 ? doc.name.substr(0, pos) : doc.name,
      }
    });
    result = result.filter(item => {
      if (PebbleItem.isCollection(item)) {
        return true;
      }
      const copy: PebbleCollection | undefined = result.find(found => found.name === (item as any).name && found != item) as any;
      if (copy) {
        copy.collections = [];
        copy.documents = [];
        return false;
      }
      return true;
    });
    return result;
  }

  protected getTopDir(array: string[]): string {
    let result = '';
    const testArray: (string | undefined)[][] = array.map(i => i.split(TRAILING_SYMBOL));
    if (array.length > 0) {
      if (array.length === 1) {
        testArray[0].pop();
        result = testArray[0].join(TRAILING_SYMBOL) + TRAILING_SYMBOL;
      } else {
        while (testArray.map(i => i.length).reduce((a, b) => Math.min(a, b), 2) > 1) {
          const test = testArray[0][0];
          let check = true;
          testArray.forEach(i => check = check && i[0] === test);
          if (check) {
            testArray.forEach(i => i.shift());
            result += test + TRAILING_SYMBOL;
          }
        }
      }
    }
    return result;
  }

  protected cleanObject(object: PebbleFileList, topDir: string = ''): PebbleFileList {
    const keys = Object.keys(object);
    const array = this.clean(keys, topDir);
    keys.forEach((key, index) => {
      object[array[index]] = object[key];
      delete(object[key]);
    });
    return object;
  }

  protected nextName(check?: string) {
    if (check && check != this.lastName()) {
      return;
    }
    this.lastNameID++;
  }

  protected lastName(ext?: string): string {
    return 'untitled-' + this.lastNameID.toString() + (ext ? '.' + ext : '');
  }

  protected newName(validator?: (input: string) => boolean, ext?: string): string {
    if (validator) {
      while (!validator(this.lastName(ext))) {
        this.nextName();
      }
    }
    return this.lastName(ext);
  }

  public async move(operation: PebbleDragOperation): Promise<PebbleItemNode[]> {
    if (operation.source.length) {
      let result = (await asyncForEach(operation.source, async (source: PebbleItemNode, i) => {
        const isCollection = PebbleNode.isCollection(source);
        const result = await PebbleApi.move(
          source.connectionNode.connection,
          source.uri,
          operation.destination[i],
          isCollection,
          operation.copy
        );
        if (result) {
          let resultNode: PebbleItemNode;
          if (isCollection) {
            resultNode = await this.addCollection(operation.destinationContainer, {
              ...(source as PebbleCollectionNode).collection,
              name: operation.destination[i],
            });
          } else {
            resultNode = this.addDocument(operation.destinationContainer, {
              ...(source as PebbleDocumentNode).document,
              name: operation.destination[i],
            });
          }
          if (!operation.copy) {
            this.removeNode(source);
          }
          return resultNode as PebbleItemNode;
        }
      })).filter(node => !!node) as PebbleItemNode[];
      return result;
    } else {
      return [];
    }
  }

  // commands
  
  public async newConnection(): Promise<void> {
    if (!this._model) {
      return;
    }
    const dialog = new PebbleConnectionDialog({
      title: 'New Connection',
      name: 'localhost',
      server: 'http://localhost:8080',
      username: 'admin',
      password: '',
    });
    const result = await dialog.open();
    if (result) {
      this.addConnection(result.connection, this._model.root as CompositeTreeNode, result.autoConnect);  
    }
  }

  public async deleteConnection(): Promise<void> {
    if (!this.isSelected || !this._model) {
      return;
    }
    if (this.node && PebbleNode.isConnection(this.node)) {
      const node = this.node as PebbleConnectionNode;
      const msg = document.createElement('p');
      msg.innerHTML = 'Are you sure you want to remove the connection: <strong>' + node.connectionNode.name + '</strong>?<br/>' +
      'Server URI: <strong>' + node.connectionNode.connection.server + '</strong><br/>' +
      'Username: <strong>' + node.connectionNode.connection.username + '</strong>';
      const dialog = new ConfirmDialog({
        title: 'Remove Connection',
        msg,
        cancel: 'Keep',
        ok: 'Delete'
      });
      const result = await dialog.open();
      if (result) {
        this.connectionDeleted(node);
        this.removeNode(node);
        // this._model.refresh();
      } else {
        this._model.selectNode(node);
      }
    }
  }

  public async newItem(isCollection?: boolean): Promise<boolean> {
    if (!this.node) {
      return false;
    }
    const collection = this.node as PebbleCollectionNode;
    const validator = (input: string) => input !== '' && !this.fileExists(input);
    const dialog = new SingleTextInputDialog({
      initialValue: this.newName(validator),
      title: 'New ' + (isCollection ? 'collection' : 'document'),
      confirmButtonLabel: 'Create',
      validate: validator,
    });
    let name = await dialog.open();
    if (name) {
      this.nextName(name);
      name = collection.uri + '/' + name;
      if (isCollection) {
        const result = await PebbleApi.newCollection(collection.connectionNode.connection, name);
        if (result) {
          this.addCollection(collection, result);
        }
      } else {
        this.createDocument(collection, name);
      }
    }
    return false;
  }

  public async uploadItem(): Promise<boolean> {
    const props: OpenFileDialogProps = {
      title: 'Upload file',
      canSelectFolders: true,
      canSelectFiles: true,
      canSelectMany: true,
    };
    const [rootStat] = await this.workspace.roots;
    const file: URI | URI[] = await this.fileDialog.showOpenDialog(props, rootStat) as any;
    const selectedFiles = (isArray(file) ? file : [file]).map(f => f.path.toString());
    const top = this.getTopDir(selectedFiles);
    const files = await this.files.getFiles({ file: selectedFiles });
    const collectionNode = this.node as PebbleCollectionNode;
    const filenameList: any = await this.files.readMulti({ files });
    const formData = new FormData();
    this.cleanObject(filenameList, top);
    let counter = 1;
    for (let i in filenameList) {
      formData.append('file-upload-' + counter++, this.blob(filenameList[i], lookup(i) || 'application/octet-stream'), i);
    }
    this.saveDocuments(collectionNode, formData);
    return true;
  }

  public async newItemFromResult(collection?: PebbleCollectionNode): Promise<boolean> {
    if (!this.result) {
      return false;
    }
    if (!PebbleNode.isCollection(collection)) {
      if (PebbleNode.isCollection(this.node)) {
        collection = this.node;
      } else if (PebbleNode.isDocument(this.node)) {
        collection = this.node.parent as PebbleCollectionNode;
      }
    }
    if (PebbleNode.isCollection(collection)) {
      const validator = (input: string) => input !== '' && !this.fileExists(input);
      const dialog = new SingleTextInputDialog({
        initialValue: this.newName(validator),
        title: 'New document',
        confirmButtonLabel: 'Create',
        validate: validator,
      });
      let name = await dialog.open();
      if (name) {
        await this.createDocument(collection, name, this.result);
        return true;
      }
    }
    return false;
  }

  public async newItemFromTemplate(template: PebbleTemplate): Promise<boolean> {
    if (!this.node) {
      return false;
    }
    const collection = this.node as PebbleCollectionNode;
    const validator = (filename: string) => filename !== '' && !this.fileExists(filename);
    const dialog = new NewFromTemplateDialog({
      title: 'New ' + template.name,
      initialValue: this.newName(validator, template.ext({})),
      template,
      validate: validator,
    });
    let result = await dialog.open();
    if (result) {
      this.nextName(result.params.name);
      const name = collection.uri + '/' + result.params.name;
      const text = template.execute(result.params);
      await this.createDocument(collection, name, text);
    }
    return false;
  }

  public async renameItem(): Promise<void> {
    if (PebbleNode.isItem(this.node)) {      
      const isCollection = PebbleNode.isCollection(this.node);
      const collection = this.node.parent as PebbleCollectionNode;
      const validator = (input: string) => input === (this.node && this.node.name) || input !== '' && !this.fileExists(input, collection);
      const dialog = new SingleTextInputDialog({
        initialValue: this.node.name,
        title: 'Rename ' + (isCollection ? 'collection' : 'document'),
        confirmButtonLabel: 'Rename',
        validate: validator,
      });
      let name = await dialog.open();
      if (name && name != this.node.name) {
        this.rename(this.node, name);
      }
    }
  }

  public cut() {
    this.setClipboard(this.topNodes(this.selection));
  }

  public copy() {
    this.setClipboard(this.topNodes(this.selection), true);
  }

  public paste() {
    if (PebbleNode.isCollection(this.node) && this.clipboard.source) {
      const collection = this.node;
      const destination = this.clipboard.source.map(item => this.collectionDir(collection.uri, item.uri.split('/').pop() || ''));
      this.move({
        copy: !!this.clipboard.copy,
        destinationContainer: collection,
        event: undefined as any,
        source: this.clipboard.source,
        destination
      })
    }
  }

  public async refresh(node?: PebbleCollectionNode) {
    if (this._model) {
      if (PebbleNode.isCollection(node)) {
        this._model.collapseNode(node);
        node.loaded = false;
        this.empty(node);
        this.expand(node);
        return;
      } else {
        this._model.refresh(node);
      }
    }
  }
  
  public async deleteItem(): Promise<void> {
    const deleteNode = async function (core: PebbleCore, node: PebbleItemNode) {
      try {
        const done = await PebbleApi.remove(node.connectionNode.connection, node.uri, PebbleNode.isCollection(node));
        if (done) {
          if (PebbleNode.isDocument(node) && node.editor) {
            node.editor.closeWithoutSaving();
            // TODO: keep the file in the editor as a new one
            // node.editor.saveable.setDirty(true);
          }
          core.removeNode(node);
        }
      } catch (error) {
        console.error('caught:', error);
        core.endLoading(node);
      }
    };
    if (!this.isSelected || !this._model) {
      return;
    }
    const collections: any[] = [];
    const documents: any[] = [];
    let nodes = this.topNodes(this.selection);
    nodes.forEach(node => (PebbleNode.isCollection(node) ? collections : documents).push(node));
    if (nodes.length > 0) {
      const isCollection = PebbleNode.isCollection(this.node);
      const node = this.node as PebbleDocumentNode;
      const msg = document.createElement('p');
      if (nodes.length === 1) {
        msg.innerHTML = 'Are you sure you want to delete the ' + (isCollection ? 'collection' : 'document') + ': <strong>' + node.name + '</strong>?';
      } else {
        msg.innerHTML = '<p>Are you sure you want to delete the following items?</p>';
        if (collections.length > 0) {
          msg.innerHTML += '<strong>Collection:</strong><ul>' + collections.map(node => '<li>' + node.name + '</li>').join('') + '</ul>';
        }
        if (documents.length > 0) {
          msg.innerHTML += '<strong>Document:</strong><ul>' + documents.map(node => '<li>' + node.name + '</li>').join('') + '</ul>';
        }
      }
      const dialog = new ConfirmDialog({
        title: 'Delete ' + (isCollection ? 'collection' : 'document'),
        msg,
        cancel: 'Keep',
        ok: 'Delete'
      });
      const result = await dialog.open();
      if (result) {
        nodes.forEach(node => deleteNode(this, node));
      } else {
        this._model.selectNode(node);
        this.endLoading(node);
      }
    }
  }

  public openMethodFunctionDocument(nodeId = '') {
    const node = !nodeId || (this.node && this.node.id !== nodeId) ? this.node : this.getNode(nodeId);
    if (PebbleNode.isRestMethod(node)) {
      this.openDocumentByURI(node.restMethod.function.src, node.connectionNode.connection);
    }
  }

  public showPropertiesDialog(nodeId = '') {
    const node = !nodeId || (this.node && this.node.id !== nodeId) ? this.node : this.getNode(nodeId);
    if (node) {
      if (PebbleNode.isConnection(node)) {
        const dialog = new PebbleConnectionDialog({
          title: 'Edit Connection',
          acceptButton: 'Save',
          ...node.connectionNode.connection,
        });
        dialog.open().then(result => {
          if (result) {
            this.empty(node);
            node.expanded = false;
            node.loading = false;
            node.loaded = false;
            (node as any).id = this.connectionID(result.connection);
            (node as any).name = result.connection.name;
            node.connectionNode.connection = result.connection;
            node.selected = false;
            node.uri = result.connection.server;
            this.connect(node);
          }
        });
      } else if (PebbleNode.isItem(node)) {
        const parent = node.parent as PebbleCollectionNode;
        const dialog = new PebblePropertiesDialog({
          title: 'Properties',
          node: this.node,
          validate: filename => filename !== '' && !this.fileExists(filename, parent)
        });
        dialog.open().then(async result => {
          if (result) {
            const item = PebbleNode.isCollection(node) ? node.collection as PebbleCollection : (node as PebbleDocumentNode).document as PebbleDocument;
            if (result.name !== node.name) {
              await this.rename(node, result.name);
            }
            if ((result.owner !== item.owner) || (result.group !== item.group)) {
              await this.changeOwner(node, result.owner, result.group);
            }
          }
        });
      }
    }
  }

  public canDeleteUser(): boolean {
    return PebbleNode.isUser(this.node) && this.node.name != 'admin' && this.node.name != 'guest';
  }

  public async deleteUser() {
    if (PebbleNode.isUser(this.node) && this._model) {
      const dialog = new ConfirmDialog({
        title: 'Delete user',
        msg: 'Are you sure you want to delete the user "' + this.node.name + '"?',
        cancel: 'Keep',
        ok: 'Delete'
      });
      const result = await dialog.open();
      if (result) {
        if (await PebbleApi.removeUser(this.node.connectionNode.connection, this.node.name)) {
          this.removeNode(this.node);
        }
      }
    }
  }

  public async editUser() {
    if (PebbleNode.isUser(this.node)) {
      const connectionNode = this.node.connectionNode;
      const user = await PebbleApi.getUser(connectionNode.connection, this.node.name);
      const dialog = new PebbleUserDialog({
        title: 'Edit User: ' + this.node.name,
        acceptButton: 'Save changes',
        connection: connectionNode.connection,
        user,
      });
      let userData = await dialog.open();
      if (userData) {
        if (await PebbleApi.addUser(connectionNode.connection, userData)) {
          this.node.connectionNode.connection.users.push(user.userName);
          this.addUserNode(connectionNode.security.users, user.userName);
        }
      }
    }
  }

  public async addUser() {
    if (PebbleNode.is(this.node)) {
      const connectionNode = this.node.connectionNode;
      const dialog = new PebbleUserDialog({
        title: 'Add User',
        connection: connectionNode.connection
      });
      let user = await dialog.open();
      if (user) {
        if (await PebbleApi.addUser(connectionNode.connection, user)) {
          this.node.connectionNode.connection.users.push(user.userName);
          this.addUserNode(connectionNode.security.users, user.userName);
        }
      }
    }
  }

  public canDeleteGroup(): boolean {
    return PebbleNode.isGroup(this.node) && this.node.name != 'dba' && this.node.name != 'guest';
  }

  public async deleteGroup() {
    if (PebbleNode.isGroup(this.node) && this._model) {
      const dialog = new ConfirmDialog({
        title: 'Delete group',
        msg: 'Are you sure you want to delete the group "' + this.node.name + '"?',
        cancel: 'Keep',
        ok: 'Delete'
      });
      const result = await dialog.open();
      if (result) {
        if (await PebbleApi.removeGroup(this.node.connectionNode.connection, this.node.name)) {
          this.removeNode(this.node);
        }
      }
    }
  }

  public async editGroup() {
    if (PebbleNode.isGroup(this.node)) {
      const connectionNode = this.node.connectionNode;
      const group = await PebbleApi.getGroup(connectionNode.connection, this.node.name);
      const dialog = new PebbleGroupDialog({
        title: 'Edit User: ' + this.node.name,
        acceptButton: 'Save changes',
        connection: connectionNode.connection,
        group,
      });
      let groupData = await dialog.open();
      if (groupData) {
        if (await PebbleApi.addGroup(connectionNode.connection, groupData)) {
          this.node.connectionNode.connection.groups.push(group.groupName);
          this.addGroupNode(connectionNode.security.groups, group.groupName);
        }
      }
    }
  }

  public async addGroup() {
    if (PebbleNode.is(this.node)) {
      const connectionNode = this.node.connectionNode;
      const dialog = new PebbleGroupDialog({
        title: 'Add Group',
        connection: connectionNode.connection
      });
      let group = await dialog.open();
      if (group) {
        console.log(group);
        if (await PebbleApi.addGroup(connectionNode.connection, group)) {
          this.node.connectionNode.connection.groups.push(group.groupName);
          this.addGroupNode(connectionNode.security.groups, group.groupName);
        }
      }
    }
  }
}