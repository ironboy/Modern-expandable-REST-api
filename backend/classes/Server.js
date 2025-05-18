import path from 'path';
import express from 'express';
import PathFinder from '../helpers/PathFinder.js';
const settings = PathFinder.requireJson('../settings.json');

// check dbType from settings
globalThis.isSQLite = settings.dbType === 'SQLite';
globalThis.isMySQL = settings.dbType === 'MySQL';
globalThis.isSQL = isSQLite || isMySQL;
globalThis.isMongoDB = settings.dbType === 'MongoDB';
if (!isSQLite && !isMySQL && !isMongoDB) {
  throw new Error('Valid dbType not specified');
}

// import the correct version of the rest API
const RestApi =
  (await import(isSQL ? './RestAPiSQL.js' : './RestApiMongoDB.js')).default;

export default class Server {

  settings = settings;

  constructor() {
    this.startServer();
  }

  startServer() {
    // Start an Express server/app
    const { port } = this.settings;
    this.app = express();
    this.app.listen(port, () => console.log(
      'Server listening on http://localhost:' + port
      //'with settings', this.settings
    ));
    // Add rest routes
    new RestApi(this.app, this.settings);
    // Add static folder to serve
    this.addStaticFolder();
  }

  // serve html, js, css, images etc from a static folder
  addStaticFolder() {
    const folder = PathFinder.relToAbs(this.settings.staticFolder);
    this.app.use(express.static(folder));
    // catch all middleware (important for SPA:s - serve index.html if not matching server route)
    /*this.app.get('*', (req, res) => {
      !req.url.includes('.') ?
        res.sendFile(path.join(folder, 'index.html')) :
        res.status(400).json({ error: 'No such route' });
    });*/
  }

}