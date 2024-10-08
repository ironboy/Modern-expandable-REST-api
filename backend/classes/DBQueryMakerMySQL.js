import mysql from 'mysql2/promise';
import PathFinder from '../helpers/PathFinder.js';
import PasswordEncryptor from '../helpers/PasswordEncryptor.js';
import numericValuesToNumbers from '../helpers/numericValuesToNumbers.js';

// Get settings for connection
const { dbHost: host, dbPort: port, dbUser: user, dbPassword: password, dbDatabase: database }
  = PathFinder.requireJson('../settings.json');
// Connect to the database
const connection = host && await mysql.createPool({
  host, port, user, password, database,
  namedPlaceholders: true
});

export default class DBQueryMaker {

  log = true; // debug log all queries to the db

  // Create a db connection (if not existing already)
  constructor() {
    this.db = connection;
  }

  // Make a query to the database, as a prepared statement and
  // run it using .all() if a select statement, otherwise using .run()
  // (async not really needed for the better-sqlite driver
  // but used a reminder that we'll need it for other drivers)
  // Note: The method and route arguments are only used for logging.
  async query(method, route, sql, parameters = {}) {
    sql = sql.trim().replace(/\s{1,}/g, ' ');
    parameters = numericValuesToNumbers(parameters);
    // encrypt all passwords amongst the parameters
    await PasswordEncryptor.encrypt(parameters);
    // try to make the query
    let result;
    try {
      result = (await this.db.execute(sql, parameters))[0];
    }
    catch (error) { result = { error: error + '' }; }
    // log method, route, query, parameters and result
    this.log && method && route && console.log('\nDB Query:', {
      method, route, sql, parameters,
      result: result instanceof Array ?
        { rows: result.length } : result
    });
    return result;
  }

}