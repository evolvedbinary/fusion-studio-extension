import { Disposable } from "@theia/core";

export const PebbleFiles = Symbol('PebbleFiles');

export interface PebbleFiles extends Disposable {
  test: () => string;
}