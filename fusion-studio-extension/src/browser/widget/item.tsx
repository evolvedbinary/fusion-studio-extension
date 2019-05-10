import * as React from 'react';
import { FSNode } from '../../classes/node';
import { FSCore } from '../core';

interface FSItemProps {
  node: FSNode;
  core: FSCore;
  tooltip?: string;
}

export class FSItem extends React.Component<FSItemProps, any> {
  public render() {
    const { node, core } = this.props;
    if (FSNode.isConnection(node)) {
      return (
        <div className='fusion-item fusion-item-connection' title={(node.connection.username || '(guest)') + '@' + node.connection.server}>
          <i className={core.getIcon(node)}></i>
          <span className='name'>{node.connection.name}</span>
        </div>
      );
    }
    if (FSNode.is(node)) {
      return (
        <div className={'fusion-item fusion-item-' + (FSNode.isCollection(node) ? 'collection' : 'document') + (FSNode.isDocument(node) && node.isNew ? ' fusion-item-new' : '')} title={this.props.tooltip || ''}>
          <i className={core.getIcon(node)}></i>
          <span className='name'>{node.name}</span>
        </div>
      );
    }
  }
}