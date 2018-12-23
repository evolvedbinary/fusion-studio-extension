import { Resource, ResourceResolver } from "@theia/core";
import URI from "@theia/core/lib/common/uri";
import { injectable, inject } from "inversify";
import { TextDocumentContentChangeEvent, TextDocument } from "vscode-languageserver-types";
import { PebbleApi } from "../common/api";
import { PebbleDocument } from "../classes/item";
import { PebbleCore, PEBBLE_RESOURCE_SCHEME } from "./core";
import { PebbleDocumentNode, PebbleNode } from "../classes/node";

export const PEBBLE_RESOURCE_SCHEME = 'pebble';

@injectable()
export class PebbleResource implements Resource {

  constructor(readonly uri: URI, protected core?: PebbleCore) {}

  getNode(): PebbleNode {
    if (this.core) {
      const node = this.core.getNode(this.uri.path.toString());
      if (node) {
        return node;
      }
    }
    throw 'Node not found';
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
    const document = this.getDocument();
    if (!document.isNew && document.connection) {
      const result = await PebbleApi.load(document.connection, document.uri) as PebbleDocument;
      return result.content;
    }
    return document.document ? document.document.content : '';
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
    const document = this.getDocument();
    this.core.save(document, content);
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
