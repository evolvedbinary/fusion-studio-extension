import { injectable } from "inversify";
import { PebbleNode } from "../classes/node";
import { TreeModel } from "@theia/core/lib/browser";

@injectable()
export class PebbleCore {
  private _selected?: PebbleNode;
  public set selected(node: PebbleNode | undefined) {
    this._selected = node;
  }
  public get selected(): PebbleNode | undefined {
    return this._selected;
  }
  
  private _model?: TreeModel;
  public set model(node: TreeModel | undefined) {
    this._model = node;
  }
  public get model(): TreeModel | undefined {
    return this._model;
  }
}