import * as React from "react";
import { injectable, inject } from "inversify";
import { PebbleCore } from "../core";
import { PebbleNode, PebbleCollectionNode, PebbleConnectionNode, PebbleItemNode } from "../../classes/node";
import { DisposableCollection } from "@theia/core";
import { Disposable } from "vscode-jsonrpc";
import { TreeNode } from "@theia/core/lib/browser";

export const DRAG_NODE = 'pebble-node';

@injectable()
export class DragController {
  protected readonly toCancelNodeExpansion = new DisposableCollection();
  constructor(
    @inject(PebbleCore) private core: PebbleCore,
    // @inject(PebbleViewWidget) private tree: PebbleViewWidget,
  ) {}
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
    this.toCancelNodeExpansion.dispose();
    const container = this.getParentContainer(node as PebbleItemNode);
    if (container) {
      if (PebbleNode.isConnection(container.parent as any)) {
        return;
      }
      this.core.select(container);
    }
  }
  public onDragOver(node: TreeNode | undefined, event: React.DragEvent<HTMLElement>): void {
    if (!node) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
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
    event.dataTransfer.dropEffect = 'copy';
    const container = this.getParentContainer(node as PebbleItemNode);
    if (container) {
      if (PebbleNode.isConnection(container.parent as any)) {
        return;
      }
      const source = this.core.getNode(event.dataTransfer.getData(DRAG_NODE));
      console.group('dragging');
      console.log(source);
      console.log(container);
      console.groupEnd();
      if (source) {
        // this.core.move(source, container);
      } else {
        // this.model.upload(container, event.dataTransfer.items);
      }
    }
  }
}