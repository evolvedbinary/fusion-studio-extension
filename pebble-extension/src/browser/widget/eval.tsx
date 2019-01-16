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
  protected listener: Disposable | undefined;
  protected documentNode: PebbleDocumentNode | undefined;
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

    manager.onActiveEditorChanged(this.editorChanged.bind(this));
    this.editorChanged(manager.activeEditor);
  }

  protected getScrollContainer(): MaybePromise<HTMLElement> {
    console.log(this.elBody.current);
    return this.elBody.current || this.node;
  }

  editorChanged(widget: EditorWidget | undefined) {
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
    if (this.listener) {
      this.listener.dispose();
    }
    this.editor = widget && widget.editor;
    this.listener = this.editor && this.editor.document.onDirtyChanged(() => this.update());
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

  eval() {

  }
  
  protected render(): React.ReactNode {
    return <React.Fragment>
      <div className='x-header'>
        <span className="x-icon fa fa-code" />
        <span className='x-title' ref={this.elTitle}>XQuery Evaluation: </span>
        <span className='x-document'>{this.documentNode ? this.documentNode.name : 'Open a document to evaluate.'}</span>
        <span className='x-label'>Serialization Type</span>
        <select className="x-select">
          {this.serializationTypess()}
        </select>
        <button className="x-btn" ref={this.elEval}><span className="fa fa-play" /> Evaluate</button>
      </div>
      <div className='x-body' ref={this.elBody}></div>
    </React.Fragment>
  }
}