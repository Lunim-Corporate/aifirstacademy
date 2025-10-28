const serverless = require('serverless-http');
const serverModule = require('../../server');

const createServer = serverModule.createServer || (serverModule.default && serverModule.default.createServer) || serverModule.default;
if (!createServer) {
  throw new Error('createServer function not found in ../../server');
}

const app = createServer();

exports.handler = serverless(app, {
  binary: false,
  request(req, event, context) {
    req.netlifyContext = context;
    req.netlifyEvent = event;
  },
});