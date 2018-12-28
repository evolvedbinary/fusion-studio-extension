import { PebbleFiles } from "../common/files";
import { injectable } from "inversify";
import { readFileSync } from "fs";
import { createError, Error } from "../common/error";

@injectable()
export class PebbleFilesClass implements PebbleFiles {
  dispose() {}
  async read(file: string): Promise<string> {
    try {
      const content = readFileSync(file).toString('binary');
      return content;
    } catch (e) {
      throw createError(Error.unknown);
    }
  }
}