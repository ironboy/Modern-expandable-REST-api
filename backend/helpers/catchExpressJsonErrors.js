// Express middleware that catches malformed JSON in request bodies
export default function catchExpressJsonErrors(error, _req, res, next) {
  error instanceof SyntaxError && error.status === 400 && 'body' in error ?
    res.status(400).json({ error: error + '' }) : next();
}