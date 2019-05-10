export interface FSRestFunction {
  name: string;
  src: string;
}

export interface FSRestMethod {
  name: string;
  function: FSRestFunction;
}

export interface FSRestURI {
  uri: string;
  methods: FSRestMethod[];
}
