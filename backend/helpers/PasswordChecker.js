export default class PasswordChecker {
  // Only allow passwords that matches settings.passwordOkRegEx
  static addMiddleware(app, prefix, settings) {
    let regEx = new RegExp(settings.passwordOkRegEx);
    app.use((req, res, next) => {
      // do not run on login route - so old users can still login
      // even if the settings.passwordOkRegEx is changed
      if (req.url.startsWith(prefix + 'login')) { next(); return; }
      // perform check
      const body = req.body || {};
      let passwordOk = true;
      for (let field of settings.passwordFieldNames) {
        if (field in body && !regEx.test(req.body[field])) {
          res.status(400).json({
            error: 'Password does not fulfill: ' + settings.passwordOkIf
          });
          passwordOk = false;
          break;
        }
      }
      passwordOk && next();
    });
  }

}