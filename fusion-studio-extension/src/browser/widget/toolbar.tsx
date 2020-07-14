import * as React from 'react';
import { FSCore } from '../core';
import { FSAction } from '../../classes/action';
import { actConnect } from '../commands';

interface FSToolbarProps {
  core: FSCore;
}

export class FSToolbar extends React.Component<FSToolbarProps, any> {
  protected button(id: string, text:string, icon: string, action: React.MouseEventHandler<any>, color?: string): React.ReactNode;
  protected button(id: string, text:string, icon: string, action: string, color?: string): React.ReactNode;
  protected button(id: string, action: FSAction, color?: string): React.ReactNode;
  protected button(id: string, text:string | FSAction, icon: string = '', action?: string | React.MouseEventHandler<any>, color = ''): React.ReactNode {
    let click: React.MouseEventHandler<any> | undefined;
    if (FSAction.is(text)) {
      action = text.id;
      icon = text.icon || '';
      text = text.contextMenuLabel || text.menuLabel || text.label;
    }
    if (typeof action === 'string') {
      click = () => this.props.core.execute(action as string)
    } else {
      click = action && action.bind(this);
    }
    return <button id={id} className={'fusion-action open-workspace-button theia-button' + (color ? ' color-' + color : '')} title={text} onClick={click}>
      <span className={'fa-fw ' + icon}></span>
    </button>;
  }
  public render() {
    return (
      <div id='fusion-toolbar'>
        <span className="title"><i className="fa fa-plug fa-fw"></i>Servers</span>
        {this.button('fusion-toolbar-button-add', { ...actConnect, icon: 'fa fa-plus'})}
        {/* {this.button('fusion-toolbar-button-delete', 'Remove connection', 'minus', this.deleteConnection, 'red')} */}
      </div>
    );
  }
}