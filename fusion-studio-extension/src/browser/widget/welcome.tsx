import * as React from 'react';
import { ReactWidget } from "@theia/core/lib/browser";

export type FSWelcomeWidgetFactory = () => FSWelcomeWidget;
export const FSWelcomeWidgetFactory = Symbol('FSEditorWidgetFactory');

export class FSWelcomeWidget extends ReactWidget {
  constructor(
  ) {
    super();
    this.id = 'fusion-welcome';
    this.title.label = 'Welcome';
    this.title.caption = 'Welcome';
    this.title.iconClass = 'fa fa-home';
    this.title.closable = true;
    this.addClass('fusion-welcome');
    this.update();
  }
  checked = this.restore();

  store(state: any) {
    localStorage.setItem('welcome.show', state);
  }
  
  restore() {
    return !!localStorage.getItem('welcome.show');
  }

  protected render(): React.ReactNode {
    return <React.Fragment>
      <h1><i className="fa fa-plug fa-fw" /> Fusion Studio</h1>
      <p>Welcome to Fusion Studio, an IDE and Management Tool for FusionDB Server.</p>
      <span className="checkbox" onClick={e => {
        this.checked = !this.checked;
        this.store(this.checked ? 'true' : '');
        this.update();
      }}>
        <span className={'checkbox-box' + (this.checked ? ' checked' : '')}>
          <span></span>
        </span>
        <span className="checkbox-label">Show at startup</span>
      </span>
    </React.Fragment>
  }
}
