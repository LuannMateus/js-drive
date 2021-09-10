import { logger } from './logger.js';
import { dirname, resolve } from 'path';
import { fileURLToPath, parse } from 'url';
import FileHelper from './fileHelper.js';
import { pipeline } from 'stream/promises';
import UploadHandler from './uploadHandler.js';

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
    const { headers } = request;

    const {
      query: { socketId },
    } = parse(request.url, true);

    const uploadHandler = new UploadHandler({
      socketId,
      io: this.io,
      downloadsFolder: this.downloadsFolder,
    });

    const onFinish = (response) => () => {
      response.writeHead(200);
      const data = JSON.stringify({ result: 'Files uploaded with success!' });
      response.end(data);
    };

    const busboyInstance = uploadHandler.registerEvents(
      headers,
      onFinish(response)
    );

    await pipeline(request, busboyInstance);

    logger.info('Request finished with success!');
  }

  handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');

    const method = request.method.toString().toLowerCase();

    const chosen = this[method] || this.defaultRoute;

    return chosen.apply(this, [request, response]);
  }
}

export default Routes;
