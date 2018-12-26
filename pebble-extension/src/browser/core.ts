import { injectable, inject } from "inversify";
import { PebbleNode, PebbleDocumentNode, PebbleCollectionNode, PebbleToolbarNode, PebbleConnectionNode, PebbleItemNode } from "../classes/node";
import { open, TreeModel, TreeNode, CompositeTreeNode, ConfirmDialog, SingleTextInputDialog, OpenerService } from "@theia/core/lib/browser";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { OpenFileDialogProps, FileDialogService } from "@theia/filesystem/lib/browser";
import { PebbleDocument, PebbleCollection, PebbleItem } from "../classes/item";
import { PebbleConnection } from "../classes/connection";
import { CommandRegistry } from "@theia/core";
import { actionID } from "../classes/action";
import { PebbleApi } from "../common/api";
import URI from "@theia/core/lib/common/uri";
import { PebbleDragOperation } from "./widget/drag";
import { PebbleTemplate } from "../classes/template";
import { NewConnectionDialog, NewFromTemplateDialog } from "./dialogs";
import { PebbleFiles } from "../common/files";

export const PEBBLE_RESOURCE_SCHEME = 'pebble';
@injectable()
export class PebbleCore {
  @inject(CommandRegistry) protected readonly commands?: CommandRegistry;
  @inject(WorkspaceService) protected readonly workspace?: WorkspaceService;
  @inject(FileDialogService) protected readonly fileDialog?: FileDialogService;
  @inject(PebbleFiles) protected readonly files?: PebbleFiles;
  constructor(
    @inject(OpenerService) private readonly openerService: OpenerService,
  ) {
    console.log('got:', this.files);
  }
  
