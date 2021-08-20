import 'reflect-metadata';
import dayjs from 'dayjs';

import {
  DynamoDBDocumentClient,
  TransactWriteCommand
} from '@aws-sdk/lib-dynamodb';

import { ApplyRequest } from './apply-request';
import { IdResult } from './id-result';
import { Config } from '../../infrastructure/config';
import { ApplyHandler } from './apply-handler';

describe('ApplyHandler', () => {
  describe('handle', () => {
    let req: ApplyRequest;
    let mockedDynamoDBTransactWriteSend: jest.Mock;
    let mockedConfigGet: jest.Mock;
    let res: IdResult;
    let dynamodbTransactWriteCommand: TransactWriteCommand;

    describe('with vehicle', () => {
      describe('self driven', () => {
        beforeAll(async () => {
          req = {
            fromLocation: 'Location A',
            toLocation: 'Location B',
            district: 9876,
            thana: 12345,
            dateTime: dayjs().add(1, 'day').toDate(),
            durationInHour: 4,
            type: 'R',
            reason: 'A reason',
            includeVehicle: true,
            vehicleNo: 'Dhaka metro x-xx-xxxx',
            selfDriven: true,
            applicantId: '01512345678'
          };

          mockedDynamoDBTransactWriteSend = jest.fn(async () =>
            Promise.resolve()
          );

          const dynamodb = {
            send: mockedDynamoDBTransactWriteSend
          };

          mockedConfigGet = jest.fn(async () =>
            Promise.resolve({
              passesTables: 'passes',
              applicantsTable: 'applicants'
            })
          );

          const config = {
            get: mockedConfigGet
          };

          const handler = new ApplyHandler(
            dynamodb as unknown as DynamoDBDocumentClient,
            config as unknown as Config
          );

          res = await handler.handle(req);

          dynamodbTransactWriteCommand =
            mockedDynamoDBTransactWriteSend.mock.calls[0][0];
        });

        it('returns new id', () => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
        });

        it('adds startAt', () => {
          expect(
            dynamodbTransactWriteCommand.input.TransactItems[0].Put.Item.startAt
          ).toStrictEqual(dayjs(req.dateTime).toISOString());
        });

        it('adds endsAt', () => {
          expect(
            dynamodbTransactWriteCommand.input.TransactItems[0].Put.Item.endAt
          ).toStrictEqual(
            dayjs(req.dateTime).add(req.durationInHour, 'hours').toISOString()
          );
        });

        it('adds createdAt', () => {
          expect(
            dynamodbTransactWriteCommand.input.TransactItems[0].Put.Item
              .createdAt
          ).toBeDefined();
        });

        it('sets status to APPLIED', () => {
          expect(
            dynamodbTransactWriteCommand.input.TransactItems[0].Put.Item.status
          ).toBe('APPLIED');
        });

        it('increments applied count of applicant', () => {
          expect(
            dynamodbTransactWriteCommand.input.TransactItems[1].Update
              .UpdateExpression
          ).toBeDefined();
        });

        it('reads table names from config', () => {
          expect(mockedConfigGet).toHaveBeenCalled();
        });

        it('persists in db', () => {
          expect(mockedDynamoDBTransactWriteSend).toHaveBeenCalled();
        });
      });

      describe('driver driven', () => {
        beforeAll(async () => {
          req = {
            fromLocation: 'Location A',
            toLocation: 'Location B',
            district: 9876,
            thana: 12345,
            dateTime: dayjs().add(1, 'day').toDate(),
            durationInHour: 4,
            type: 'R',
            reason: 'A reason',
            includeVehicle: true,
            vehicleNo: 'Dhaka metro x-xx-xxxx',
            selfDriven: false,
            applicantId: '01512345678',
            driverLicenseNo: '1234567',
            driverName: 'The driver'
          };

          mockedDynamoDBTransactWriteSend = jest.fn(async () =>
            Promise.resolve()
          );

          const dynamodb = {
            send: mockedDynamoDBTransactWriteSend
          };

          mockedConfigGet = jest.fn(async () =>
            Promise.resolve({
              passesTables: 'passes',
              applicantsTable: 'applicants'
            })
          );

          const config = {
            get: mockedConfigGet
          };

          const handler = new ApplyHandler(
            dynamodb as unknown as DynamoDBDocumentClient,
            config as unknown as Config
          );

          res = await handler.handle(req);

          dynamodbTransactWriteCommand =
            mockedDynamoDBTransactWriteSend.mock.calls[0][0];
        });

        it('returns new id', () => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
        });

        it('adds startAt', () => {
          expect(
            dynamodbTransactWriteCommand.input.TransactItems[0].Put.Item.startAt
          ).toStrictEqual(dayjs(req.dateTime).toISOString());
        });

        it('adds endsAt', () => {
          expect(
            dynamodbTransactWriteCommand.input.TransactItems[0].Put.Item.endAt
          ).toStrictEqual(
            dayjs(req.dateTime).add(req.durationInHour, 'hours').toISOString()
          );
        });

        it('adds createdAt', () => {
          expect(
            dynamodbTransactWriteCommand.input.TransactItems[0].Put.Item
              .createdAt
          ).toBeDefined();
        });

        it('sets status to APPLIED', () => {
          expect(
            dynamodbTransactWriteCommand.input.TransactItems[0].Put.Item.status
          ).toBe('APPLIED');
        });

        it('increments applied count of applicant', () => {
          expect(
            dynamodbTransactWriteCommand.input.TransactItems[1].Update
              .UpdateExpression
          ).toBeDefined();
        });

        it('reads table names from config', () => {
          expect(mockedConfigGet).toHaveBeenCalled();
        });

        it('persists in db', () => {
          expect(mockedDynamoDBTransactWriteSend).toHaveBeenCalled();
        });
      });
    });

    describe('without vehicle', () => {
      beforeAll(async () => {
        req = {
          fromLocation: 'Location A',
          toLocation: 'Location B',
          district: 9876,
          thana: 12345,
          dateTime: dayjs().add(1, 'day').toDate(),
          durationInHour: 4,
          type: 'R',
          reason: 'A reason',
          includeVehicle: false,
          applicantId: '01512345678'
        };

        mockedDynamoDBTransactWriteSend = jest.fn(async () =>
          Promise.resolve()
        );

        const dynamodb = {
          send: mockedDynamoDBTransactWriteSend
        };

        mockedConfigGet = jest.fn(async () =>
          Promise.resolve({
            passesTables: 'passes',
            applicantsTable: 'applicants'
          })
        );

        const config = {
          get: mockedConfigGet
        };

        const handler = new ApplyHandler(
          dynamodb as unknown as DynamoDBDocumentClient,
          config as unknown as Config
        );

        res = await handler.handle(req);

        dynamodbTransactWriteCommand =
          mockedDynamoDBTransactWriteSend.mock.calls[0][0];
      });

      it('returns new id', () => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
      });

      it('adds startAt', () => {
        expect(
          dynamodbTransactWriteCommand.input.TransactItems[0].Put.Item.startAt
        ).toStrictEqual(dayjs(req.dateTime).toISOString());
      });

      it('adds endsAt', () => {
        expect(
          dynamodbTransactWriteCommand.input.TransactItems[0].Put.Item.endAt
        ).toStrictEqual(
          dayjs(req.dateTime).add(req.durationInHour, 'hours').toISOString()
        );
      });

      it('adds createdAt', () => {
        expect(
          dynamodbTransactWriteCommand.input.TransactItems[0].Put.Item.createdAt
        ).toBeDefined();
      });

      it('sets status to APPLIED', () => {
        expect(
          dynamodbTransactWriteCommand.input.TransactItems[0].Put.Item.status
        ).toBe('APPLIED');
      });

      it('increments applied count of applicant', () => {
        expect(
          dynamodbTransactWriteCommand.input.TransactItems[1].Update
            .UpdateExpression
        ).toBeDefined();
      });

      it('reads table names from config', () => {
        expect(mockedConfigGet).toHaveBeenCalled();
      });

      it('persists in db', () => {
        expect(mockedDynamoDBTransactWriteSend).toHaveBeenCalled();
      });
    });
  });
});
