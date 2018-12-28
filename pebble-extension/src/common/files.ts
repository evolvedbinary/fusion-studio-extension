export const pebbleFilesePath = '/services/pebble-files';

export const PebbleFiles = Symbol('PebbleFiles');

export interface PebbleFiles {
  read: (file: string) => Promise<string>;
}
