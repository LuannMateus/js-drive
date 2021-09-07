import { describe, test, expect, jest } from '@jest/globals';
import fs from 'fs';
import FileHelper from '../../src/fileHelper.js';

describe('#FileHelper', () => {
  describe('#getFileStatus', () => {
    test('it should return files statuses in correct format', async () => {
      const statMock = {
        dev: 2054,
        mode: 33204,
        nlink: 1,
        uid: 1000,
        gid: 1000,
        rdev: 0,
        blksize: 4096,
        ino: 12321115,
        size: 0,
        blocks: 0,
        atimeMs: 1631039374275.8452,
        mtimeMs: 1631039374218,
        ctimeMs: 1631039374215.844,
        birthtimeMs: 1631039120325.5112,
        atime: '2021-09-07T18:29:34.276Z',
        mtime: '2021-09-07T18:29:34.218Z',
        ctime: '2021-09-07T18:29:34.216Z',
        birthtime: '2021-09-07T18:25:20.326Z',
      };

      const mockUser = 'luanmateus';
      process.env.USER = mockUser;
      const filename = 'file.txt';

      jest
        .spyOn(fs.promises, fs.promises.readdir.name)
        .mockResolvedValue([filename]);

      jest
        .spyOn(fs.promises, fs.promises.stat.name)
        .mockResolvedValue(statMock);

      const result = await FileHelper.getFileStatus('/tmp');

      const expectedResult = [
        {
          size: '0 B',
          lastModified: statMock.birthtime,
          owner: mockUser,
          file: filename,
        },
      ];

      expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${filename}`);
      expect(result).toMatchObject(expectedResult);
    });
  });
});
