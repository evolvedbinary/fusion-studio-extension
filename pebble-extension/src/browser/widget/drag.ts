import * as React from "react";
import { injectable, inject } from "inversify";
import { PebbleCore } from "../core";
import { PebbleNode, PebbleCollectionNode, PebbleConnectionNode, PebbleItemNode } from "../../classes/node";
import { DisposableCollection } from "@theia/core";
import { Disposable } from "vscode-jsonrpc";
import { TreeNode } from "@theia/core/lib/browser";
import { PebbleFileList } from "../../common/files";

export interface PebbleDragOperation {
  destinationContainer: PebbleCollectionNode;
  destination: string[];
  source: PebbleItemNode[];
  event: React.DragEvent<HTMLElement>;
  copy: boolean;
}

export const DRAG_NODE = 'pebble-node';

@injectable()
export class DragController {
  protected readonly toCancelNodeExpansion = new DisposableCollection();
  protected dragged: PebbleItemNode[] = [];
  protected draggedIDs: string[] = [];
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
    if (destinationContainer && PebbleNode.isCollection(destinationContainer)) {
      const data = event.dataTransfer.getData(DRAG_NODE);
      const ids: string[] = data ? JSON.parse(data) : this.draggedIDs;
      const source = ids.map(id => this.core.getNode(id)).filter(node => PebbleNode.isItem(node)) as PebbleItemNode[];
      if (!this.core.canMoveTo(source, destinationContainer.uri)) {
        return;
      }
      const destination = ids.map(id => destinationContainer.uri + '/' + id.split('/').pop());
      const result: PebbleDragOperation = {
        source,
        destination,
        destinationContainer,
        event,
        copy: event.dataTransfer.dropEffect === 'copy',
      };
      return result;
    }
  }
  private getParentContainer(node: PebbleItemNode | PebbleConnectionNode): PebbleCollectionNode | undefined {
    let container = node;
    while (container && !PebbleNode.isCollection(container)) {
      container = container.parent as PebbleCollectionNode;
    }
    return container;
  }

  public onDragStart(node: TreeNode, event: React.DragEvent<HTMLElement>): void {
    event.stopPropagation();
    if (!PebbleNode.is(node)) {
      return;
    }
    let nodes = this.core.topNodes(this.core.selection);
    if (nodes.indexOf(node as PebbleItemNode) < 0) {
      nodes = [node as PebbleItemNode];
    }
    if (nodes.length > 0) {
      this.dragged = nodes;
      this.draggedIDs = nodes.map(node => node.id);
      event.dataTransfer.setData(DRAG_NODE, JSON.stringify(this.draggedIDs));
    } else {
      this.dragged = [];
      this.draggedIDs = [];
      event.dataTransfer.setData(DRAG_NODE, '[]');
    }
  }
  public onDragEnter(node: TreeNode | undefined, event: React.DragEvent<HTMLElement>): void {
    if (!node) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    this.dragOperation(event);
    this.toCancelNodeExpansion.dispose();
    const operation = this.checkOperation(node, event);
    if (operation) {
      this.core.select(operation.destinationContainer);
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
  public async listFiles(list: WebKitEntry[]): Promise<PebbleFileList> {
    const files: PebbleFileList = {};
    await Promise.all(list.map(entry => this.listFile(entry, files)));
    return files;
  }
  public async getFile(item: WebKitFileEntry): Promise<File> {
    return new Promise<any>(resolve => (item as WebKitFileEntry).file(f => resolve(f)));
  }
  public async listFile(item: WebKitEntry, files: PebbleFileList): Promise<any> {
    if (item.isDirectory) {
      const reader = (item as WebKitDirectoryEntry).createReader();
      const entries = await new Promise<WebKitEntry[]>(resolve => reader.readEntries(entries => resolve(entries)));
      await Promise.all(entries.map(entry => this.listFile(entry, files)));
    } else {
      let path = item.fullPath;
      if (path[0] === '/') {
        path = path.substr(1);
      }
      files[path] = await this.getFile(item as WebKitFileEntry);
    }
    return Promise.resolve;
  }
  public onDrop(node: TreeNode | undefined, event: React.DragEvent<HTMLElement>): void {
    if (!node) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.dragOperation(event);
    const operation = this.checkOperation(node, event);
    if (operation) {
      if (event.dataTransfer.files.length) {
        const entries: WebKitEntry[] = [];
        for (let i = 0; i < event.dataTransfer.items.length; i++) {
          const entry = event.dataTransfer.items[i].webkitGetAsEntry();
          if (entry) {
            entries.push(entry);
          }
        }
        this.listFiles(entries).then(files => this.core.saveDocuments(operation.destinationContainer, files));
      } else {
        this.core.move(operation);
      }
    }
  }
}