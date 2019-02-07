import * as React from 'react';
import { ReactWidget, StatefulWidget } from "@theia/core/lib/browser";
import { inject } from "inversify";
import { FSCore } from '../core';
import { EditorManager, EditorWidget, TextEditor } from '@theia/editor/lib/browser';
import { FSDocumentNode, FSConnectionNode } from '../../classes/node';
import { Disposable, MaybePromise } from '@theia/core';
import { FSApi, RANGE_LENGTH } from '../../common/api';
import { SERIALIZATION_TYPES } from '../../classes/eval';

export type FSEvalWidgetFactory = () => FSEvalWidget;
export const FSEvalWidgetFactory = Symbol('FSEditorWidgetFactory');

export class FSEvalWidget extends ReactWidget implements StatefulWidget {
  protected listenerConnections: Disposable;
  protected listenerEditor: Disposable | undefined;
  protected documentNode: FSDocumentNode | undefined;
  protected editorWidget: EditorWidget | undefined;
  protected lastEditorWidget: EditorWidget | undefined;
  protected editor: TextEditor | undefined;
  protected elBody = React.createRef<HTMLDivElement>();
  protected elTitle = React.createRef<HTMLSpanElement>();
  protected elEval = React.createRef<HTMLButtonElement>();
  protected connection = '';
  protected result = '';
  protected serialization = 'adaptive';
  protected pager = {
    start: 1,
    size: RANGE_LENGTH,
    pages: 1,
    enabled: false,
    loaded: false,
  };
  constructor(
    @inject(EditorManager) protected readonly manager: EditorManager,
    @inject(FSCore) protected readonly core: FSCore,
  ) {
    super();
    this.id = 'fusion-eval';
    this.title.label = 'Evaluation';
    this.title.caption = 'Evaluation';
    this.title.iconClass = 'fa fa-code';
    this.title.closable = true;
    this.addClass('fusion-eval');
    this.scrollOptions = undefined;
    this.update();
    this.scrollBar && this.scrollBar.destroy();

    this.listenerConnections = this.core.onConnectionsChange(e => {
      this.update();
    });

    manager.onActiveEditorChanged(this.editorChanged.bind(this));
    this.editorChanged(manager.activeEditor);
  }

  public dispose() {
    this.listenerConnections.dispose();
    this.listenerEditor && this.listenerEditor.dispose();
    super.dispose();
  }

  protected getScrollContainer(): MaybePromise<HTMLElement> {
    return this.elBody.current || this.node;
  }

  editorChanged(widget?: EditorWidget) {
    if (widget && widget != this.lastEditorWidget) {
      this.lastEditorWidget = this.editorWidget;
      this.editorWidget = widget;
      if (widget) {
        const node = this.core.getNode(widget.editor.uri.path.toString()) as FSDocumentNode;
        this.changeTo(widget, node);
      }
    }
    if (this.editorWidget) {
      this.lastEditorWidget = this.editorWidget;
    }
  }

  changeTo(widget?: EditorWidget, node?: FSDocumentNode) {
    if (this.listenerEditor) {
      this.listenerEditor.dispose();
    }
    this.editor = widget && widget.editor;
    this.result = '';
    this.listenerEditor = this.editor && this.editor.document.onDirtyChanged(() => this.update());
    this.documentNode = node;
    this.update();
  }

  storeState(): object {
    return {};
  }
  
  restoreState(state: object) {}

  serializationTypes() {
    return SERIALIZATION_TYPES.map(mode => <option value={mode.value} key={mode.value}>{mode.text}</option>);
  }

  connections(node?: FSDocumentNode) {
    if (this.connection === '' &&Object.keys(this.core.connections).length > 0) {
      this.connection = this.core.connectionID(this.core.connections[Object.keys(this.core.connections)[0]]);
    }
    return Object.keys(this.core.connections).map(id => <option value={id} key={id}>{this.core.connections[id].name}</option>);
  }

  renderPager() {
    const disabled = !this.pager.enabled || !this.documentNode && (!this.editorWidget || !this.connection);
    const result: any[] = [];
    const { start, size } = this.pager;
    for (let i = 1; i <= this.pager.pages; i++) {
      result.push(<button key={'btn-' + i} disabled={disabled || (start - 1) / size === i - 1} onClick={() => this.evaluate(i)}>{i}</button>);
    }
    if (!this.pager.loaded) {
      result.push(<button key="more" disabled={disabled} onClick={() => this.evaluate(this.pager.pages + 1)}>load more...</button>)
    }
    return result;
  }

  resetPager() {
    this.pager.enabled = false;
    this.pager.loaded = false;
    this.pager.pages = 1;
    this.pager.start = 1;
  }

  async evaluate(page = 1) {
    if (this.editor) {
      if (page === 0) {
        page =1;
        this.result = '';
        this.resetPager();
      }
      const { size } = this.pager;
      const start = (page - 1) * size + 1;
      try {
        const node = this.documentNode ? this.documentNode.connectionNode : this.core.getNode(this.connection) as FSConnectionNode;
        let isContent: boolean;
        let value: string;
        if (this.documentNode && !this.editor.document.dirty) {
          value = this.documentNode.uri;
          isContent = false;
        } else {
          value = this.editor.document.getText();
          isContent = true;
        }
        if (node) {
          const result = await FSApi.evaluate(node.connection, this.serialization, value, isContent, start, size);
          if (result !== '') {
            this.pager.start = start;
            this.pager.pages = Math.max(this.pager.pages, page);
            this.pager.enabled = true;
            this.result = this.core.result = result;
          } else {
            this.pager.loaded = true;
          }
          this.update();
        }
      } catch(e) {
        this.editorWidget = undefined;
        this.editor = undefined;
        this.editorChanged();
        this.update();
      }
    }
  }
  
  protected render(): React.ReactNode {
    const editor = !!this.editorWidget;
    const title = this.editorWidget ? this.editorWidget.title.label : 'Open a document to evaluate.';
    const connectionsAvailable = Object.keys(this.core.connections).length > 0;
    const connection = this.documentNode ? this.documentNode.connectionNode.id : this.connection;
    return <React.Fragment>
      <div className='x-header'>
        <span className="x-document">{title}</span>
        <span className='x-separator' />
        {editor && <React.Fragment>
          <span className={!this.documentNode && !connectionsAvailable ? 'disabled' : ''} >Connection:</span>
          {this.documentNode ? <span className="x-connection">{this.documentNode.connectionNode.connection.name}</span> :
            <select className="x-select" disabled={!connectionsAvailable} value={connection} onChange={e => this.connection = e.target.value}>
              {this.connections(this.documentNode)}
            </select>
          }</React.Fragment>
        }
        <span className={!editor ? 'disabled' : ''}>Serialization Type:</span>
        <select className="x-select" disabled={!editor} onChange={e => {
          this.serialization = e.target.value;
          this.update();
        }}>
          {this.serializationTypes()}
        </select>
        <button className="x-btn" ref={this.elEval} disabled={!this.documentNode && (!editor || !this.connection)} onClick={() => this.evaluate(0)}><span className="fa fa-play" /> Evaluate</button>
      </div>
      <div className='x-body' ref={this.elBody}>{this.result}</div>
      <div className='x-footer'>
        {((this.serialization === 'xml' || this.serialization === 'json') && (this.pager.pages > 1 || !this.pager.loaded)) && this.renderPager()}
        <span className="x-separator"></span>
        <button disabled={this.result === ''} onClick={() => this.core.newItemFromResult()}><i className="fa fa-fw fa-file-code-o"></i> New file</button>
      </div>
    </React.Fragment>
  }
}