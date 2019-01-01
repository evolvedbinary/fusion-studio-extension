export const pebbleFilesePath = '/services/pebble-files';

export const PebbleFiles = Symbol('PebbleFiles');
export interface PebbleFilesList {
  [key: string]: string;
}
export interface PebbleFilesBlobsList {
  [key: string]: Blob;
}

export interface PebbleFiles {
  read: (file: string) => Promise<string>;
  isDir: (file: string) => Promise<boolean>;
  getFiles: (params: { file: string | string[] }) => Promise<string[]>;
  readMulti: (params: { files: string[] }) => Promise<PebbleFilesList>;
}
