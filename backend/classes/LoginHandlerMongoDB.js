import session from 'express-session';
import sessionStore from '../helpers/sessionStore.js';
import Acl from './Acl.js';
import PasswordEncryptor from '../helpers/PasswordEncryptor.js';

export default class LoginHandler {

  constructor(restApi) {
    // transfer settings from restApi.settings to instance properties
    Object.assign(this, restApi.settings);
    // set some other properties from the restApi
    this.restApi = restApi;
    this.app = restApi.app;
    this.prefix = restApi.prefix;
    this.db = restApi.db;
    // start session handling and add login/logout routes
    this.setupSessionHandling();
    // add acl middleware for route protection
    Acl.addMiddleware(restApi);
    // add login routes
    this.addPostRoute();
    this.addGetRoute();
    this.adddDeleteRoute();
  }

  setupSessionHandling() {
    this.app.use(session({
      secret: this.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: 'auto' },
      store: sessionStore(this.restApi.settings, session)
    }));
  }

  // Post route -> Used to LOGIN
  addPostRoute() {
    // Note: This code would have been slightly easer to read if we
    // had hardcoded userTableName, userNameField and passwordFieldName
    // (but we don't - for flexibility they are set in the settings.json file)
    this.app.post(this.prefix + 'login', async (req, res) => {
      // If a user is already logged in, then do not allow login
      if (req.session.user) {
        this.restApi.sendJsonResponse(res, { error: 'Someone is already logged in.' });
        return;
      }
      // get the user from the db
      const result = await this.db.query(req.method, req.url, this.userTableName,
        'find', [{ [this.userNameField]: req.body[this.userNameField] }],
        'toArray', []
      );
      const foundDbUser = result[0] || null;
      // if the user is not  found return an error
      if (!foundDbUser) {
        this.restApi.sendJsonResponse(res, { error: 'No such user.' });
        return;
      }
      // get the name of the db field with the password
      let passwordFieldlName = Object.keys(foundDbUser)
        .find(key => this.passwordFieldNames.includes(key));
      // check if the password matches the stored encrypted one
      if (!(await PasswordEncryptor.check(
        req.body[passwordFieldlName], foundDbUser[passwordFieldlName]
      ))) {
        this.restApi.sendJsonResponse(res, { error: 'Password mismatch.' });
        return;
      }
      // the user has successfully logged in, store in req.session.user
      // (but without password) and send user data as resposne
      delete foundDbUser[passwordFieldlName];
      req.session.user = foundDbUser;
      this.restApi.sendJsonResponse(res, foundDbUser);
    });
  }

  // Get route -> used to check if we have a logged in user
  // (return the user property of our session)
  addGetRoute() {
    this.app.get(this.prefix + 'login', (req, res) =>
      this.restApi.sendJsonResponse(res,
        req.session.user || { error: 'Not logged in.' }
      )
    );
  }

  // Delete route -> used to LOGOUT
  // (delete the user property of our session)
  adddDeleteRoute() {
    this.app.delete(this.prefix + 'login', (req, res) =>
      this.restApi.sendJsonResponse(res,
        req.session.user ?
          delete req.session.user && { success: 'Logged out successfully.' } :
          { error: 'No user logged in.' }
      )
    );
  };

}