import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import fs from 'fs';
import { resolve } from 'path';
import { pipeline } from 'stream/promises';
import { logger } from '../../src/logger.js';

import UploadHandler from '../../src/uploadHandler.js';
import TestUtils from '../_util/testUtil.js';

describe('#UploadHandler test suit', () => {
  const ioObj = {
    to: (id) => ioObj,
    emit: (event, message) => {},
  };

  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation(() => {});
  });

  describe('#registerEvents', () => {
    test('should call onFile and onFinish functions on Busboy instance', () => {
      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '01',
      });

      jest.spyOn(uploadHandler, uploadHandler.onFile.name).mockResolvedValue();

      const headers = {
        'content-type': 'multipart/form-data; boundary=',
      };

      const onFinishSpy = jest.fn();
      const busboyInstance = uploadHandler.registerEvents(headers, onFinishSpy);

      const fileStream = TestUtils.generateReadableStream([
        'chunk',
        'of',
        'data',
      ]);

      busboyInstance.emit('file', 'filedname', fileStream, 'filename.txt');

      busboyInstance.listeners('finish')[0].call();

      expect(uploadHandler.onFile).toHaveBeenCalled();

      expect(onFinishSpy).toHaveBeenCalled();
    });
  });

  describe('#onFile', () => {
    test('given a stream file it should save ut it on disk', async () => {
      const chunks = ['hey', 'jude'];
      const downloadsFolder = '/tmp';

      const handler = new UploadHandler({
        io: ioObj,
        socketId: '01',
        downloadsFolder,
      });

      const onData = jest.fn();
      jest
        .spyOn(fs, fs.createWriteStream.name)
        .mockImplementation(() => TestUtils.generateWritableStream(onData));

      const onTransform = jest.fn();
      jest
        .spyOn(handler, handler.handleFileByte.name)
        .mockImplementation(() =>
          TestUtils.generateTransformStream(onTransform)
        );

      const params = {
        fieldname: 'video',
        file: TestUtils.generateReadableStream(chunks),
        filename: 'mockFile.mov',
      };

      await handler.onFile(...Object.values(params));

      expect(onData.mock.calls.join()).toEqual(chunks.join());
      expect(onTransform.mock.calls.join()).toEqual(chunks.join());

      const expectedFilename = resolve(
        handler.downloadsFolder,
        params.filename
      );
      expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFilename);
    });
  });

  describe('#handleFileBytes', () => {
    test('should call emit function and it is a transform stream', async () => {
      jest.spyOn(ioObj, ioObj.to.name);
      jest.spyOn(ioObj, ioObj.emit.name);

      const handler = new UploadHandler({
        io: ioObj,
        socketId: '01',
      });

      jest.spyOn(handler, handler.canExecute.name).mockReturnValueOnce(true);

      const messages = ['hello'];

      const source = TestUtils.generateReadableStream(messages);

      const onWrite = jest.fn();
      const target = TestUtils.generateWritableStream(onWrite);

      await pipeline(source, handler.handleFileByte('filename.txt'), target);

      expect(ioObj.to).toHaveBeenCalledTimes(messages.length);
      expect(ioObj.emit).toHaveBeenCalledTimes(messages.length);

      expect(onWrite).toBeCalledTimes(messages.length);
      expect(onWrite.mock.calls.join()).toEqual(messages.join());
    });

    test('given message timerDelay as 2secs it should emit only on message during 2 seconds', async () => {
      jest.spyOn(ioObj, ioObj.emit.name);

      // # sent message schedule behavior
      const twoSecondsPeriod = 2000;

      const day = '2021-07-01 01:01';

      const onFirstLastMessageSent = TestUtils.getTimeFromDate(`${day}:00`);

      // ## 1 -> hello
      const onFirstCanExecute = TestUtils.getTimeFromDate(`${day}:02`);
      const onSecondUpdateLastMessageSent = onFirstCanExecute;

      // ## 2 -> hello - NOT ALLOWED BECAUSE TIME
      const onSecondCanExecute = TestUtils.getTimeFromDate(`${day}:03`);

      // ## 3 -> world
      const onThirdCanExecute = TestUtils.getTimeFromDate(`${day}:04`);

      TestUtils.mockDateNow([
        onFirstLastMessageSent,
        onFirstCanExecute,
        onSecondUpdateLastMessageSent,
        onSecondCanExecute,
        onThirdCanExecute,
      ]);

      const messages = ['hello', 'hello', 'world'];
      const filename = 'filename.avi';
      const expectedMessageSent = 2;

      const source = TestUtils.generateReadableStream(messages);

      const handler = new UploadHandler({
        messageTimeDelay: twoSecondsPeriod,
        io: ioObj,
        socketId: '01',
      });

      await pipeline(source, handler.handleFileByte(filename));

      expect(ioObj.emit).toHaveBeenCalledTimes(expectedMessageSent);

      const [firstCallResult, secondCallResult] = ioObj.emit.mock.calls;

      expect(firstCallResult).toEqual([
        handler.ON_UPLOAD_EVENT,
        {
          processedAlready: 'hello'.length,
          filename,
        },
      ]);
      expect(secondCallResult).toEqual([
        handler.ON_UPLOAD_EVENT,
        {
          processedAlready: messages.join('').length,
          filename,
        },
      ]);
    });
  });

  describe('#canExecute', () => {
    test('should return true when time is later that specified delay', () => {
      const timerDelay = 1000;

      const uploadHandler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimeDelay: timerDelay,
      });

      const tickNow = TestUtils.getTimeFromDate('2021-07-01 00:00:03');
      TestUtils.mockDateNow([tickNow]);

      const lastExecution = TestUtils.getTimeFromDate('2021-07-01 00:00:00');

      const result = uploadHandler.canExecute(lastExecution);

      expect(result).toBeTruthy();
    });
    test('should return false when time isnt later than specified delay', () => {
      const timerDelay = 1000;

      const uploadHandler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimeDelay: timerDelay,
      });

      const now = TestUtils.getTimeFromDate('2021-07-01 00:00:02');
      TestUtils.mockDateNow([now]);

      const lastExecution = TestUtils.getTimeFromDate('2021-07-01 00:00:03');

      const result = uploadHandler.canExecute(lastExecution);

      expect(result).toBeFalsy();
    });
  });
});
