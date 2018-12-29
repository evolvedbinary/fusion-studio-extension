export const pebbleFilesePath = '/services/pebble-files';

export const PebbleFiles = Symbol('PebbleFiles');
export interface PebbleFilesList {
  [key: string]: string;
}

export interface PebbleFiles {
  read: (file: string) => Promise<string>;
  isDir: (file: string) => Promise<boolean>;
  getFiles: (params: { file: string | string[] }) => Promise<string[]>;
  readMulti: (files: string[]) => Promise<PebbleFilesList>;
}
