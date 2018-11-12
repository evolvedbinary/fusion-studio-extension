import { injectable, inject } from "inversify";
import { PebbleNode, PebbleDocumentNode, PebbleCollectionNode, PebbleToolbarNode, PebbleConnectionNode } from "../classes/node";
import { TreeModel, TreeNode, CompositeTreeNode, ConfirmDialog, SingleTextInputDialog } from "@theia/core/lib/browser";
import { PEBBLE_RESOURCE_SCHEME } from "./resource";
import { PebbleDocument, PebbleCollection, PebbleItem } from "../classes/item";
import { PebbleConnection } from "../classes/connection";
import { NewConnectionDialog } from "./new-connection-dialog";
import { CommandRegistry } from "@theia/core";
import { actionID } from "../classes/action";
import { PebbleApi } from "../common/api";

@injectable()
export class PebbleCore {
  @inject(CommandRegistry) protected readonly commands?: CommandRegistry;
  
  public get selected(): boolean {
    return !!this._model && this._model.selectedNodes.length > 0;
  }
  public get node(): PebbleNode | undefined {
    if (this._model && this._model.selectedNodes.length > 0) {
      return this._model.selectedNodes[0] as any as PebbleNode;
    }
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
  refresh() {
    this._model && this._model.refresh();
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
    return 'folder' + ('file' + (node.loaded ? '' : '-o'));
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
  
  public addNode(child: PebbleNode, parent?: TreeNode): void {
    CompositeTreeNode.addChild(parent as CompositeTreeNode, child);
    this._model && this._model.refresh();
  }
  public addDocument(parent: TreeNode, connection: PebbleConnection, document: PebbleDocument, isNew: boolean = false): void {
    console.log(document);
    this.addNode({
      type: 'item',
      connection,
      collection: false,
      id: this.itemID(connection, document),
      name: this.getName(document.name),
      parent: parent,
      isNew,
      selected: false,
      uri: document.name,
    } as PebbleDocumentNode, parent);
  }
  public addCollection(parent: TreeNode, connection: PebbleConnection, collection: PebbleCollection): void {
    this.addNode({
      type: 'item',
      connection,
      collection: true,
      children: [],
      id: this.itemID(connection, collection),
      link: PEBBLE_RESOURCE_SCHEME + ':' + collection.name,
      name: this.getName(collection.name),
      parent: parent as CompositeTreeNode,
      selected: false,
      expanded: false,
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
      name: 'Pebble Toolbar',
      parent: parent,
      selected: false,
    } as PebbleToolbarNode, parent);
  }
  public laod(node: TreeNode): boolean {
    if (PebbleNode.is(node)) {
      if (PebbleNode.isConnection(node) || PebbleNode.isCollection(node)) {
        if (node.loading) {
          return false;
        }
        node.loading = true;
        return true;
      }
    }
    return false;
  }
  public unlaod(node: TreeNode): void {
    if (PebbleNode.is(node)) {
      if (PebbleNode.isConnection(node) || PebbleNode.isCollection(node)) {
        node.loading = false;
      }
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
        CompositeTreeNode.removeChild(this._model.root as CompositeTreeNode, node);
        this._model.refresh();
      } else {
        this._model.selectNode(node);
      }
    }
  }
  
  public async deleteDocument(): Promise<void> {
    if (!this.selected || !this._model) {
      return;
    }
    if (this.node && PebbleNode.isDocument(this.node) && !this.node.loading) {
      const node = this.node as PebbleDocumentNode;
      const msg = document.createElement('p');
      msg.innerHTML = 'Are you sure you want to delete the document: <strong>' + node.name + '</strong>?';
      const dialog = new ConfirmDialog({
        title: 'Delete document',
        msg,
        cancel: 'Keep',
        ok: 'Delete'
      });
      this.node.loading = true;
      const result = await dialog.open();
      if (result) {
        PebbleApi.remove(node.connection, node.link.split(':').pop() || '').then(done => {
          console.log(done);
          if (done) {
            CompositeTreeNode.removeChild(node.parent as CompositeTreeNode, node);
            this.refresh();
          }
        });
      } else {
        this.node.loading = false;
        this._model.selectNode(node);
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
      username: '',
      password: '',
    });
    const result = await dialog.open();
    if (result) {
      this.addConnection(result.connection, this._model.root, result.autoConnect);  
    }
  }

  public async newDocument(): Promise<boolean> {
    if (!this.node) {
      return false;
    }
    const collection = this.node as PebbleCollectionNode;
    const dialog = new SingleTextInputDialog({
      title: 'New document',
      confirmButtonLabel: 'Create',
      validate: (input) => input !== '' && !this.fileExists(input),
    });
    let name = await dialog.open();
    if (name) {
      name = collection.id + '/' + name;
      // const result = await PebbleApi.save(collection.connection, uri);
      // if (result) {
        this.addDocument(collection, collection.connection, {
          content: '',
          name,
          group: '',
          owner: '',
        }, true);
      // }
    }
    return false;
  }
}