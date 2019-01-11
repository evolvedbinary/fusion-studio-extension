import { injectable, inject } from "inversify";
import { PebbleNode, PebbleDocumentNode, PebbleCollectionNode, PebbleToolbarNode, PebbleConnectionNode, PebbleItemNode } from "../classes/node";
import { open, TreeNode, CompositeTreeNode, ConfirmDialog, SingleTextInputDialog, OpenerService, StatusBar, StatusBarAlignment } from "@theia/core/lib/browser";
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
import { PebbleConnectionDialog, NewFromTemplateDialog } from "./dialogs";
import { PebbleFiles, PebbleFileList } from "../classes/files";
import { isArray } from "util";
import { lookup } from "mime-types";
import { createError, PebbleError } from "../classes/error";
import { asyncForEach } from "../common/asyncForEach";
import { PebbleStatusEntry } from "../classes/status";
import { actProperties } from "./commands";
import { PebblePropertiesDialog } from "./dialogs/properties-dialog";
import { PebbleTreeModel } from "../classes/tree";

export const PEBBLE_RESOURCE_SCHEME = 'pebble';
const TRAILING_SYMBOL = '/';
const STATUSBAR_ELEMENT = 'pebble-statusbar';
@injectable()
export class PebbleCore {
  protected statusEntry: PebbleStatusEntry = { text: '', alignment: StatusBarAlignment.LEFT, command: actionID(actProperties.id) };
  protected clipboard: Partial<PebbleDragOperation> = {};
  protected lastNameID: number = 1;
  constructor(
    @inject(CommandRegistry) protected readonly commands: CommandRegistry,
    @inject(WorkspaceService) protected readonly workspace: WorkspaceService,
    @inject(FileDialogService) protected readonly fileDialog: FileDialogService,
    @inject(PebbleFiles) protected readonly files: PebbleFiles,
    @inject(OpenerService) private readonly openerService: OpenerService,
    @inject(StatusBar) protected readonly statusBar: StatusBar,
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

  // nodes:

  protected createRoot() {
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

  protected async addNode(child: PebbleNode, parent?: TreeNode): Promise<PebbleNode> {
    CompositeTreeNode.addChild(parent as CompositeTreeNode, child);
    this._model && this._model.refresh();
    await this.refresh();
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
    } as PebbleToolbarNode, parent);
  }

