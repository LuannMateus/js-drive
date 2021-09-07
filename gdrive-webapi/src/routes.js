import { logger } from './logger.js';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import FileHelper from './fileHelper.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDownloadsFolder = resolve(__dirname, '../', 'downloads');

class Routes {
  io;
  downloadsFolder;

  constructor(downloadsFolder = defaultDownloadsFolder) {
    this.downloadsFolder = downloadsFolder;
    this.fileHelper = FileHelper;
  }

  setSocketInstance(io) {
    this.io = io;
  }

  async defaultRoute(request, response) {
    response.end('DEFAULT ROUTE');
  }

  async options(request, response) {
    response.writeHead(204);
    response.end('OPTIONS ROUTE');
  }

  async get(request, response) {
    const files = await this.fileHelper.getFileStatus(this.downloadsFolder);
    response.writeHead(200);
    response.end(JSON.stringify(files));
  }

  async post(request, response) {
    logger.info('POST');
    response.end('');
  }

  handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');

    const method = request.method.toString().toLowerCase();

    const chosen = this[method] || this.defaultRoute;

    return chosen.apply(this, [request, response]);
  }
}

export default Routes;
