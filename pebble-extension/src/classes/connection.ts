export interface FSServerConnection {
  name: string;
  server: string;
  username: string;
  password: string;
  users: string[];
  groups: string[];
}

export interface FSServerConnections {
  [key: string]: FSServerConnection;
}

export interface FSServerConnectionsChangeEvent {
  id: string;
  action: 'delete' | 'add';
}
