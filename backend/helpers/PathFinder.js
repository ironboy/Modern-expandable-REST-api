import fs from 'fs';
import path from 'path';
import callsites from 'callsites';
import url from 'url';

export default class PathFinder {

  // Get the path of the calling function
  static stackPath(depth = 0) {
    let p = callsites()
      .map(x => x.getFileName())
      .filter(x => !x.endsWith('PathFinder.js'))
      .filter(x => x.includes('file://'))[0]
      .split('file://')[1]
    return p[2] === ':' ? p.slice(1) : p;
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
    return this.filename.replace(/\/[^\/]*$/, "").replaceAll("%20", " ");
  }

  // Equivalent to require('path.json') in .cjs
  static requireJson(relativePath) {
    return JSON.parse(fs.readFileSync(this.relToAbs(relativePath)));
  }

}
