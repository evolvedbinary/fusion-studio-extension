export interface PebbleRestFunction {
  name: string;
  src: string;
}

export interface PebbleRestMethod {
  name: string;
  function: PebbleRestFunction;
}

export interface PebbleRestURI {
  uri: string;
  methods: PebbleRestMethod[];
}
