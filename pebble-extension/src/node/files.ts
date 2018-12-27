import { PebbleFiles } from "../common/files";
import { injectable } from "inversify";
import URI from "@theia/core/lib/common/uri";
import { PebbleApi } from "../common/api";
import { PebbleConnection } from "../classes/connection";
import { readFileSync } from "fs";

@injectable()
export class PebbleFilesClass implements PebbleFiles {
  dispose() {}
  async test() {
    return 'FILES';
  }
  async upload(connection: PebbleConnection, source: URI, destination: string): Promise<boolean> {
    console.log('uploading (backend):', source.path.toString());
    const content = readFileSync(source.path.toString());
    return await PebbleApi.save(connection, destination, content as any);
    return true;
  }
}