import * as React from 'react';
import { PebbleCore } from '../core';

interface PebbleToolbarProps {
  core: PebbleCore;
}

export class PebbleToolbar extends React.Component<PebbleToolbarProps, any> {
  public render() {
    return (
      <div id='pebble-toolbar'>
        <span className="title"><i className="fa fa-plug fa-fw"></i>Pebble Connections</span>
        {/* {this.button('pebble-toolbar-button-add', 'Add connection', 'plus', 'pebble.connect')} */}
        {/* {this.button('pebble-toolbar-button-delete', 'Delete connection', 'minus', this.deleteConnection, 'red')} */}
      </div>
    );
  }
}