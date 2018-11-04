# pebble-extension
Pebble's extension for Theia IDE
## Getting started:
### Requirements:
* [Yarn](https://yarnpkg.com/lang/en/docs/install/#install-via-chocolatey)
* [Node 8](https://nodejs.org/dist/v8.11.4/) (it should be install it with Yarn)
### Install:
Clone the repo, and build the source:
```bash
$ git clone https://github.com/ccheraa/pebble-extension.git
$ cd pebble-extension
$ yarn
```
The build will fail with the next Error:
```
ERROR in ../pebble-extension/src/style/index.scss 1:0
Module parse failed: Unexpected token (1:0)
You may need an appropriate loader to handle this file type.
> .pebble-view {
|   .ReactVirtualized__Grid__innerScrollContainer[role=rowgroup] {
|     > div:first-child {
 @ ../pebble-extension/lib/browser/frontend-module.js 25:0-37
 @ ./src-gen/frontend/index.js
```
Because this project uses SASS, unlike the default Theia extensions which only supports CSS, to fix this you need to patch its default Webpack configuration file:
```bash
$ yarn run sass
```
### Build & run
Build the extension:
```bash
$ cd pebble-extension
$ yarn watch
```
#### Test on the browser
* Build the IDE:
```bash
$ cd browser-app
$ yarn watch
```
* Start the IDE:
```bash
$ cd browser-app
$ yarn start
```
#### Test on desktop
* Build the IDE:
```bash
$ cd electron-app
$ yarn watch
```
* Start the IDE:
```bash
$ cd electron-app
$ yarn start
```