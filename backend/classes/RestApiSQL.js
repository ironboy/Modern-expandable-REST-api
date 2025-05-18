import express from 'express';
import LoginHandler from "./LoginHandlerSQL.js";
import RestSearch from "./RestSearchSQL.js";
import Acl from './Acl.js';
import catchExpressJsonErrors from "../helpers/catchExpressJsonErrors.js";
import PasswordChecker from '../helpers/PasswordChecker.js';

// import the correct version of the DBQueryMaker
const DBQueryMaker =
  (await import(isSQLite ? './DBQueryMakerSQLite.js' : './DBQueryMakerMySQL.js')).default;

export default class RestApi {

  // Connect to the db through DBQueryMaker
  // and call methods that creates routes
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
    this.prefix = this.settings.restPrefix;
    this.prefix.endsWith('/') || (this.prefix += '/');
    this.db = new DBQueryMaker(settings);
    // use built in Express middleware to read the body
    app.use(express.json());
    // use middleware to capture malformed json errors
    app.use(catchExpressJsonErrors);
    // use middleware to check password strength
    PasswordChecker.addMiddleware(app, this.prefix, settings);
    // add login routes
    new LoginHandler(this);
    // add post, get, put and delete routes
    this.addPostRoutes();   // C
    this.addGetRoutes();    // R
    this.addPutRoutes();    // U
    this.addDeleteRoutes(); // D
    // catch calls to undefined routes
    this.addCatchAllRoute();
  }

  // send data as a json response
  // after running it through the acl system for filtering
  // alsow remove any password fields (according to settings)
  // and alter the status to 400 (bad request) if the data contains a error property
  sendJsonResponse(res, data, asObject = false) {
    if (data instanceof Array) {
      data = Acl.filterResultOnFieldMatchingUserId(res, data);
      data.forEach(post => {
        this.settings.passwordFieldNames.forEach(x => delete post[x]);
      });
    }
    res.status(data.error ? 400 : 200).json(asObject ? data[0] || null : data);
  }

  // delete all role fields amongst parameters if write to users table
  // (so that a user can not set his own role)
  stripRoleField(table, body) {
    table.toLowerCase() === this.settings.userTableName.toLowerCase() &&
      delete body[this.settings.userRoleField];
  }

  addPostRoutes() {
    // insert a post in a table
    this.app.post(this.prefix + ':table', async (req, res) => {
      req.body = req.body || {};
      const { table } = req.params;
      const { body } = req;
      this.stripRoleField(table, body);
      delete body.id; // id:s should be set by the db
      const result = await this.db.query(req.method, req.url,/*sql*/`
        INSERT INTO ${table} (${Object.keys(body).join(', ')})
        VALUES (${Object.keys(body).map(x => ':' + x).join(', ')})
      `, body);
      this.sendJsonResponse(res, result);
    });
  }

  addGetRoutes() {
    // get all the posts in a table
    // or: if there are search params in the url get posts matching them
    this.app.get(this.prefix + ':table', async (req, res) => {
      const { table } = req.params;
      const { error, sqlWhere, parameters } = RestSearch.parse(req);
      if (error) { this.sendJsonResponse(res, { error }); return; }
      const result = await this.db.query(req.method, req.url,/*sql*/`
        SELECT * FROM ${table}
        ${sqlWhere}
      `, parameters);
      this.sendJsonResponse(res, result);
    });

    // get a post by id in a table
    this.app.get(this.prefix + ':table/:id', async (req, res) => {
      const { table, id } = req.params;
      const result = await this.db.query(req.method, req.url,/*sql*/`
        SELECT * FROM ${table}
        WHERE id = :id
      `, { id });
      this.sendJsonResponse(res, result, true);
    });
  }

  addPutRoutes() {
    // update a post in a table
    this.app.put(this.prefix + ':table/:id', async (req, res) => {
      const { table, id } = req.params;
      let { body } = req;
      this.stripRoleField(table, body);
      delete body.id; // id:s should be set in the route
      const result = await this.db.query(req.method, req.url,/*sql*/`
        UPDATE ${table}
        SET ${Object.keys(body).map(x => x + '= :' + x).join(', ')}
        WHERE id = :id
      `, { id, ...body });
      this.sendJsonResponse(res, result);
    });
  }

  addDeleteRoutes() {
    // delete a post in a table
    this.app.delete(this.prefix + ':table/:id', async (req, res) => {
      const { table, id } = req.params;
      const result = await this.db.query(req.method, req.url,/*sql*/`
        DELETE FROM ${table}
        WHERE id = :id
      `, { id });
      this.sendJsonResponse(res, result);
    });
  }

  addCatchAllRoute() {
    // send if the route is missing
    /*this.app.all(this.prefix + '{*splat}', (_req, res) => {
      this.sendJsonResponse(res, { error: 'No such route exists in the REST-api' });
    });*/
  }

}