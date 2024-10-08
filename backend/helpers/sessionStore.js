import SQLiteStore from 'better-express-store';
import MySQLStore from 'express-mysql-session';
import MongoDBStore from 'connect-mongodb-session';
import PathFinder from '../helpers/PathFinder.js';


// choose the correct sessionStore depending on DB
export default function sessionStore(settings, session) {
  if (settings.dbType === 'SQLite') {
    return SQLiteStore({
      dbPath: PathFinder.relToAbs('../' + settings.dbPath),
      deleteAfterInactivityMinutes: 120
    });
  }
  else if (settings.dbType === 'MySQL') {
    const { dbHost: host, dbPort: port, dbUser: user,
      dbPassword: password, dbDatabase: database } = settings;
    return new (MySQLStore(session))({
      host, port, user, password, database
    });
  }
  else if (settings.dbType === 'MongoDB') {
    return new (MongoDBStore(session))({
      uri: settings.mongoDbConnectionURI,
      databaseName: settings.mongoDbDatabase,
      collection: 'sessions'
    });
  }
}