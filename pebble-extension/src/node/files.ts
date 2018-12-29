import { PebbleFiles, PebbleFilesList } from "../common/files";
import { injectable } from "inversify";
import { readFileSync, statSync, readdirSync } from "fs";
import { createError, Error } from "../common/error";
import { isArray } from "util";

function getFiles(files: string | string[], result?: string[]): string[] {
  if (!isArray(result)) {
    result = [];
  }
  if (isArray(files)) {
    files.forEach(async file => result = getFiles(file, result));
  } else {
    if (statSync(files).isDirectory()) {
      readdirSync(files)
        .filter(file => (file !== '.') && (file !== '..'))
        .forEach(async file => result = getFiles(files + '/' + file, result));
    } else {
      if(result.indexOf(files) < 0) {
        result.push(files);
      }
    }
  }
  return result;
}

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
  async readMulti(files: string[]): Promise<PebbleFilesList> {
    const result: PebbleFilesList = {};
    await files.map(async file => result[file] = await this.read(file));
    return result;
  }
  async isDir(file: string): Promise<boolean> {
    return statSync(file).isDirectory();
  }
  async getFiles(params: { file: string | string[] }): Promise<string[]> {
    return getFiles(params.file);
  }
}