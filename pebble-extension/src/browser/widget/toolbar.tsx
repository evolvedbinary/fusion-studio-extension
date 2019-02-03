import * as React from 'react';
import { PebbleCore } from '../core';
import { PebbleAction } from '../../classes/action';
import { actConnect } from '../commands';

interface PebbleToolbarProps {
  core: PebbleCore;
}

export class PebbleToolbar extends React.Component<PebbleToolbarProps, any> {
  protected button(id: string, text:string, icon: string, action: React.MouseEventHandler<any>, color?: string): React.ReactNode;
  protected button(id: string, text:string, icon: string, action: string, color?: string): React.ReactNode;
  protected button(id: string, action: PebbleAction, color?: string): React.ReactNode;
  protected button(id: string, text:string | PebbleAction, icon: string = '', action?: string | React.MouseEventHandler<any>, color = ''): React.ReactNode {
    let click: React.MouseEventHandler<any> | undefined;
    if (PebbleAction.is(text)) {
      action = text.id;
      icon = text.icon || '';
      text = text.contextMenuLabel || text.menuLabel || text.label;
    }
    if (typeof action === 'string') {
      click = () => this.props.core.execute(action as string)
    } else {
      click = action && action.bind(this);
    }
    return <button id={id} className={'pebble-action' + (color ? ' color-' + color : '')} title={text} onClick={click}>
      <span className={'fa-fw ' + icon}></span>
    </button>;
  }
  public render() {
    return (
      <div id='pebble-toolbar'>
        <span className="title"><i className="fa fa-plug fa-fw"></i>Servers</span>
        {this.button('pebble-toolbar-button-add', actConnect)}
        {/* {this.button('pebble-toolbar-button-delete', 'Delete connection', 'minus', this.deleteConnection, 'red')} */}
      </div>
    );
  }
}