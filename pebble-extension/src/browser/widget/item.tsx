import * as React from 'react';
import { PebbleNode } from '../../classes/node';
import { PebbleCore } from '../core';

interface PebbleItemProps {
  node: PebbleNode;
  core: PebbleCore;
}

export class PebbleItem extends React.Component<PebbleItemProps, any> {
  public render() {
    const { node, core } = this.props;
    if (PebbleNode.isConnection(node)) {
      return (
        <div className='pebble-item pebble-item-connection' title={(node.connection.username || '(guest)') + '@' + node.connection.server}>
          <i className={core.getIcon(node)}></i>
          <span className='name'>{node.connection.name}</span>
        </div>
      );
    }
    if (PebbleNode.isItem(node)) {
      return (
        <div className={'pebble-item pebble-item-' + (node.collection ? 'collection' : 'document') + (PebbleNode.isDocument(node) && node.isNew ? ' pebble-item-new' : '')}>
          <i className={core.getIcon(node)}></i>
          <span className='name'>{node.name}</span>
        </div>
      );
    }
  }
}