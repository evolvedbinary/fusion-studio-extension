import { Resource, ResourceResolver } from "@theia/core";
import URI from "@theia/core/lib/common/uri";
import { injectable, inject } from "inversify";
import { TextDocumentContentChangeEvent, TextDocument } from "vscode-languageserver-types";
import { PebbleApi } from "../common/api";
import { PebbleDocument } from "../classes/item";
import { PebbleCore, PEBBLE_RESOURCE_SCHEME } from "./core";
import { PebbleDocumentNode, PebbleNode, PebbleConnectionNode } from "../classes/node";
import { createError, PebbleError, ErrorObject } from '../classes/error';

@injectable()
export class PebbleResource implements Resource {

  constructor(readonly uri: URI, protected core?: PebbleCore) {}

  getConnectionNode(id: string): PebbleConnectionNode {
    if (this.core) {
      const node = this.core.getNode(id);
      if (PebbleNode.isConnection(node)) {
        return node;
      }
    }
    throw createError(PebbleError.nodeNotFound);
  }
  getNode(): PebbleNode {
    if (this.core) {
      const node = this.core.getNode(this.uri.path.toString());
      if (node) {
        return node;
      }
    }
    throw createError(PebbleError.nodeNotFound);
  }
  getDocument(): PebbleDocumentNode {
    return this.getNode() as PebbleDocumentNode;
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
        const result = await PebbleApi.load(document.connectionNode.connection, document.uri) as PebbleDocument;
        document.document = result;
        return result.content;
      }
      return document.document ? document.document.content : '';
    } catch (e) {
      if (ErrorObject.is(e) && e.code === PebbleError.nodeNotFound) {
        const match = this.uri.path.toString().match(/([^@]+@.*)(\/db\/.*)/);
        if (match) {
          const connectionNode = this.getConnectionNode(match[1]);
          const uri = match[2];
          const result = await PebbleApi.load(connectionNode.connection, uri) as PebbleDocument;
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
      if (ErrorObject.is(e) && e.code === PebbleError.nodeNotFound) {
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
export class PebbleResourceResolver implements ResourceResolver {

  @inject(PebbleCore) protected core?: PebbleCore;

  constructor(
  ) { }

  resolve(uri: URI): Resource | Promise<Resource> {
    if (uri.scheme !== PEBBLE_RESOURCE_SCHEME) {
    throw new Error(`Expected a URI with ${PEBBLE_RESOURCE_SCHEME} scheme. Was: ${uri}.`);
    }
    return this.getResource(uri);
  }

  async getResource(uri: URI): Promise<PebbleResource> {
    return new PebbleResource(uri, this.core);
  }
}
