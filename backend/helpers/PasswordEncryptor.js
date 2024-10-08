import bcrypt from 'bcryptjs';
import PathFinder from './PathFinder.js';

export default class PasswordEncryptor {

  static settings = PathFinder.requireJson('../settings.json');

  // Encrypt all properties in an object that have names equivalent
  // to the names in settings.json -> passwordFieldNames
  static async encrypt(object) {
    let { bcryptRounds: rounds, passwordFieldNames } = this.settings;
    for (let key in object) {
      if (!passwordFieldNames.includes(key)) { continue; }
      let value = object[key] + '';
      object[key] = await new Promise(resolve =>
        bcrypt.hash(value, rounds, (_error, hash) => resolve(hash))
      );
    }
  }

  // Check if a (unencrypted) password matches an encrypted one
  static async check(unencrypted, encrypted) {
    return await new Promise(resolve =>
      bcrypt.compare(unencrypted, encrypted, (_error, result) => resolve(result))
    );
  }

}