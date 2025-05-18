import Server from './classes/Server.js';

if (process.argv[2] === 'standalone') {
  new Server();
}

export default function startBackend() {
  new Server(app);
}