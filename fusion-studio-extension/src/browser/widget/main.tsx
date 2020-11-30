import * as React from 'react';
import { TreeWidget, TreeProps, TreeModel, ContextMenuRenderer, CompositeTreeNode, TreeNode, NodeProps, TreeDecoration, TREE_NODE_SEGMENT_CLASS, TREE_NODE_SEGMENT_GROW_CLASS } from "@theia/core/lib/browser";
import { inject, postConstruct } from "inversify";
import { FSItemNode, FSNode } from '../../classes/node';
import { FSCore } from '../core';
import { FSHome } from './home';
import { FSToolbar } from './toolbar';
import { DragController } from './drag';
import { FSTreeModel } from '../../classes/tree';

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
    this.core.tree = this;
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

  InputBox(props: {
    value: string,
    validate?: (value: string) => string,
    onAccept: (value: string) => void,
    onCancel: () => void,
  }) {
    const [value, setValue] = React.useState(props.value);
    const input = React.useRef() as React.MutableRefObject<HTMLInputElement>;
    const errorEl = React.useRef() as React.MutableRefObject<HTMLDivElement>;
    const [errorMessage, _setErrorMessage] = React.useState('');
    const updateErrorElPosition = () => {
      if (errorEl) {
        const root = document.querySelector('#fusion-view > div.theia-TreeContainer > div');
        if (root) {
          const rootPos = root.getBoundingClientRect();
          const inputPos = input.current.getBoundingClientRect();
          errorEl.current.style.left = (inputPos.left - rootPos.left) + 'px';
          errorEl.current.style.top = (inputPos.top - rootPos.top + inputPos.height) + 'px';
          errorEl.current.style.width = inputPos.width + 'px';
        }
      }
    }
    const setErrorMessage = (message: string) => {
      _setErrorMessage(message);
      updateErrorElPosition();
    }
    const eventListener = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const newValue = (e.target as HTMLInputElement).value;
        e.stopPropagation();
        if (props.validate) {
          const message = props.validate(newValue);
          if (message) {
            setErrorMessage(message);
            return;
          }
        }
        props.onAccept(newValue);
      } else if (e.key === 'Escape') {
        e.stopPropagation();
        props.onCancel();
      } else if (e.key === 'ArrowUp'
        || e.key === 'ArrowDown'
        || e.key === 'ArrowLeft'
        || e.key === 'ArrowRight') {
        e.stopPropagation();
      }
    };
    React.useEffect(() => {
      input.current.addEventListener('keydown', eventListener);
      input.current.focus();
      input.current.select();
    }, []);
    return <div className={TREE_NODE_SEGMENT_CLASS + ' ' + TREE_NODE_SEGMENT_GROW_CLASS}>
      <div className="fs-inline-input">&nbsp;
        {errorMessage !== '' && <div
          ref={errorEl}
        >{errorMessage}</div>}
        <input
          ref={input}
          className="theia-input"
          value={value}
          onChange={e => setValue(e.target.value)}
          onClick={e => e.stopPropagation()}
          onContextMenu={e => e.stopPropagation()}
          onDoubleClick={e => e.stopPropagation()}
          onBlur={e => props.onCancel()}
        />
      </div>
    </div>;
  }

  protected renderCaption(node: TreeNode, props: NodeProps): React.ReactNode {
    if (FSNode.is(node) && node.renaming) {
      return <this.InputBox
        value={node.nodeName}
        onAccept={newName => this.core.tryRename(node, newName)}
        onCancel={() => this.core.setRename(node, false)}
        validate={value => this.core.validateName(node as FSItemNode, value)}
      />;
    }
    return super.renderCaption(node, props);
  }

  protected renderIcon(node: TreeNode, props: NodeProps): React.ReactNode {
      const icon = this.toNodeIcon(node);
      if (icon) {
          return <div className={icon + ' fs-icon'}></div>;
      }
      return null;
  }

  protected createNodeClassNames(node: TreeNode, props: NodeProps): string[] {
    return [...super.createNodeClassNames(node, props), 'fusion-item'];
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

  public refreshHeights() {
    this.forceUpdate({ resize: true });
  }
}