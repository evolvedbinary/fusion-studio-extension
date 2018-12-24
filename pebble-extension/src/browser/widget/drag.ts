import * as React from "react";
import { injectable, inject } from "inversify";
import { PebbleCore } from "../core";
import { PebbleNode, PebbleCollectionNode, PebbleConnectionNode, PebbleItemNode } from "../../classes/node";
import { DisposableCollection } from "@theia/core";
import { Disposable } from "vscode-jsonrpc";
import { TreeNode } from "@theia/core/lib/browser";

export interface PebbleDragOperation {
  destinationContainer: PebbleCollectionNode;
  sourceContainer?: PebbleCollectionNode;
  destination: string;
  source?: PebbleItemNode;
  event: React.DragEvent<HTMLElement>;
}

export const DRAG_NODE = 'pebble-node';

@injectable()
export class DragController {
  protected readonly toCancelNodeExpansion = new DisposableCollection();
  constructor(
    @inject(PebbleCore) private core: PebbleCore,
    // @inject(PebbleViewWidget) private tree: PebbleViewWidget,
  ) {}

  private dragOperation(event: React.DragEvent<HTMLElement>): void {
    event.dataTransfer.dropEffect = event.ctrlKey ? 'copy' : 'move';
  }

  private checkOperation(node: TreeNode | undefined, event: React.DragEvent<HTMLElement>): PebbleDragOperation | undefined {
    event.dataTransfer.dropEffect = event.ctrlKey ? 'copy' : 'move';
    const destinationContainer = this.getParentContainer(node as PebbleItemNode);
    if (destinationContainer && PebbleNode.isItem(destinationContainer)) {
      const source = this.core.getNode(event.dataTransfer.getData(DRAG_NODE)) as PebbleItemNode;
      let sourceContainer: PebbleCollectionNode | undefined;
      let destination = '';
      if (source) {
        sourceContainer = source.parent as PebbleCollectionNode;
        if (destinationContainer.uri.indexOf(source.uri) === 0 || (source.parent && (destinationContainer.id === source.parent.id))) {
          return;
        }
        destination = source ? destinationContainer.uri + '/' + source.name : '';
      }
      const result: PebbleDragOperation = {
        source,
        destination,
        sourceContainer,
        destinationContainer,
        event,
      };
      return result;
    }
  }
  private getParentContainer(node: PebbleItemNode | PebbleConnectionNode): PebbleCollectionNode | undefined {
    let container = node;
    while (container) {
      if (PebbleNode.isCollection(container)) {
        break;
      }
      container = container.parent as PebbleCollectionNode;
    }
    return container;
  }

  public onDragStart(node: TreeNode, event: React.DragEvent<HTMLElement>): void {
    event.stopPropagation();
    if (!PebbleNode.is(node)) {
      return;
    }
    event.dataTransfer.setData(DRAG_NODE, node.id);
  }
  public onDragEnter(node: TreeNode | undefined, event: React.DragEvent<HTMLElement>): void {
    if (!node) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    this.dragOperation(event);
    this.toCancelNodeExpansion.dispose();
    const container = this.checkOperation(node, event);
    if (container) {
      this.core.select(container.destinationContainer);
    }
  }
  public onDragOver(node: TreeNode | undefined, event: React.DragEvent<HTMLElement>): void {
    if (!node) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    this.dragOperation(event);
    if (!this.toCancelNodeExpansion.disposed) {
      return;
    }
    const timer = setTimeout(() => {
      if ((PebbleNode.isCollection(node) || PebbleNode.isConnection(node)) && !node.expanded) {
          this.core.expand(node);
      }
    }, 500);
    this.toCancelNodeExpansion.push(Disposable.create(() => clearTimeout(timer)));
  }
  public onDragLeave(node: TreeNode | undefined, event: React.DragEvent<HTMLElement>): void {
    event.preventDefault();
    event.stopPropagation();
    this.toCancelNodeExpansion.dispose();
  }
  public onDrop(node: TreeNode | undefined, event: React.DragEvent<HTMLElement>): void {
    if (!node) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.dragOperation(event);
    const container = this.checkOperation(node, event);
    if (container) {
      this.core.move(container);
    }
  }
}