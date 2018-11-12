import { Resource, ResourceResolver } from "@theia/core";
import URI from "@theia/core/lib/common/uri";
import { injectable } from "inversify";
import { TextDocumentContentChangeEvent, TextDocument } from "vscode-languageserver-types";
import { PebbleApi } from "../common/api";
import { PebbleConnection } from "../classes/connection";
import { PebbleDocument } from "../classes/item";

export const PEBBLE_RESOURCE_SCHEME = 'pebble';

export class PebbleResource implements Resource {

  constructor(readonly uri: URI) { }

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
    const parts = this.uri.path.toString().split(':');
    const id = parts.pop() || '';
    const connection: PebbleConnection = JSON.parse(parts.join(':'));
    if ((connection as any).isNew) {
      return '';
    }
    const result = await PebbleApi.load(connection, id) as PebbleDocument;
    console.log(result);
    return result.content;
  }
  async saveContentChanges(changes: TextDocumentContentChangeEvent[], options?: { encoding?: string }): Promise<void> {
    const content = await this.readContents(options);
    console.group('saving changes...');
    const newContent = this.applyChanges(content, changes);
    if (newContent !== content) {
      this.saveContents(newContent, options);
    }
  }
  async saveContents(content: string, options?: { encoding?: string }): Promise<void> {
    console.group('saving...');
    console.log(this.uri);
    console.log(content);
    console.groupEnd();

    const parts = this.uri.path.toString().split(':');
    const id = parts.pop() || '';
    const connection: PebbleConnection = JSON.parse(parts.join(':'));
    const result = await PebbleApi.save(connection, id, content);
    console.log(result);
  }

  dispose(): void { }
}

@injectable()
export class PebbleResourceResolver implements ResourceResolver {

  constructor(
  ) { }

  resolve(uri: URI): Resource | Promise<Resource> {
    if (uri.scheme !== PEBBLE_RESOURCE_SCHEME) {
    throw new Error(`Expected a URI with ${PEBBLE_RESOURCE_SCHEME} scheme. Was: ${uri}.`);
    }
    return this.getResource(uri);
  }

  async getResource(uri: URI): Promise<PebbleResource> {
    return new PebbleResource(uri);
  }
}
