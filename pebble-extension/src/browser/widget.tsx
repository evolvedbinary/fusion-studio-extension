import * as React from 'react';
import { TreeWidget, TreeProps, TreeModel, ContextMenuRenderer, CompositeTreeNode, TreeNode, NodeProps, ConfirmDialog } from "@theia/core/lib/browser";
import { inject, postConstruct } from "inversify";
import { NewConnectionDialog } from './new-connection-dialog';
import { PebbleConnection } from '../classes/connection';
import { PebbleDocument, PebbleCollection } from '../classes/item';
import { PEBBLE_RESOURCE_SCHEME } from './resource';
import { PebbleNode, PebbleDocumentNode, PebbleCollectionNode, PebbleLoadingNode, PebbleToolbarNode, PebbleConnectionNode, PebbleItemNode } from '../classes/node';

export type PebbleViewWidgetFactory = () => PebbleViewWidget;
export const PebbleViewWidgetFactory = Symbol('PebbleViewWidgetFactory');

export class PebbleViewWidget extends TreeWidget {
  static CONTEXT_MENU = ['pebble-context-menu'];
  constructor(
    @inject(TreeProps) protected readonly treeProps: TreeProps,
    @inject(TreeModel) model: TreeModel,
    @inject(ContextMenuRenderer) protected readonly contextMenuRenderer: ContextMenuRenderer
  ) {
    super(treeProps, model, contextMenuRenderer);

    this.id = 'pebble-view';
    this.title.label = 'Connections';
    this.title.caption = 'Connections';
    this.title.iconClass = 'fa fa-plug';
    this.title.closable = true;
    this.addClass('pebble-view');
  }
  @postConstruct()
  protected init(): void {
    super.init();
    this.createRoot([]);
  }

  public createRoot(roots: PebbleNode[]) {
    // const nodes = this.reconcileTreeState(roots);
    this.model.root = {
      id: 'pebble-connections-view-root',
      name: 'Pebble Connections Root',
      visible: false,
      children: [],
      parent: undefined
    } as CompositeTreeNode;
    this.addToolbar(this.model.root as CompositeTreeNode);
  }
  public addNode(parent: TreeNode, child: TreeNode): void {
    CompositeTreeNode.addChild(parent as CompositeTreeNode, child);
    this.model.refresh();
  }
  protected getName(id: string): string {
    return id.split('/').pop() || id;
  }
  public addDocument(parent: TreeNode, connection: PebbleConnection, document: PebbleDocument): void {
    this.addNode(parent, {
      type: 'item',
      connection,
      collection: false,
      id: document.name,
      link: PEBBLE_RESOURCE_SCHEME + ':' + document.name,
      name: this.getName(document.name),
      parent: parent,
      selected: false,
    } as PebbleDocumentNode);
  }
  public addCollection(parent: TreeNode, connection: PebbleConnection, collection: PebbleCollection): void {
    this.addNode(parent, {
      type: 'item',
      connection,
      collection: true,
      children: [],
      id: collection.name,
      link: PEBBLE_RESOURCE_SCHEME + ':' + collection.name,
      name: this.getName(collection.name),
      parent: parent as CompositeTreeNode,
      selected: false,
      expanded: false,
    } as PebbleCollectionNode);
  }
  public laod(node: TreeNode): void {
    this.addNode(node, {
      type: 'loading',
    } as PebbleLoadingNode);
  }
  public unlaod(node: TreeNode): void {
    CompositeTreeNode.removeChild(node as CompositeTreeNode, (node as CompositeTreeNode).children[0]);
    this.model.refresh();
  }
  public addToolbar(parent: CompositeTreeNode): void {
    this.addNode(parent, {
      type: 'toolbar',
      id: 'pebble-toolbar',
      name: 'Pebble Toolbar',
      parent: parent,
      selected: false,
    } as PebbleToolbarNode);
  }
  
