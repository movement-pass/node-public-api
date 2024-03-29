import { NextFunction, Request, Response } from 'express';

import { Id } from '../infrastructure/id';
import { Jwt } from '../infrastructure/jwt';
import { authorize } from './authorize';

describe('authorize', () => {
  describe('verification passes', () => {
    const userId = Id.generate();
    let mockedNext: jest.Mock;
    let req: Request;

    beforeAll(async () => {
      req = {
        header: jest.fn(() => `bearer ${'x'.repeat(128)}`)
      } as unknown as Request;

      mockedNext = jest.fn();

      const mockedVerify = jest.fn(async () => Promise.resolve({ id: userId }));

      const jwt = {
        verify: mockedVerify
      };

      const func = authorize(jwt as unknown as Jwt);

      await func(req, {} as Response, mockedNext);
    });

    it('sets userId', () => {
      expect((req as unknown as Record<string, string>).userId).toBe(userId);
    });

    it('calls next', () => {
      expect(mockedNext).toHaveBeenCalled();
    });
  });

  describe('missing', () => {
    let mockedResponseJson: jest.Mock;
    let mockedResponseStatus: jest.Mock;

    beforeAll(async () => {
      mockedResponseJson = jest.fn();
      mockedResponseStatus = jest.fn(() => ({ json: mockedResponseJson }));

      const res = {
        status: mockedResponseStatus
      };

      const req = {
        header: jest.fn(() => '')
      };

      const func = authorize(undefined);

      await func(
        req as unknown as Request,
        res as unknown as Response,
        undefined
      );
    });

    it('sends error', () => {
      expect(mockedResponseStatus).toHaveBeenCalledWith(403);
      expect(mockedResponseJson).toHaveBeenCalled();
    });
  });

  describe('incorrect format', () => {
    let mockedResponseJson: jest.Mock;
    let mockedResponseStatus: jest.Mock;

    beforeAll(async () => {
      mockedResponseJson = jest.fn();
      mockedResponseStatus = jest.fn(() => ({ json: mockedResponseJson }));

      const res = {
        status: mockedResponseStatus
      };

      const req = {
        header: jest.fn(() => 'x'.repeat(128))
      };

      const func = authorize(undefined);

      await func(
        req as unknown as Request,
        res as unknown as Response,
        undefined as NextFunction
      );
    });

    it('sends error', () => {
      expect(mockedResponseStatus).toHaveBeenCalledWith(403);
      expect(mockedResponseJson).toHaveBeenCalled();
    });
  });

  describe('verification fails', () => {
    let mockedResponseJson: jest.Mock;
    let mockedResponseStatus: jest.Mock;

    beforeAll(async () => {
      mockedResponseJson = jest.fn();
      mockedResponseStatus = jest.fn(() => ({ json: mockedResponseJson }));

      const res = {
        status: mockedResponseStatus
      };

      const req = {
        header: jest.fn(() => `bearer ${'x'.repeat(128)}`)
      };

      const mockedVerify = jest.fn(async () =>
        Promise.reject(new Error('Verification failed!!!'))
      );

      const jwt = {
        verify: mockedVerify
      };

      const func = authorize(jwt as unknown as Jwt);

      await func(
        req as unknown as Request,
        res as unknown as Response,
        undefined as NextFunction
      );
    });

    it('sends error', () => {
      expect(mockedResponseStatus).toHaveBeenCalledWith(401);
      expect(mockedResponseJson).toHaveBeenCalled();
    });
  });
});
