import * as React from 'react';
import { ReactWidget, StatefulWidget } from "@theia/core/lib/browser";
import { inject } from "inversify";
import { PebbleCore } from '../core';
import { EditorManager } from '@theia/editor/lib/browser';
import { PebbleDocumentNode, PebbleNode } from '../../classes/node';

export type PebbleEvalWidgetFactory = () => PebbleEvalWidget;
export const PebbleEvalWidgetFactory = Symbol('PebbleEditorWidgetFactory');

export class PebbleEvalWidget extends ReactWidget implements StatefulWidget {
  protected documentNode: PebbleDocumentNode | undefined;
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
    this.update();

    manager.onActiveEditorChanged(e => {
      if (e) {
        const node = this.core.getNode(e.editor.uri.path.toString());
        if (PebbleNode.isDocument(node)) {
          this.changeTo(node);
        }
      }
    });
  }

  changeTo(node: PebbleDocumentNode) {
    this.documentNode = node;
    this.update();
  }

  storeState(): object {
    return {};
  }
  
  restoreState(state: object) {}

  protected render(): React.ReactNode {
    if (this.documentNode) {
      return <pre>Displaying: <strong>{this.documentNode.uri}</strong></pre>;
    } else {
      return <pre>
        XQuery evaluation will show up here.
      </pre>;
    }
  }
}