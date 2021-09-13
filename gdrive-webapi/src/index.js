import http from 'http'
import https from 'https';
import fs from 'fs';
import { logger } from './logger.js';
import { Server } from 'socket.io';
import Routes from './routes.js';

let localHostSSL = {};

const PORT = process.env.PORT || 3000;

const isProduction = process.env.NODE_ENV === 'production';
process.env.USER = process.env.USER ?? 'system_user';

if (!isProduction) {
  localHostSSL = {
    key: fs.readFileSync('./certificates/key.pem'),
    cert: fs.readFileSync('./certificates/cert.pem'),
  };
}

const protocol = isProduction ? http : https;
const ssConfig = isProduction ? {} : localHostSSL;

const routes = new Routes();

const server = protocol.createServer(ssConfig, routes.handler.bind(routes));

const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: false,
  },
});

routes.setSocketInstance(io);

const startServer = () => {
  console.log(server.address());
  const { address, port } = server.address();

  const protocol = isProduction ? 'http': 'https'

  logger.info(`App is running at ${protocol}://${address}:${port}`);
};

server.listen(PORT, startServer);
