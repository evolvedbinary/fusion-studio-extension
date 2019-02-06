import { Resource, ResourceResolver } from "@theia/core";
import URI from "@theia/core/lib/common/uri";
import { injectable, inject } from "inversify";
import { TextDocumentContentChangeEvent, TextDocument } from "vscode-languageserver-types";
import { FSApi } from "../common/api";
import { FSDocument } from "../classes/item";
import { FSCore, FS_RESOURCE_SCHEME } from "./core";
import { FSDocumentNode, FSNode, FSConnectionNode } from "../classes/node";
import { createError, FSError, FSErrorObject } from '../classes/error';

@injectable()
export class FSResource implements Resource {

  constructor(readonly uri: URI, protected core?: FSCore) {}

  getConnectionNode(id: string): FSConnectionNode {
    if (this.core) {
      const node = this.core.getNode(id);
      if (FSNode.isConnection(node)) {
        return node;
      }
    }
    throw createError(FSError.nodeNotFound);
  }
  getNode(): FSNode {
    if (this.core) {
      const node = this.core.getNode(this.uri.path.toString());
      if (node) {
        return node;
      }
    }
    throw createError(FSError.nodeNotFound);
  }
  getDocument(): FSDocumentNode {
    return this.getNode() as FSDocumentNode;
  }

  protected applyChanges(content: string, contentChanges: TextDocumentContentChangeEvent[]): string {
    let document = TextDocument.create('', '', 1, content);
    for (const change of contentChanges) {
      let newContent = change.text;
      if (change.range) {
        const start = document.offsetAt(change.range.start);
        const end = document.offsetAt(change.range.end);
        newContent = document.getText().substr(0, start) + change.text + document.getText().substr(end);
      }
      document = TextDocument.create(document.uri, document.languageId, document.version, newContent);
    }
    return document.getText();
  }

  async readContents(options?: { encoding?: string }): Promise<string> {
    try {
      const document = this.getDocument();
      if (!document.isNew && document.connectionNode) {
        const result = await FSApi.load(document.connectionNode.connection, document.uri) as FSDocument;
        document.document = result;
        return result.content;
      }
      return document.document ? document.document.content : '';
    } catch (e) {
      if (FSErrorObject.is(e) && e.code === FSError.nodeNotFound) {
        const match = this.uri.path.toString().match(/([^@]+@.*)(\/db\/.*)/);
        if (match) {
          const connectionNode = this.getConnectionNode(match[1]);
          const uri = match[2];
          const result = await FSApi.load(connectionNode.connection, uri) as FSDocument;
          return result.content;
        }
        throw createError(0);
      } else {
        throw createError(e);
      }
    }
  }
  async saveContentChanges(changes: TextDocumentContentChangeEvent[], options?: { encoding?: string }): Promise<void> {
    const content = await this.readContents(options);
    const newContent = this.applyChanges(content, changes);
    if (newContent !== content) {
      this.saveContents(newContent, options);
    }
  }
  async saveContents(content: string, options?: { encoding?: string }): Promise<void> {
    if (!this.core) {
      return;
    }
    try {
      const document = this.getDocument();
      this.core.save(document, content);
    } catch (e) {
      if (FSErrorObject.is(e) && e.code === FSError.nodeNotFound) {
        const match = this.uri.path.toString().match(/([^@]+@.*)(\/db\/.*)/);
        if (match) {
          const connectionNode = this.getConnectionNode(match[1]);
          const uri = match[2];
          await this.core.saveByUri(uri, connectionNode.connection, content);
        }
        throw createError(0);
      } else {
        throw createError(e);
      }
    }
  }

  dispose(): void { }
}

@injectable()
export class FSResourceResolver implements ResourceResolver {

  @inject(FSCore) protected core?: FSCore;

  constructor(
  ) { }

  resolve(uri: URI): Resource | Promise<Resource> {
    if (uri.scheme !== FS_RESOURCE_SCHEME) {
    throw new Error(`Expected a URI with ${FS_RESOURCE_SCHEME} scheme. Was: ${uri}.`);
    }
    return this.getResource(uri);
  }

  async getResource(uri: URI): Promise<FSResource> {
    return new FSResource(uri, this.core);
  }
}
