import * as React from 'react';
import { TreeWidget, TreeProps, TreeModel, ContextMenuRenderer, CompositeTreeNode, TreeNode, NodeProps, TreeDecoration, TREE_NODE_SEGMENT_CLASS, TREE_NODE_SEGMENT_GROW_CLASS } from "@theia/core/lib/browser";
import { inject, postConstruct } from "inversify";
import { FSNode } from '../../classes/node';
import { FSCore } from '../core';
import { FSHome } from './home';
import { FSToolbar } from './toolbar';
import { DragController } from './drag';
import { FSTreeModel } from '../../classes/tree';
import { notEmpty } from '@theia/core';

export type FSViewWidgetFactory = () => FSViewWidget;
export const FSViewWidgetFactory = Symbol('FSViewWidgetFactory');

export class FSViewWidget extends TreeWidget {
  constructor(
    @inject(FSCore) protected readonly core: FSCore,
    @inject(DragController) protected readonly drag: DragController,
    @inject(TreeProps) protected readonly treeProps: TreeProps,
    @inject(FSTreeModel) model: FSTreeModel,
    @inject(ContextMenuRenderer) protected readonly contextMenuRenderer: ContextMenuRenderer
  ) {
    super(treeProps, model, contextMenuRenderer);

    this.id = 'fusion-view';
    this.title.label = 'Servers';
    this.title.caption = 'Servers';
    this.title.iconClass = 'fa fa-plug';
    this.title.closable = true;
    this.addClass('fusion-view');
  }

  @postConstruct()
  protected init(): void {
    super.init();
    this.core.model = this.model as FSTreeModel;
  }

  protected createContainerAttributes(): React.HTMLAttributes<HTMLElement> {
    const attrs = super.createContainerAttributes();
    return {
      ...attrs,
      onDragEnter: event => this.drag.onDragEnter(this.model.root, event),
      onDragOver: event => this.drag.onDragOver(this.model.root, event),
      onDragLeave: event => this.drag.onDragLeave(this.model.root, event),
      onDrop: event => this.drag.onDrop(this.model.root, event)
    };
  }

  protected createNodeAttributes(node: TreeNode, props: NodeProps): React.Attributes & React.HTMLAttributes<HTMLElement> {
    const elementAttrs = super.createNodeAttributes(node, props);
    return {
      ...elementAttrs,
      draggable: FSNode.isCollection(node) || FSNode.isItem(node),
      onDragStart: event => this.drag.onDragStart(node, event),
      onDragEnter: event => this.drag.onDragEnter(node, event),
      onDragOver: event => this.drag.onDragOver(node, event),
      onDragLeave: event => this.drag.onDragLeave(node, event),
      onDrop: event => this.drag.onDrop(node, event),
      onDoubleClick: event => this.doubleClick(node, event, elementAttrs.onDoubleClick),
      onClick: event => this.click(node, event, elementAttrs.onClick),
      title: node.name,
    };
  }

  protected doubleClick(node: TreeNode, event: React.MouseEvent<HTMLElement>, defaultHandler?: (event: React.MouseEvent<HTMLElement>) => void): void {
    if (event.altKey && (FSNode.isConnection(node) || FSNode.isItem(node))) {
      event.stopPropagation();
      this.core.select(node);
      this.core.showPropertiesDialog(node.id);
    } else if (FSNode.isRestMethod(node)) {
      event.stopPropagation();
      this.core.select(node);
      this.core.openMethodFunctionDocument(node.id);
    } else {
      defaultHandler && defaultHandler(event);
    }
  }
  protected click(node: TreeNode, event: React.MouseEvent<HTMLElement>, defaultHandler?: (event: React.MouseEvent<HTMLElement>) => void): void {
    if (event.altKey && (FSNode.isConnection(node) || FSNode.isItem(node))) {
      event.stopPropagation();
    } else {
      defaultHandler && defaultHandler(event);
    }
  }

  protected isEmpty(model?: TreeModel): boolean {
    model = model || this.model;
    return !model.root || (model.root as CompositeTreeNode).children.length < 2;
  }

  protected getDecorations(node: TreeNode): TreeDecoration.Data[] {
    const decorations = super.getDecorations(node);
    if (FSNode.isRestMethod(node)) {
      decorations.push({ tooltip: node.restMethod.function.name });
      decorations.push({ tooltip: node.restMethod.function.src });
    }
    return decorations;
  }

  protected superRenderCaption(node: TreeNode, props: NodeProps): React.ReactNode {
    console.log('rendering node...');
    console.log('getting decorations...');
    const tooltip = this.getDecorationData(node, 'tooltip').filter(notEmpty).join(' • ');
    const classes = [TREE_NODE_SEGMENT_CLASS];
    console.log('checking suffixes...');
    if (!this.hasTrailingSuffixes(node)) {
      classes.push(TREE_NODE_SEGMENT_GROW_CLASS);
    }
    const className = classes.join(' ');
    console.log('caption...');
    let attrs = this.decorateCaption(node, {
      className, id: node.id
    });
    if (tooltip.length > 0) {
      attrs = {
        ...attrs,
        title: tooltip
      };
    }
    const children: React.ReactNode[] = [];
    console.log('nodename...');
    const caption = this.toNodeName(node);
    console.log('deco data...');
    const highlight = this.getDecorationData(node, 'highlight')[0];
    if (highlight) {
      console.log('to react node...');
      children.push(this.toReactNode(caption, highlight));
    }
    console.log('search...');
    const searchHighlight = this.searchHighlights ? this.searchHighlights.get(node.id) : undefined;
    if (searchHighlight) {
      console.log('to react node...');
      children.push(...this.toReactNode(caption, searchHighlight));
    } else if (!highlight) {
      console.log('no search...');
      children.push(caption);
    }
    console.log('create...');
    return React.createElement('div', attrs, ...children);
  }

  protected renderIcon(node: TreeNode, props: NodeProps): React.ReactNode {
      const icon = this.toNodeIcon(node);
      if (icon) {
          return <div className={icon + ' fs-icon'}></div>;
      }
      return null;
  }

  protected renderNode(node: TreeNode, props: NodeProps): React.ReactNode {
    // const tooltip = this.getDecorationData(node, 'tooltip').filter(tooltip => !!tooltip).join('\n');
    if (FSNode.is(node)) {
      if (FSNode.isToolbar(node)) {
        return this.isEmpty(this.model) ? <FSHome core={this.core} /> : <FSToolbar core={this.core} />;
      } else {
        //return <FSItem tooltip={tooltip} core={this.core} node={node} />;
        return super.renderNode.apply(this, [node, props]);
      }
    }
    console.error('unknown node:', node);
    return '···';
  }
}