import { PebbleFiles, PebbleFilenameList } from "../classes/files";
import { injectable } from "inversify";
import { readFileSync, statSync, readdirSync } from "fs";
import { createError, PebbleError } from "../classes/error";
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

function read(file: string): string {
  try {
    const content = readFileSync(file).toString('binary');
    return content;
  } catch (e) {
    throw createError(PebbleError.unknown);
  }
}

@injectable()
export class PebbleFilesClass implements PebbleFiles {
  dispose() {}
  async read(file: string): Promise<string> {
    return read(file);
  }
  async readMulti(params: { files: string[] }): Promise<PebbleFilenameList> {
    const result: PebbleFilenameList = {};
    params.files.map(file => result[file] = read(file));
    return result;
  }
  async isDir(file: string): Promise<boolean> {
    return statSync(file).isDirectory();
  }
  async getFiles(params: { file: string | string[] }): Promise<string[]> {
    return getFiles(params.file);
  }
}