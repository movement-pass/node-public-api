import 'reflect-metadata';
import dayjs from 'dayjs';

import { Request, Response } from 'express';

import { Id } from '../infrastructure/id';
import { ApplyRequest } from '../features/apply/apply-request';
import { IPassItem } from '../features/pass-item';
import { ViewPassRequest } from '../features/view-pass/view-pass-request';
import { ViewPassesRequest } from '../features/view-passes/view-passes-request';
import { Mediator } from '../infrastructure/mediator';
import { PassesController } from './passes-controller';

describe('PassesController', () => {
  describe('apply', () => {
    describe('valid input', () => {
      const pass: IPassItem = {
        id: Id.generate(),
        fromLocation: 'Location A',
        toLocation: 'Location B',
        district: 1075,
        thana: 10001,
        startAt: dayjs().add(1, 'day').toDate(),
        endAt: dayjs().add(1, 'day').add(4, 'hours').toDate(),
        type: 'O',
        reason: 'A reason',
        includeVehicle: true,
        vehicleNo: 'Dhaka metro x-xx-xxxx',
        selfDriven: true,
        status: 'APPLIED',
        createdAt: dayjs().toDate()
      };

      let mockedMediatorSend: jest.Mock;
      let mockedResponseSend: jest.Mock;
      let mockedResponseStatus: jest.Mock;
      let applyRequest: ApplyRequest;

      beforeAll(async () => {
        mockedMediatorSend = jest.fn(async () => Promise.resolve(pass));

        const mediator = {
          send: mockedMediatorSend
        };

        const controller = new PassesController(
          mediator as unknown as Mediator
        );

        mockedResponseSend = jest.fn();
        mockedResponseStatus = jest.fn(() => ({ send: mockedResponseSend }));

        const res = {
          status: mockedResponseStatus,
          send: mockedResponseSend
        };

        const req = {
          userId: Id.generate(),
          body: {
            fromLocation: pass.fromLocation,
            toLocation: pass.toLocation,
            district: pass.district,
            thana: pass.thana,
            dateTime: dayjs(pass.startAt).toISOString(),
            durationInHour: 4,
            type: pass.type,
            reason: pass.reason,
            includeVehicle: pass.includeVehicle,
            vehicleNo: pass.vehicleNo,
            selfDriven: pass.selfDriven
          }
        };

        await controller.apply(
          req as unknown as Request,
          res as unknown as Response
        );
        applyRequest = mockedMediatorSend.mock.calls[0][0];
      });

      it('uses mediator', () => {
        expect(mockedMediatorSend).toHaveBeenCalled();
        expect(applyRequest).toBeInstanceOf(ApplyRequest);
      });

      it('sends new pass id', () => {
        expect(mockedResponseStatus).toHaveBeenCalledWith(201);
        expect(mockedResponseSend).toHaveBeenCalled();
      });
    });
  });

  describe('detail', () => {
    describe('existent pass', () => {
      let mockedMediatorSend: jest.Mock;
      let mockedHeaderSet: jest.Mock;
      let mockedResponseSend: jest.Mock;
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

        mockedHeaderSet = jest.fn();
        mockedResponseSend = jest.fn();

        const res = {
          header: mockedHeaderSet,
          send: mockedResponseSend
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
        expect(mockedHeaderSet).toHaveBeenCalled();
      });

      it('sends matching pass', () => {
        expect(mockedResponseSend).toHaveBeenCalled();
      });
    });

    describe('non-existent pass', () => {
      let mockedResponseSend: jest.Mock;
      let mockedResponseStatus: jest.Mock;

      beforeAll(async () => {
        const mockedMediatorSend = jest.fn(async () => Promise.resolve(null));

        const mediator = {
          send: mockedMediatorSend
        };

        const controller = new PassesController(
          mediator as unknown as Mediator
        );

        mockedResponseSend = jest.fn();
        mockedResponseStatus = jest.fn(() => ({ send: mockedResponseSend }));

        const res = {
          status: mockedResponseStatus,
          send: mockedResponseSend
        };

        const req = { params: { id: Id.generate() } };

        await controller.detail(
          req as unknown as Request,
          res as unknown as Response
        );
      });

      it('sends not found', () => {
        expect(mockedResponseStatus).toHaveBeenCalledWith(404);
        expect(mockedResponseSend).toHaveBeenCalled();
      });
    });
  });

  describe('list', () => {
    let mockedMediatorSend: jest.Mock;
    let mockedHeaderSet: jest.Mock;
    let mockedResponseSend: jest.Mock;
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

      mockedHeaderSet = jest.fn();
      mockedResponseSend = jest.fn();

      const res = {
        header: mockedHeaderSet,
        send: mockedResponseSend
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
      expect(mockedHeaderSet).toHaveBeenCalled();
    });

    it('sends matching passes', () => {
      expect(mockedResponseSend).toHaveBeenCalled();
    });
  });
});