  public get selected(): boolean {
    return !!this._model && this._model.selectedNodes.length > 0;
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
  
  private _model?: TreeModel;
  public set model(model: TreeModel | undefined) {
    if (this._model != model) {
      this._model = model;
      this.createRoot();
    }
  }
  public get model(): TreeModel | undefined {
    return this._model;
  }

  // new
  async expanded(node: CompositeTreeNode) {
    if (PebbleNode.isConnection(node) && !node.loaded) {
      this.connect(node, node.connection);
    } else if (PebbleNode.isCollection(node) && !node.loaded) {
      this.load(node, node.connection, node.uri);
    }
  }
  expand(node: CompositeTreeNode) {
    this._model && this._model.expandNode(node as any);
  }
  
  async select(node: PebbleItemNode | PebbleConnectionNode) {
    if (!PebbleNode.isToolbar(node)) {
      this._model && this._model.selectNode(node);
    }
  }

  async connect(node: CompositeTreeNode, connection: PebbleConnection) {
    if (this.startLoading(node)) {
      try {
        const result = await PebbleApi.connect(connection);
        (node as PebbleConnectionNode).loaded = true;
        const collection = result as PebbleCollection;
        collection.collections.forEach(subCollection => this.addCollection(node, connection, subCollection));
        collection.documents.forEach(document => this.addDocument(node, connection, document));
      } catch (error) {
        (node as PebbleConnectionNode).expanded = false;
        console.error('caught:', error);
      }
      this.endLoading(node);
    }
  }
  
  async load(node: CompositeTreeNode, connection: PebbleConnection, uri: string) {
    if (this.startLoading(node)) {
      try {
        const result = await PebbleApi.load(connection, uri);
        if (PebbleItem.isCollection(result)) {
          (node as PebbleCollectionNode).loaded = true;
          const collection = result as PebbleCollection;
          collection.collections.forEach(subCollection => this.addCollection(node, connection, subCollection));
          collection.documents.forEach(document => this.addDocument(node, connection, document));
          (node as PebbleCollectionNode).collection = collection;
        }
      } catch (error) {
        (node as PebbleCollectionNode).expanded = false;
        console.error('caught:', error);
      }
      this.endLoading(node);
    }
  }

  async save(document: PebbleDocumentNode, content: string) {
    try {
      const result = await PebbleApi.save(document.connection, document.uri, content);
      if (result) {
        document.isNew = false;
        this.refresh();
      }
    } catch (error) {
      console.error('caught:', error);
    }
  }

  async refresh(node?: PebbleCollectionNode) {
    if (this._model) {
      if (node) {
        const collection = node as PebbleCollectionNode;
        this._model.collapseNode(node);
        collection.loaded = false;
        this.empty(collection);
        this.expand(node);
        return;
      } else {
        this._model.refresh();
      }
    }
  }

  empty(node: CompositeTreeNode) {
    let child: PebbleNode;
    while (child = CompositeTreeNode.getFirstChild(node) as PebbleNode) {
      this.removeNode(child, node);
    }
    this.refresh();
  }

  isConnection(): boolean {
    return !!this._model && this._model.selectedNodes.length > 0 && PebbleNode.isConnection(this._model.selectedNodes[0]);
  }
  isCollection(): boolean {
    return !!this._model && this._model.selectedNodes.length > 0 && PebbleNode.isCollection(this._model.selectedNodes[0]);
  }
  isDocument(): boolean {
    return !!this._model && this._model.selectedNodes.length > 0 && PebbleNode.isDocument(this._model.selectedNodes[0]);
  }

  fileExists(name: string, node?: PebbleCollectionNode): boolean {
    node = (node && PebbleNode.isCollection(node)) ? node : ((this.node && PebbleNode.isCollection(this.node)) ? this.node : undefined);
    if (node) {
      return !!node.children.find(file => file.name === name);
    }
    return false;
  }

  execute(action: string) {
    this.commands && this.commands.executeCommand(actionID(action));
  }
  
  protected getName(id: string): string {
    return id.split('/').pop() || id;
  }

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
      return 'fa fa-' + (node.loading ? loading : this.getConnectionIcon(node));
    }
    if (PebbleNode.isCollection(node)) {
      return 'fa fa-' + (node.loading ? loading : this.getCollectionIcon(node));
    }
    if (PebbleNode.isDocument(node)) {
      return 'fa fa-' + (node.loading ? loading : this.getDocumentIcon(node));
    }
    return '';
  }
  
  public connectionID(connection: PebbleConnection): string {
    return (connection.username ? connection.username : '(guest)') + '@' + connection.server;
  }
  public itemID(connection: PebbleConnection, item: PebbleItem): string {
    return this.connectionID(connection) + item.name;
  }

  public getNode(id: string): PebbleNode | undefined {
    return this._model ? this._model.getNode(id) as PebbleNode : undefined;
  }

  // from widget
  
  public createRoot() {
    // const nodes = this.reconcileTreeState(roots);
    if (this._model) {
      this._model.root = {
        id: 'pebble-connections-view-root',
        name: 'Pebble Connections Root',
        visible: false,
        children: [],
        parent: undefined
      } as CompositeTreeNode;
      this.addToolbar(this._model.root as CompositeTreeNode);
    }
  }
  
  public addNode(child: PebbleNode, parent?: TreeNode): PebbleNode {
    CompositeTreeNode.addChild(parent as CompositeTreeNode, child);
    this._model && this._model.refresh();
    return child;
  }
  public removeNode(child: PebbleNode, parent?: TreeNode): void {
    CompositeTreeNode.removeChild(parent as CompositeTreeNode, child);
  }
  public addDocument(parent: TreeNode, connection: PebbleConnection, document: PebbleDocument, isNew: boolean = false): PebbleDocumentNode {
    const node = {
      type: 'item',
      connection,
      isCollection: false,
      id: this.itemID(connection, document),
      name: this.getName(document.name),
      parent: parent,
      isNew,
      selected: false,
      uri: document.name,
      document,
    } as PebbleDocumentNode;
    this.addNode(node, parent);
    return node;
  }
  public addCollection(parent: TreeNode, connection: PebbleConnection, collection: PebbleCollection): void {
    this.addNode({
      type: 'item',
      connection,
      isCollection: true,
      children: [],
      id: this.itemID(connection, collection),
      link: PEBBLE_RESOURCE_SCHEME + ':' + collection.name,
      name: this.getName(collection.name),
      parent: parent as CompositeTreeNode,
      selected: false,
      expanded: false,
      collection,
      uri: collection.name,
    } as PebbleCollectionNode, parent);
  }
  public addConnection(connection: PebbleConnection, parent?: TreeNode, expanded?: boolean): void {
    this.addNode({
      type: 'connection',
      children: [],
      expanded,
      id: this.connectionID(connection),
      name: connection.name,
      connection: connection,
      parent: parent as any,
      selected: false,
      uri: connection.server
    } as PebbleConnectionNode, parent);
  }
  public addToolbar(parent: CompositeTreeNode): void {
    this.addNode({
      type: 'toolbar',
      id: 'pebble-toolbar',
      uri: 'toolbar',
      name: 'Pebble Toolbar',
      parent: parent,
      selected: false,
    } as PebbleToolbarNode, parent);
  }
  public startLoading(node: TreeNode): boolean {
    if (PebbleNode.is(node)) {
      if (node.loading) {
        return false;
      }
      node.loading = true;
      this.refresh();
      return true;
    }
    return false;
  }
  public endLoading(node: TreeNode): void {
    if (PebbleNode.is(node)) {
      node.loading = false;
      this.refresh();
    }
  }

  // functionalities
  
  public async deleteConnection(): Promise<void> {
    if (!this.selected || !this._model) {
      return;
    }
    if (this.node && PebbleNode.isConnection(this.node)) {
      const node = this.node as PebbleConnectionNode;
      const msg = document.createElement('p');
      msg.innerHTML = 'Are you sure you want to remove the connection: <strong>' + node.connection.name + '</strong>?<br/>' +
      'Server: <strong>' + node.connection.server + '</strong><br/>' +
      'Username: <strong>' + node.connection.username + '</strong>';
      const dialog = new ConfirmDialog({
        title: 'Delete connection',
        msg,
        cancel: 'Keep',
        ok: 'Delete'
      });
      const result = await dialog.open();
      if (result) {
        this.removeNode(node, this._model.root as CompositeTreeNode);
        this._model.refresh();
      } else {
        this._model.selectNode(node);
      }
    }
  }
  
  public async deleteItem(): Promise<void> {
    const deleteNode = async function (core: PebbleCore, node: PebbleItemNode) {
      try {
        const done = await PebbleApi.remove(node.connection, node.uri, PebbleNode.isCollection(node));
        if (done) {
          if (PebbleNode.isDocument(node) && node.editor) {
            node.editor.closeWithoutSaving();
            // TODO: keep the file in the editor as a new one
            // node.editor.saveable.setDirty(true);
          }
          core.removeNode(node, node.parent as CompositeTreeNode);
          core.refresh();
        }
      } catch (error) {
        console.error('caught:', error);
        core.endLoading(node);
      }
    };
    if (!this.selected || !this._model) {
      return;
    }
    const collections: any[] = [];
    const documents: any[] = [];
    let nodes = this.selection
      .filter(node => this.node && node.parent === this.node.parent && (PebbleNode.isDocument(node) || PebbleNode.isCollection(node)));
    nodes.forEach(node => (PebbleNode.isCollection(node) ? collections : documents).push(node));
    if (nodes.length > 0) {
      if (nodes.length === (nodes[0].parent ? nodes[0].parent.children.length : 0)) {
        nodes = [nodes[0].parent as any];
      }
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
        if (nodes.length > 0) {
          msg.innerHTML += '<strong>Document:</strong><ul>' + nodes.map(node => '<li>' + node.name + '</li>').join('') + '</ul>';
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
  
  public async newConnection(): Promise<void> {
    if (!this._model) {
      return;
    }
    const dialog = new NewConnectionDialog({
      title: 'New connection',
      name: 'Localhost',
      server: 'http://localhost:8080',
      username: 'admin',
      password: '',
    });
    const result = await dialog.open();
    if (result) {
      this.addConnection(result.connection, this._model.root, result.autoConnect);  
    }
  }

  public async openDocument(node: PebbleDocumentNode): Promise<any> {
    const result = await open(this.openerService, new URI(PEBBLE_RESOURCE_SCHEME + ':' + node.id));
    node.loaded = true;
    return result;
  }

  public async newItemFromTemplate(template: PebbleTemplate): Promise<boolean> {
    if (!this.node) {
      return false;
    }
    const collection = this.node as PebbleCollectionNode;
    const dialog = new NewFromTemplateDialog({
      title: 'New ' + template.name,
      template,
      validate: (filename) => filename !== '' && !this.fileExists(filename),
    });
    let result = await dialog.open();
    if (result) {
      const name = collection.uri + '/' + result.params.name;
      const text = template.execute(result.params);
      await this.createDocument(collection, name, text);
    }
    return false;
  }

  public async createDocument(collection: PebbleCollectionNode, name: string, content = '', group = '', owner = '') {
    const doc = await this.openDocument(this.addDocument(collection, collection.connection, { content, name, group, owner }, true));
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

  public async uploadItem(): Promise<boolean> {
    if (this.workspace && this.fileDialog) {
      const props: OpenFileDialogProps = {
        title: 'Upload file',
        canSelectFolders: true,
        canSelectFiles: true,
      };
      const [rootStat] = await this.workspace.roots;
      const file: any = await this.fileDialog.showOpenDialog(props, rootStat);
      if (file) {
        console.log('uploading file:', file.toString());
        console.log(file);
        return true;
      }
    }
    return true;
  }

  public async newItem(isCollection?: boolean): Promise<boolean> {
    if (!this.node) {
      return false;
    }
    const collection = this.node as PebbleCollectionNode;
    const dialog = new SingleTextInputDialog({
      title: 'New ' + (isCollection ? 'collection' : 'document'),
      confirmButtonLabel: 'Create',
      validate: (input) => input !== '' && !this.fileExists(input),
    });
    let name = await dialog.open();
    if (name) {
      name = collection.uri + '/' + name;
      if (isCollection) {
        const result = await PebbleApi.newCollection(collection.connection, name);
        if (result) {
          this.addCollection(collection, collection.connection, result);
        }
      } else {
        this.createDocument(collection, name);
      }
    }
    return false;
  }

  public async move(operation: PebbleDragOperation): Promise<boolean> {
    if (operation.source) {
      const isCollection = PebbleNode.isCollection(operation.source);
      const result = await PebbleApi.move(
        operation.source.connection,
        operation.source.uri,
        operation.destination,
        isCollection,
        operation.event.dataTransfer.dropEffect === 'copy'
      );
      if (result) {
        if (isCollection) {
          this.addCollection(operation.destinationContainer, operation.source.connection, {
            ...(operation.source as PebbleCollectionNode).collection,
            name: operation.destination,
          });
        } else {
          this.addDocument(operation.destinationContainer, operation.source.connection, {
            ...(operation.source as PebbleDocumentNode).document,
            name: operation.destination,
          });
        }
        this.removeNode(operation.source, operation.sourceContainer);
      }
      return result;
    } else {
      // TODO: implements uploads
      // this.model.upload(container, event.dataTransfer.items);
      return false;
    }
  }
  
}