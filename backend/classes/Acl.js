export default class Acl {

  // Add Express middleware that prevents non-allowed REST-routes
  static addMiddleware(restApi) {
    const settings = restApi.settings;
    restApi.app.use((req, res, next) => {
      (async () => {
        // if the route is not part of the REST api or if the acl is off,
        // which should only happen during development, then allow the route
        if (!req.url.startsWith(restApi.prefix) || !settings.aclProtectionOn) {
          next(); return;
        }
        // get the acl rules from the database
        const rules = await restApi.db.query('', '',/*sql*/`
          SELECT * FROM ${settings.aclTableName}
        `);
        // get info about the logged in user (id and role)
        let { id: userId, [restApi.settings.userRoleField]: userRole }
          = req.session.user || {};
        userId = userId || 0;
        userRole = userRole || 'visitor';
        // check all rules to see if we find a matching one and can allow the request
        let matchingRule = rules.find(({ userRoles, method, restApiRoute }) => {
          userRoles = userRoles.split(',').map(x => x.trim());
          if (!userRoles.includes(userRole)) { return false; }
          if (method !== '*' && method.toUpperCase() !== req.method) { return false; }
          if (!req.url.startsWith(restApiRoute)) { return false; }
          return true;
        });
        // store info needed for the result filtering on the resposne object
        res.aclFilterInfo = {
          userId, fieldMatchingUserId: (matchingRule || {}).fieldMatchingUserId
        }
        // TODO: make fieldMatchingUserId rules work with other than GET queries
        // for now just don't allow PUT, POST and DELETE on those rules
        if (req.method !== 'GET' && (matchingRule || {}).fieldMatchingUserId) {
          matchingRule = null;
        }
        // if we have a matching rule then allow the request, otherwise not
        matchingRule ? next() : res.status(405).json({ error: 'Not allowed.' });
      })();
    });
  }

  // if we have a rule with fieldMatchingUserId then filter the result
  // so that users can only see posts that are related to them
  static filterResultOnFieldMatchingUserId(res, data) {
    const { userId, fieldMatchingUserId } = res.aclFilterInfo || {};
    return !fieldMatchingUserId ? data :
      data.filter(({ [fieldMatchingUserId]: idField }) => idField === userId);
  }

}