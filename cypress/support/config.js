// Connection details for the Fusion Studio API
export const apiScheme = "http";
export const apiHost = "localhost";
export const apiPort = Cypress.env('API_PORT');
export const apiUrl = apiScheme + "://" + apiHost +  ":" + apiPort + "/exist/restxq/fusiondb";
export function mkApiUrl(apiService) {
  return apiUrl + apiService;
};
export function mkApiPathUrl(username, dbPath = '') {
  return username + '@' + apiScheme + '://' + apiHost + ':' + apiPort + dbPath;
};

// Connection details for the Fusion Studio Browser App
export const fsScheme = "http";
export const fsHost = "localhost";
export const fsPort = Cypress.env('FS_PORT');
export const fsUrl = fsScheme + "://" + fsHost + ":" + fsPort;
