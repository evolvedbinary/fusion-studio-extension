export interface PebbleConnection {
  name: string;
  server: string;
  username: string;
  password: string;
  users: string[];
  groups: string[];
}

export interface ServerConnections {
  [key: string]: PebbleConnection;
}

export interface ServerConnectionsChangeEvent {
  id: string;
  action: 'delete' | 'add';
}