  protected removeNode(child: PebbleNode, parent?: TreeNode) {
    this._model && this._model.removeNode(child);
    this.refresh();
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

  public select(node: PebbleItemNode | PebbleConnectionNode) {
    if (!PebbleNode.isToolbar(node)) {
      this._model && this._model.selectNode(node);
    }
  }

  protected async empty(node: CompositeTreeNode) {
    while (node.children.length) {
      this.removeNode(node.children[node.children.length - 1] as PebbleNode, node);
    }
  }
  
  public expanded(node: CompositeTreeNode) {
    if (PebbleNode.isConnection(node) && !node.loaded) {
      this.connect(node, node.connection);
    } else if (PebbleNode.isCollection(node) && !node.loaded) {
      this.load(node, node.connection, node.uri);
    }
  }

  public expand(node: CompositeTreeNode) {
    this._model && this._model.expandNode(node as any);
  }

  public getNode(id: string): PebbleNode | undefined {
    return this._model ? this._model.getNode(id) as PebbleNode : undefined;
  }

  // Pebble nodes

  public isConnection(): boolean {
    return !!this._model && this._model.selectedNodes.length > 0 && PebbleNode.isConnection(this._model.selectedNodes[0]);
  }

  public isCollection(): boolean {
    return !!this._model && this._model.selectedNodes.length > 0 && PebbleNode.isCollection(this._model.selectedNodes[0]);
  }

  public isDocument(): boolean {
    return !!this._model && this._model.selectedNodes.length > 0 && PebbleNode.isDocument(this._model.selectedNodes[0]);
  }

  protected async connect(node: CompositeTreeNode, connection: PebbleConnection) {
    if (this.startLoading(node)) {
      try {
        const root = await PebbleApi.connect(connection);
        (node as PebbleConnectionNode).loaded = true;
        const rootNode = await this.addCollection(node, connection, root)
        rootNode.loaded = true;
        root.collections.forEach(subCollection => this.addCollection(rootNode, connection, subCollection));
        root.documents.forEach(document => this.addDocument(rootNode, connection, document));
        this.expand(rootNode);
      } catch (error) {
        (node as PebbleConnectionNode).expanded = false;
        console.error('caught:', error);
      }
      this.endLoading(node);
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
  
  protected async load(node: CompositeTreeNode, connection: PebbleConnection, uri: string) {
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

  public async save(document: PebbleDocumentNode, content: string) {
    try {
      if (await PebbleApi.save(document.connection, document.uri, content)) {
        document.isNew = false;
        this.refresh();
      }
    } catch (error) {
      console.error('caught:', error);
    }
  }

  protected async saveDocument(connection: PebbleConnection, uri: string, content: string | Blob, binary = false): Promise<boolean> {
    try {
      return await PebbleApi.save(connection, uri, content, binary);
    } catch (error) {
      console.error('caught:', error);
      return false;
    }
  }

  public async saveDocuments(node: PebbleCollectionNode, documents: PebbleFileList | FormData): Promise<PebbleDocument[]> {
    try {
      this.startLoading(node);
      const docs = await PebbleApi.saveDocuments(node.connection, node.collection, documents);
      this.endLoading(node);
      this.load(node as CompositeTreeNode, node.connection, node.uri);
      return docs;
    } catch (error) {
      this.endLoading(node);
      console.error('caught:', error);
      return [];
    }
  }

  protected addConnection(connection: PebbleConnection, parent?: TreeNode, expanded?: boolean): void {
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
      return this.addCollection(parent, connection, {
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
    return this.addDocument(parent, connection, document);
  }

  protected addDocument(parent: TreeNode, connection: PebbleConnection, document: PebbleDocument, isNew: boolean = false): PebbleDocumentNode {
    const name = this.getName(document.name);
    if (PebbleNode.isCollection(parent)) {
      document.name = this.collectionDir(parent.uri, name);
    }
    const node = {
      type: 'item',
      connection,
      isCollection: false,
      id: this.itemID(connection, document),
      name,
      parent: parent,
      isNew,
      selected: false,
      uri: document.name,
      document,
    } as PebbleDocumentNode;
    this.addNode(node, parent);
    return node;
  }

  protected async addCollection(parent: TreeNode, connection: PebbleConnection, collection: PebbleCollection): Promise<PebbleCollectionNode> {
    const name = this.getName(collection.name);
    if (PebbleNode.isCollection(parent)) {
      collection.name = this.collectionDir(parent.uri, name);
    }
    return this.addNode({
      type: 'item',
      connection,
      isCollection: true,
      children: [],
      id: this.itemID(connection, collection),
      link: PEBBLE_RESOURCE_SCHEME + ':' + collection.name,
      name,
      parent: parent as CompositeTreeNode,
      selected: false,
      expanded: false,
      collection,
      uri: collection.name,
    } as PebbleCollectionNode, parent) as Promise<PebbleCollectionNode>;
  }

  public status() {
    const nodes = this.topNodes(this.selection);
    if (this.node) {
      this.statusEntry.active = true;
      if (nodes.length > 1) {
        this.statusEntry.text = 'selection: ' + nodes.length.toString();
        this.statusEntry.arguments = [];
      } else {
        this.statusEntry.arguments = [this.node.id];
        if (PebbleNode.isConnection(this.node)) {
          this.statusEntry.text = `$(toggle-on) "${this.node.connection.name}" by "${this.node.connection.username}" to ${this.node.connection.server}`;
        } else if (PebbleNode.isCollection(this.node)) {
          this.statusEntry.text = `$(folder) ${this.node.name} (${this.getGroupOwner(this.node.collection)})`;
        } else if (PebbleNode.isDocument(this.node)) {
          this.statusEntry.text = `$(file${this.node.document.binaryDoc ? '' : '-code'}-o) ${this.node.name} (${this.getGroupOwner(this.node.document)})`;
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
    return nodes.filter(node => {
      if (this.node && (PebbleNode.isDocument(node) || PebbleNode.isCollection(node))) {
        let parent = node.parent
        while (parent && PebbleNode.isCollection(parent)) {
          if (this.selection.indexOf(parent as any) > -1) {
            return false;
          }
          parent = parent.parent;
        }
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
  
  protected connectionID(connection: PebbleConnection): string {
    return (connection.username ? connection.username : '(guest)') + '@' + connection.server;
  }

  protected itemID(connection: PebbleConnection, item: PebbleItem): string {
    return this.connectionID(connection) + item.name;
  }





  protected parentCollection(uri: string): string {
    const parent = uri.split(TRAILING_SYMBOL);
    parent.pop();
    return parent.join(TRAILING_SYMBOL);
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

  public async openDocument(node: PebbleDocumentNode): Promise<any> {
    if (this.startLoading(node)) {
      const result = await open(this.openerService, new URI(PEBBLE_RESOURCE_SCHEME + ':' + node.id));
      this.endLoading(node);
      node.loaded = true;
      return result;
    }
  }

  protected async createDocument(collection: PebbleCollectionNode, name: string, content = '', group = '', owner = '') {
    const doc = await this.openDocument(this.addDocument(collection, collection.connection, {
      content,
      name,
      created: new Date(),
      lastModified: new Date(),
      binaryDoc: false,
      acl: [],
      size: content.length,
      mediaType: lookup(name) || 'text/plain',
      group: group || 'dba',
      owner: owner || collection.connection.username,
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
          source.connection,
          source.uri,
          operation.destination[i],
          isCollection,
          operation.copy
        );
        if (result) {
          let resultNode: PebbleItemNode;
          if (isCollection) {
            resultNode = await this.addCollection(operation.destinationContainer, source.connection, {
              ...(source as PebbleCollectionNode).collection,
              name: operation.destination[i],
            });
          } else {
            resultNode = this.addDocument(operation.destinationContainer, source.connection, {
              ...(source as PebbleDocumentNode).document,
              name: operation.destination[i],
            });
          }
          if (!operation.copy) {
            this.removeNode(source, source.parent);
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
        this._model.refresh();
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

  public showPropertiesDialog(nodeId = '') {
    const node = !nodeId || (this.node && this.node.id !== nodeId) ? this.node : this.getNode(nodeId);
    if (node) {
      if (PebbleNode.isConnection(node)) {
        const dialog = new PebbleConnectionDialog({
          title: 'Edit connection',
          acceptButton: 'Update',
          ...node.connection,
        });
        dialog.open().then(result => {
          if (result) {
            this.empty(node);
            node.expanded = false;
            node.loading = false;
            node.loaded = false;
            (node as any).id = this.connectionID(result.connection);
            (node as any).name = result.connection.name;
            node.connection = result.connection;
            node.selected = false;
            node.uri = result.connection.server;
            this.connect(node, result.connection);
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
            if (result.name !== node.name) {
              this.rename(node, result.name);
            }
          }
        });
      }
    }
  }
}