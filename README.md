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
To compile css file run:
```bash
$ yarn run sass
```
To compile it upon change run:
```bash
$ yarn sass:watch
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