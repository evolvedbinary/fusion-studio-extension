import { Resource, ResourceResolver } from "@theia/core";
import URI from "@theia/core/lib/common/uri";
import { injectable } from "inversify";
import { TextDocumentContentChangeEvent } from "vscode-languageserver-types";
import { PebbleApi } from "../common/api";
import { PebbleConnection } from "../common/connection.class";

export const PEBBLE_RESOURCE_SCHEME = 'pebble';

export class PebbleResource implements Resource {

  constructor(readonly uri: URI) { }

  async readContents(options?: { encoding?: string }): Promise<string> {
    const parts = this.uri.path.toString().split(':');
    const id = parts.pop() || '';
    const connection: PebbleConnection = JSON.parse(parts.join(':'));
    const result = await PebbleApi.load(connection.server, id);
    console.log(result);
    return JSON.stringify(result, null, 2);
  }
  async saveContentChanges(changes: TextDocumentContentChangeEvent[], options?: { encoding?: string }): Promise<void> {
    console.group('saving changes...');
    console.log(this.uri);
    console.log(changes);
    console.groupEnd();
  }
  async saveContents(content: string, options?: { encoding?: string }): Promise<void> {
    console.group('saving...');
    console.log(this.uri);
    console.log(content);
    console.groupEnd();
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
