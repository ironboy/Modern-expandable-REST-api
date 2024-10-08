import { MongoClient, ServerApiVersion } from 'mongodb';
import PathFinder from '../helpers/PathFinder.js';

// Get settings for the db connection
const { mongoDbConnectionURI, mongoDbDatabase }
  = PathFinder.requireJson('../settings.json');

// Connect to the database
const client = new MongoClient(mongoDbConnectionURI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export default class DBQueryMaker {

  log = true; // debug log all queries to the db

  // Create a db connection (if not existing already)
  constructor() {
    this.db = client.db(mongoDbDatabase);
  }

  // Make a query to the database, as a prepared statement and
  // run it using .all() if a select statement, otherwise using .run()
  // (async not really needed for the better-sqlite driver
  // but used a reminder that we'll need it for other drivers)
  // Note: The method and route arguments are only used for logging.
  async query(method, route, collection, ...args) {
    let result = this.db.collection(collection);
    this.log && console.log('');
    this.log && console.log(`db.collection('${collection}')`);
    for (let i = 0; i < args.length; i += 2) {
      let [method, _arguments] = args.slice(i, i + 2);
      result = result[method](..._arguments);
      this.log && console.log(
        '.' + method + '(' + JSON.stringify(_arguments, '', '  ').slice(1, -1) + ')'
      );
    }
    return result;
  }

}