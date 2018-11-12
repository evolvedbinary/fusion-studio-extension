import * as React from 'react';
import { TreeWidget, TreeProps, TreeModel, ContextMenuRenderer, CompositeTreeNode, TreeNode, NodeProps } from "@theia/core/lib/browser";
import { inject, postConstruct } from "inversify";
import { PebbleNode, PebbleDocumentNode, PebbleCollectionNode, PebbleLoadingNode, PebbleToolbarNode, PebbleConnectionNode, PebbleItemNode } from '../classes/node';
import { PebbleCore } from './core';
import { PebbleAction } from '../classes/action';

export type PebbleViewWidgetFactory = () => PebbleViewWidget;
export const PebbleViewWidgetFactory = Symbol('PebbleViewWidgetFactory');

export class PebbleViewWidget extends TreeWidget {
  constructor(
    @inject(PebbleCore) protected readonly core: PebbleCore,
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
    this.core.model = this.model;
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
        <button className='open-workspace-button' title='Connect to a database' onClick={() => this.core.execute('connect')}>Connect...</button>
      </div>
    </div>);
  }
  protected button(id: string, text:string, icon: string, action: string | PebbleAction | React.MouseEventHandler<any>, color = ''): React.ReactNode {
    let click: React.MouseEventHandler<any>;
    if (PebbleAction.is(action)) {
      action = action.id;
    }
    if (typeof action === 'string') {
      click = () => this.core.execute(action as string)
    } else {
      click = action.bind(this);
    }
    return <button id={id} className={'pebble-action' + (color ? ' color-' + color : '')} title={text} onClick={click}>
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
    return <div className='pebbleNode connectionNode' title={node.connection.name + ' (' + (node.connection.username || '(guest)') + '@' + node.connection.server + ')'}>
      <i className={'fa fa-toggle-' + (node.loaded ? 'on' : 'off')}></i>
      <span className='name'>{node.connection.name}</span>
      <span className='server'>{node.connection.username || '(guest)'}@{node.connection.server}</span>
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
    return <div className={'pebbleNode itemNode documentNode' + (node.isNew ? ' pebbleNew' : '')}>
      <i className={'icon fa fa-' + (node.loading ? 'spin fa-spinner' : ('file' + (node.loaded ? '' : '-o')))}></i>
      <span className='name'>{node.name}</span>
    </div>;
  }
  protected renderToolbar(node: PebbleToolbarNode): React.ReactNode {
    return this.isEmpty(this.model) ? this.noConnections() : (<div className='pebble-toolbar'>
      <span className="title"><i className="fa fa-plug fa-fw"></i>Pebble Connections</span>
      {this.button('pebble-toolbar-button-add', 'Add connection', 'plus', 'pebble.connect')}
      {/* {this.button('pebble-toolbar-button-delete', 'Delete connection', 'minus', this.deleteConnection, 'red')} */}
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