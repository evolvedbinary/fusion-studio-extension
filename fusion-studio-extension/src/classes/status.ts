import { StatusBarEntry } from "@theia/core/lib/browser";

export interface FSStatusEntry extends StatusBarEntry {
  active?: boolean;
}