import * as React from 'react';
import { PebbleCore } from '../core';

interface PebbleHomeProps {
  core: PebbleCore;
}

export class PebbleHome extends React.Component<PebbleHomeProps, any> {
  public render() {
    return (
      <div id="pebble-home" className='theia-navigator-container'>
        <div className="title">
          <p><i className="fa fa-plug fa-fw fa-5x" /></p>
          <p>Servers</p>
        </div>
        <div className="description">
          <p>No connections available yet.</p>
          <p>To start add a new connection.</p>
        </div>
        <div className='open-workspace-button-container'>
          <button className='open-workspace-button' title='Connect to a database' onClick={() => this.props.core.execute('connect')}><i className="fa fa-plus fa-fw" /> New connection</button>
        </div>
      </div>
    );
  }
}