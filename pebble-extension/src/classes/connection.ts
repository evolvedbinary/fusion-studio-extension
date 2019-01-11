import { PebbleGroup, PebbleUser } from "./user";

export interface PebbleConnection {
  name: string;
  server: string;
  username: string;
  password: string;
  users: PebbleUser[];
  groups: PebbleGroup[];
}