import * as React from 'react';
import { ReactWidget, StatefulWidget } from "@theia/core/lib/browser";
import { inject } from "inversify";
import { PebbleCore } from '../core';
import { EditorManager, EditorWidget, TextEditor } from '@theia/editor/lib/browser';
import { PebbleDocumentNode, PebbleConnectionNode } from '../../classes/node';
import { Disposable, MaybePromise } from '@theia/core';
import { PebbleApi } from '../../common/api';

const SERIALIZATION_TYPES = [
  { value: 'adaptive', text: 'Adaptive' },
  { value: 'xml', text: 'XML' },
  { value: 'json', text: 'JSON' },
  { value: 'text', text: 'Text' },
];

export type PebbleEvalWidgetFactory = () => PebbleEvalWidget;
export const PebbleEvalWidgetFactory = Symbol('PebbleEditorWidgetFactory');

export class PebbleEvalWidget extends ReactWidget implements StatefulWidget {
  protected listenerConnections: Disposable;
  protected listenerEditor: Disposable | undefined;
  protected documentNode: PebbleDocumentNode | undefined;
  protected editorWidget: EditorWidget | undefined;
  protected editor: TextEditor | undefined;
  protected elBody = React.createRef<HTMLDivElement>();
  protected elTitle = React.createRef<HTMLSpanElement>();
  protected elEval = React.createRef<HTMLButtonElement>();
  protected connection = '';
  protected serialization = 'adaptive';
  constructor(
    @inject(EditorManager) protected readonly manager: EditorManager,
    @inject(PebbleCore) protected readonly core: PebbleCore,
  ) {
    super();
    this.id = 'pebble-eval';
    this.title.label = 'Evaluation';
    this.title.caption = 'Evaluation';
    this.title.iconClass = 'fa fa-code';
    this.title.closable = true;
    this.addClass('pebble-eval');
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

  editorChanged(widget: EditorWidget | undefined) {
    this.editorWidget = widget;
    if (widget) {
      const node = this.core.getNode(widget.editor.uri.path.toString()) as PebbleDocumentNode;
      this.changeTo(widget, node);
    }
  }

  changeTo(widget?: EditorWidget, node?: PebbleDocumentNode) {
    if (this.listenerEditor) {
      this.listenerEditor.dispose();
    }
    this.editor = widget && widget.editor;
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

  connections(node?: PebbleDocumentNode) {
    if (this.connection === '' &&Object.keys(this.core.connections).length > 0) {
      this.connection = this.core.connectionID(this.core.connections[Object.keys(this.core.connections)[0]]);
    }
    return Object.keys(this.core.connections).map(id => <option value={id} key={id}>{this.core.connections[id].name}</option>);
  }

  async evaluate() {
    if (this.editor) {
      const node = this.documentNode ? this.documentNode.connectionNode : this.core.getNode(this.connection) as PebbleConnectionNode;
      // const value = this.editor.document.dirty || !this.documentNode ? this.editor.document.getText() : this.documentNode.uri;
      const value = this.editor.document.getText();
      if (node) {
        const result = await PebbleApi.evaluate(node.connection, this.serialization, value, true);
        console.log(result);
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
        <select className="x-select" disabled={!editor} onChange={e => this.serialization = e.target.value}>
          {this.serializationTypes()}
        </select>
        <button className="x-btn" ref={this.elEval} disabled={!this.documentNode && (!editor || !this.connection)} onClick={() => this.evaluate()}><span className="fa fa-play" /> Evaluate</button>
      </div>
      <div className='x-body' ref={this.elBody}>{this.connection} - {this.serialization}</div>
    </React.Fragment>
  }
}