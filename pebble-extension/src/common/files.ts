export const pebbleFilesePath = '/services/pebble-files';

export const PebbleFiles = Symbol('PebbleFiles');
export interface PebbleFilenameList {
  [key: string]: string;
}
export interface PebbleFileList {
  [key: string]: Blob;
}
export interface PebbleFileEntryList {
  [key: string]: File | WebKitFileEntry;
}

export interface PebbleFiles {
  read: (file: string) => Promise<string>;
  isDir: (file: string) => Promise<boolean>;
  getFiles: (params: { file: string | string[] }) => Promise<string[]>;
  readMulti: (params: { files: string[] }) => Promise<PebbleFilenameList>;
}
