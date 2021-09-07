import { describe, test, expect, jest } from '@jest/globals';

import Routes from '../../src/routes.js';

describe('#Routes suit test', () => {
  const defaultParams = {
    request: {
      headers: {
        'Content-type': 'multipart/form-data',
      },
      method: '',
      body: {},
    },
    response: {
      setHeader: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn(),
    },
    values: () => Object.values(defaultParams),
  };

  describe('#setSocketInstance', () => {
    test('setSocket should store io instance', () => {
      const routes = new Routes();
      const ioObj = {
        to: (id) => ioObj,
        emit: (event, message) => {},
      };

      routes.setSocketInstance(ioObj);
      expect(routes.io).toStrictEqual(ioObj);
    });
  });

  describe('#handler', () => {
    test('given an inexistent route it should choose default route', () => {
      const routes = new Routes();
      const params = { ...defaultParams };

      params.request.method = 'inexistent';
      routes.handler(...params.values());

      expect(params.response.end).toHaveBeenCalledWith('DEFAULT ROUTE');
    });
    test('it should set any request with CORS enabled', () => {
      const routes = new Routes();
      const params = { ...defaultParams };

      params.request.method = 'inexistent';
      routes.handler(...params.values());

      expect(params.response.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        '*'
      );
    });
    test('given method OPTIONS it should choose options route', () => {
      const routes = new Routes();
      const params = { ...defaultParams };

      params.request.method = 'OPTIONS';
      routes.handler(...params.values());

      expect(params.response.writeHead).toHaveBeenCalledWith(204);
      expect(params.response.end).toHaveBeenCalled();
    });
    test('given method POST it should choose post route', async () => {
      const routes = new Routes();
      const params = { ...defaultParams };

      params.request.method = 'POST';

      jest.spyOn(routes, routes.post.name).mockResolvedValue();

      await routes.handler(...params.values());

      expect(routes.post).toHaveBeenCalled();
    });
    test('given method GEt it should choose get route', async () => {
      const routes = new Routes();
      const params = { ...defaultParams };

      jest.spyOn(routes, routes.get.name).mockResolvedValue();

      params.request.method = 'GET';
      await routes.handler(...params.values());

      expect(routes.get).toHaveBeenCalled();
    });
  });

  describe('#get', () => {
    test('given method GET it should list all files downloaded', async () => {
      const routes = new Routes();

      const params = {
        ...defaultParams,
      };

      const fileStatusesMock = [
        {
          size: '0 B',
          lastModified: '2021-09-07T18:25:20.326Z',
          owner: 'luanmateus',
          file: 'file.txt',
        },
      ];

      jest
        .spyOn(routes.fileHelper, routes.fileHelper.getFileStatus.name)
        .mockResolvedValue(fileStatusesMock);

      params.request.method = 'GET';
      await routes.handler(...params.values());

      expect(params.response.writeHead).toHaveBeenCalledWith(200);
      expect(params.response.end).toHaveBeenCalledWith(
        JSON.stringify(fileStatusesMock)
      );
    });
  });
});
