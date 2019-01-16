import * as React from 'react';
import { ReactWidget, StatefulWidget } from "@theia/core/lib/browser";
import { inject } from "inversify";
import { PebbleCore } from '../core';
import { EditorManager, TextEditor, EditorWidget } from '@theia/editor/lib/browser';
import { PebbleDocumentNode, PebbleNode } from '../../classes/node';
import { Disposable, MaybePromise } from '@theia/core';

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
      console.log(e);
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
    console.log(this.elBody.current);
    return this.elBody.current || this.node;
  }

  editorChanged(widget: EditorWidget | undefined) {
    this.editorWidget = widget;
    if (widget) {
      const node = this.core.getNode(widget.editor.uri.path.toString());
      if (PebbleNode.isDocument(node)) {
        this.changeTo(widget, node);
      } else {
        this.changeTo();
      }
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

  serializationTypess() {
    return SERIALIZATION_TYPES.map(mode => <option value={mode.value} key={mode.value}>{mode.text}</option>);
  }

  connections(node?: PebbleDocumentNode) {
    return Object.keys(this.core.connections).map(id => <option value={id} key={id} selected={node && node.connectionNode.id === id}>{this.core.connections[id].name}</option>);
  }

  eval() {

  }
  
  protected render(): React.ReactNode {
    let fileOpen;
    let connected = !!this.documentNode;
    let connectionsAvailable = Object.keys(this.core.connections).length > 0;
    let title = this.editorWidget ? this.editorWidget.title.caption : 'Open a document to evaluate.';
    if (this.editor) {
      fileOpen = true;
    } else {
      fileOpen = false;
    }
    return <React.Fragment>
      <div className='x-header'>
        <span>{title}</span>
        <span className='x-separator' />
        <span className={connected || !connectionsAvailable ? 'disabled' : ''}>Connection:</span>
        <select className="x-select" disabled={connected || !connectionsAvailable}>
          {this.connections(this.documentNode)}
        </select>
        <span className={!fileOpen ? 'disabled' : ''}>Serialization Type:</span>
        <select className="x-select" disabled={!fileOpen}>
          {this.serializationTypess()}
        </select>
        <button className="x-btn" ref={this.elEval} disabled={!fileOpen}><span className="fa fa-play" /> Evaluate</button>
      </div>
      <div className='x-body' ref={this.elBody}></div>
    </React.Fragment>
  }
}