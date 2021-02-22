import * as React from 'react';
import { ReactWidget } from "@theia/core/lib/browser";

export type FSWelcomeWidgetFactory = () => FSWelcomeWidget;
export const FSWelcomeWidgetFactory = Symbol('FSEditorWidgetFactory');

export class FSWelcomeWidget extends ReactWidget {
  checked = this.restore();
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

  store(state: boolean) {
    if (state === this.checked) {
      return;
    }
    this.checked = state;
    localStorage.setItem('welcome.show', state ? 'true' : 'false');
    this.update();
  }
  
  restore() {
    return localStorage.getItem('welcome.show') !== 'false';
  }

  protected render(): React.ReactNode {
    return <React.Fragment>
      <h1 className="fusion-header"> <i className="fusion-logo"></i> Fusion Studio</h1>
      <p>Welcome to Fusion Studio, an IDE and Management Tool for FusionDB Server.</p>
      <br/>
      <ul>
        <li><p>For more information about FusionDB, visit <a href="https://www.fusiondb.com">https://www.fusiondb.com</a>.</p></li>
        <li><p>For the Fusion Studio source code, visit <a href="https://github.com/evolvedbinary/fusion-studio">https://github.com/evolvedbinary/fusion-studio</a>.</p></li>
      </ul>
      <span className="checkbox" onClick={e => this.store(!this.checked)}>
        <span className={'checkbox-box' + (this.checked ? ' checked' : '')}>
          <span></span>
        </span>ls
        <span className="checkbox-label">Show at startup</span>
      </span>
    </React.Fragment>
  }
}
