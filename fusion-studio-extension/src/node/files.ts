import { FSFiles, FSFilenameList } from "../classes/files";
import { injectable } from "inversify";
import { readFileSync, statSync, readdirSync } from "fs";
import { createError, FSError } from "../classes/error";

function getFiles(files: string | string[], result?: string[]): string[] {
  if (!Array.isArray(result)) {
    result = [];
  }
  if (Array.isArray(files)) {
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
    throw createError(FSError.unknown);
  }
}

@injectable()
export class FSFilesClass implements FSFiles {
  dispose() {}
  async read(file: string): Promise<string> {
    return read(file);
  }
  async readMulti(params: { files: string[] }): Promise<FSFilenameList> {
    const result: FSFilenameList = {};
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