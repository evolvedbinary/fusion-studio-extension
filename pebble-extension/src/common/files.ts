import { PebbleConnection } from "../classes/connection";
import URI from "@theia/core/lib/common/uri";

export const pebbleFilesePath = '/services/pebble-files';

export const PebbleFiles = Symbol('PebbleFiles');

export interface PebbleFiles {
  test: () => Promise<string>;
  upload: (connection: PebbleConnection, source: URI, destination: string) => Promise<boolean>;
}
