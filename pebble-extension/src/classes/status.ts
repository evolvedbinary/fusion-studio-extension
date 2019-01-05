import { StatusBarEntry } from "@theia/core/lib/browser";

export interface PebbleStatusEntry extends StatusBarEntry {
  active?: boolean;
}