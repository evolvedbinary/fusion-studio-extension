export interface PebbleConnection {
  name: string;
  server: string;
  username: string;
  password: string;
  users: string[];
  groups: string[];
}

export interface PebbleConnections {
  [key: string]: PebbleConnection;
}

export interface PebbleConnectionsChangeEvent {
  id: string;
  action: 'delete' | 'add';
}
