export const FSFilesePath = '/services/fusion-files';

export const FSFiles = Symbol('FusionFiles');
export interface FSFilenameList {
  [key: string]: string;
}
export interface FSFileList {
  [key: string]: Blob;
}
export interface FSFileEntryList {
  [key: string]: File | WebKitFileEntry;
}

export interface FSFiles {
  read: (file: string) => Promise<string>;
  isDir: (file: string) => Promise<boolean>;
  getFiles: (params: { file: string | string[] }) => Promise<string[]>;
  readMulti: (params: { files: string[] }) => Promise<FSFilenameList>;
}
