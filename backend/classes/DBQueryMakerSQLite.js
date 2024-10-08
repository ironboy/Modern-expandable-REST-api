import betterSqlite3 from 'better-sqlite3';
import PathFinder from '../helpers/PathFinder.js';
import PasswordEncryptor from '../helpers/PasswordEncryptor.js';
import numericValuesToNumbers from '../helpers/numericValuesToNumbers.js';

export default class DBQueryMaker {

  log = true; // debug log all queries to the db

  static db = null;  // db connection, store static so it can be reused

  // Create a db connection (if not existing already)
  constructor({ dbPath }) {
    //  connect to the db if not done already by another instance
    this.constructor.db = this.constructor.db || betterSqlite3(PathFinder.relToAbs('../' + dbPath));
    // copy the connection to an instance property for convenience
    this.db = this.constructor.db;
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
    // check if SELECT or other type of query
    const isSelect = sql.slice(0, 6).toUpperCase() === 'SELECT';
    // try to make the query
    let result;
    try {
      const preparedStatement = this.db.prepare(sql);
      result = preparedStatement[isSelect ? 'all' : 'run'](parameters);
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