  protected async deleteConnection(): Promise<void> {
    console.log('delete');
    if (this.model.selectedNodes.length && PebbleNode.isConnection(this.model.selectedNodes[0])) {
      const node = this.model.selectedNodes[0] as PebbleConnectionNode;
      const msg = document.createElement('p');
      msg.innerHTML = 'Are you sure you want to the connection: <strong>' + node.connection.name + '</strong>?<br/>' +
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
        CompositeTreeNode.removeChild(this.model.root as CompositeTreeNode, node);
        this.model.refresh();
      } else {
        this.model.selectNode(node);
      }
    }
  }
  
  protected async newConnection(): Promise<void> {
    const dialog = new NewConnectionDialog({
      title: 'New connection',
      name: 'Localhost',
      server: 'http://localhost:8080',
      username: '',
      password: '',
    });
    const result = await dialog.open();
    if (result) {
      this.model.root = CompositeTreeNode.addChild(this.model.root as CompositeTreeNode, {
        children: [],
        expanded: result.autoConnect,
        type: 'connection',
        id: result.connection.username + '-' + result.connection.server,
        name: result.connection.name,
        connection: result.connection,
        parent: this.model.root as CompositeTreeNode,
        selected: false
      } as PebbleConnectionNode);
    }
  }
  
  protected isEmpty(model?: TreeModel): boolean {
    model = model || this.model;
    return !model.root || (model.root as CompositeTreeNode).children.length < 2;
  }
  protected noConnections(): React.ReactNode {
    return (<div className='pebble-no-connection theia-navigator-container'>
      <div className="title"><i className="fa fa-plug fa-fw"></i>Pebble Connections</div>
      <div className='center'>No connections available yet.</div>
      <div className='open-workspace-button-container'>
        <button className='open-workspace-button' title='Connect to a database' onClick={this.newConnection.bind(this)}>Connect...</button>
      </div>
    </div>);
  }
  protected button(id: string, text:string, icon: string, action: React.MouseEventHandler<any>, color = ''): React.ReactNode {
    return <button id={id} className={'pebble-action' + (color ? ' color-' + color : '')} title={text} onClick={action.bind(this)}>
      <span className={'fa fa-fw fa-' + icon}></span>
    </button>;
  }

  // protected renderTree(model: TreeModel): React.ReactNode {
  //   return <div>
  //     {this.toolbar()}
  //     {!this.isEmpty(model) && super.renderTree(model)}
  //   </div>;
  // }

  protected renderLoading(node: PebbleLoadingNode): React.ReactNode {
    return <div className='loadingNode'>
      <i className="fa fa-spin fa-spinner"></i>
      <span className='name'>Loading...</span>
    </div>;
  }
  protected renderConnection(node: PebbleConnectionNode): React.ReactNode {
    return <div className='pebbleNode connectionNode' title={node.connection.name + ' (' + (node.connection.username || '(anonymous)') + '@' + node.connection.server + ')'}>
      <i className={'fa fa-toggle-' + (node.loaded ? 'on' : 'off')}></i>
      <span className='name'>{node.connection.name}</span>
      <span className='server'>{node.connection.username || '(anonymous)'}@{node.connection.server}</span>
    </div>;
  }
  protected renderItem(node: PebbleItemNode): React.ReactNode {
    return node.collection ? this.renderCollection(node as PebbleCollectionNode) : this.renderDocument(node as PebbleDocumentNode);
  }
  protected renderCollection(node: PebbleCollectionNode): React.ReactNode {
    return <div className='pebbleNode itemNode collectionNode'>
      <i className={'icon fa fa-folder' + (node.expanded ? '-open' : '') + (node.loaded ? '' : '-o')}></i>
      <span className='name'>{node.name}</span>
    </div>;
  }
  protected renderDocument(node: PebbleDocumentNode): React.ReactNode {
    return <div className='pebbleNode itemNode documentNode'>
      <i className={'icon fa fa-file' + (node.loaded ? '' : '-o')}></i>
      <span className='name'>{node.name}</span>
    </div>;
  }
  protected renderToolbar(node: PebbleToolbarNode): React.ReactNode {
    return this.isEmpty(this.model) ? this.noConnections() : (<div className='pebble-toolbar'>
      <span className="title"><i className="fa fa-plug fa-fw"></i>Pebble Connections</span>
      {this.button('pebble-toolbar-button-add', 'Add connection', 'plus', this.newConnection)}
      {this.button('pebble-toolbar-button-delete', 'Delete connection', 'minus', this.deleteConnection, 'red')}
    </div>);
  }

  protected renderCaption(node: TreeNode, props: NodeProps): React.ReactNode {
    if (PebbleNode.is(node)) {
      if (PebbleNode.isConnection(node)) {
        return this.renderConnection(node);
      } else if (PebbleNode.isToolbar(node)) {
        return this.renderToolbar(node);
      } else if (PebbleNode.isItem(node)) {
        return this.renderItem(node);
      } else if (PebbleNode.isLoading(node)) {
        return this.renderLoading(node);
      }
    }
    console.error('unknown node:', node);
    return '···';
  }
}