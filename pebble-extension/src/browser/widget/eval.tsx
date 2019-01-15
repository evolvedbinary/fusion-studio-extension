import * as React from 'react';
import { ReactWidget, StatefulWidget } from "@theia/core/lib/browser";
import { inject } from "inversify";
import { PebbleCore } from '../core';

export type PebbleEvalWidgetFactory = () => PebbleEvalWidget;
export const PebbleEvalWidgetFactory = Symbol('PebbleEditorWidgetFactory');

export class PebbleEvalWidget extends ReactWidget implements StatefulWidget {
  constructor(
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
  }

  protected render(): React.ReactNode {
    return <pre>
      XQuery evaluation will show up here.
    </pre>;
  }

  storeState(): object {
    return {};
  }
  
  restoreState(state: object) {}
}