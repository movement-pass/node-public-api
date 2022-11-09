import Joi from 'joi';

import { Request, Response } from 'express';

import { validate } from './validate';

describe('validate', () => {
  const schema = Joi.object({
    attr: Joi.string().required()
  });

  const func = validate(schema);

  describe('passes', () => {
    let mockedNext: jest.Mock;

    beforeAll(() => {
      mockedNext = jest.fn();

      const req = {
        body: { attr: 'an attribute' }
      };

      func(req as Request, {} as Response, mockedNext);
    });

    it('calls next', () => {
      expect(mockedNext).toHaveBeenCalled();
    });
  });

  describe('fails', () => {
    let mockedResponseJson: jest.Mock;
    let mockedResponseStatus: jest.Mock;

    beforeAll(() => {
      mockedResponseJson = jest.fn();
      mockedResponseStatus = jest.fn(() => ({ json: mockedResponseJson }));

      const res = {
        status: mockedResponseStatus,
        send: mockedResponseJson
      };

      const req = {
        body: {}
      };

      func(req as Request, res as unknown as Response, undefined);
    });

    it('sends error', () => {
      expect(mockedResponseStatus).toHaveBeenCalledWith(400);
      expect(mockedResponseJson).toHaveBeenCalled();
    });
  });
});
