import 'reflect-metadata';
import dayjs from 'dayjs';

import { Request, Response } from 'express';

import { Id } from '../infrastructure/id';
import { ViewPassRequest } from '../features/view-pass/view-pass-request';
import { ViewPassesRequest } from '../features/view-passes/view-passes-request';
import { Mediator } from '../infrastructure/mediator';
import { PassesController } from './passes-controller';

describe('PassesController', () => {
  describe('detail', () => {
    describe('existent pass', () => {
      let mockedMediatorSend: jest.Mock;
      let mockedResponseHeaderSet: jest.Mock;
      let mockedResponseJson: jest.Mock;
      let viewPassRequest: ViewPassRequest;

      beforeAll(async () => {
        mockedMediatorSend = jest.fn(async () => Promise.resolve({}));

        const mediator = {
          send: mockedMediatorSend
        };

        const controller = new PassesController(
          mediator as unknown as Mediator
        );

        const req = {
          userId: Id.generate(),
          params: {
            id: Id.generate()
          }
        };

        mockedResponseHeaderSet = jest.fn();
        mockedResponseJson = jest.fn();

        const res = {
          header: mockedResponseHeaderSet,
          json: mockedResponseJson
        };

        await controller.detail(
          req as unknown as Request,
          res as unknown as Response
        );

        viewPassRequest = mockedMediatorSend.mock.calls[0][0];
      });

      it('uses mediator', () => {
        expect(mockedMediatorSend).toHaveBeenCalled();
        expect(viewPassRequest).toBeInstanceOf(ViewPassRequest);
      });

      it('sets cache control header', () => {
        expect(mockedResponseHeaderSet).toHaveBeenCalled();
      });

      it('sends matching pass', () => {
        expect(mockedResponseJson).toHaveBeenCalled();
      });
    });

    describe('non-existent pass', () => {
      let mockedResponseJson: jest.Mock;
      let mockedResponseStatus: jest.Mock;

      beforeAll(async () => {
        const mockedMediatorSend = jest.fn(async () => Promise.resolve(null));

        const mediator = {
          send: mockedMediatorSend
        };

        const controller = new PassesController(
          mediator as unknown as Mediator
        );

        mockedResponseJson = jest.fn();
        mockedResponseStatus = jest.fn(() => ({ json: mockedResponseJson }));

        const res = {
          status: mockedResponseStatus
        };

        const req = { params: { id: Id.generate() } };

        await controller.detail(
          req as unknown as Request,
          res as unknown as Response
        );
      });

      it('sends not found', () => {
        expect(mockedResponseStatus).toHaveBeenCalledWith(404);
        expect(mockedResponseJson).toHaveBeenCalled();
      });
    });
  });

  describe('list', () => {
    let mockedMediatorSend: jest.Mock;
    let mockedResponseHeaderSet: jest.Mock;
    let mockedResponseJson: jest.Mock;
    let viewPassesRequest: ViewPassesRequest;

    beforeAll(async () => {
      mockedMediatorSend = jest.fn(async () => Promise.resolve({}));

      const mediator = {
        send: mockedMediatorSend
      };

      const controller = new PassesController(mediator as unknown as Mediator);

      const req = {
        userId: Id.generate(),
        query: {
          id: Id.generate(),
          endAt: dayjs().subtract(7, 'days').toISOString()
        }
      };

      mockedResponseHeaderSet = jest.fn();
      mockedResponseJson = jest.fn();

      const res = {
        header: mockedResponseHeaderSet,
        json: mockedResponseJson
      };

      await controller.list(
        req as unknown as Request,
        res as unknown as Response
      );

      viewPassesRequest = mockedMediatorSend.mock.calls[0][0];
    });

    it('uses mediator', () => {
      expect(mockedMediatorSend).toHaveBeenCalled();
      expect(viewPassesRequest).toBeInstanceOf(ViewPassesRequest);
    });

    it('sets cache control header', () => {
      expect(mockedResponseHeaderSet).toHaveBeenCalled();
    });

    it('sends matching passes', () => {
      expect(mockedResponseJson).toHaveBeenCalled();
    });
  });
});
