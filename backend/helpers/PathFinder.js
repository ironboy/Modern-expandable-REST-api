import fs from 'fs';
import path from 'path';
import callsites from 'callsites';

export default class PathFinder {

  // Get the path of the calling function
  static stackPath(depth = 0) {
    return callsites()
      .map(x => x.getFileName())
      .filter(x => !x.endsWith('PathFinder.js'))
      .filter(x => x.startsWith('file:///'))
      .map(x => x.slice(7))[0];
  }

  // Turn a relative file path into an absolute one
  static relToAbs(relativePath) {
    return path.join(this.dirname, relativePath);
  }

  // Equivalent to __filename in .cjs
  // (and to import.meta.filename i .mjs)
  static get filename() {
    return this.stackPath();
  }

  // Equivalent to __dirname in .cjs
  // (and to import.meta.dirname i .mjs)
  static get dirname() {
    return this.filename.replace(/\/[^\/]*$/, '');
  }

  // Equivalent to require('path.json') in .cjs
  static requireJson(relativePath) {
    return JSON.parse(fs.readFileSync(this.relToAbs(relativePath)));
  }

}