import 'reflect-metadata';
import dayjs from 'dayjs';

import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

import { Id } from '../../infrastructure/id';
import { IPassDetailItem } from './pass-detail-item';
import { Config } from '../../infrastructure/config';
import { ViewPassRequest } from './view-pass-request';
import { ViewPassHandler } from './view-pass-handler';

describe('ViewPassHandler', () => {
  describe('handle', () => {
    const applicantId = Id.generate();

    describe('valid pass', () => {
      let mockedConfigGet: jest.Mock;
      let res: IPassDetailItem;

      beforeAll(async () => {
        const mockedDynamoDBGetSend = jest
          .fn()
          .mockImplementationOnce(async () =>
            Promise.resolve({
              Item: {
                id: Id.generate(),
                startAt: dayjs().add(1, 'day').toISOString(),
                endAt: dayjs().add(1, 'day').add(4, 'hours').toISOString(),
                createdAt: dayjs().toISOString(),
                applicantId
              }
            })
          )
          .mockImplementationOnce(async () =>
            Promise.resolve({
              Item: {
                id: applicantId,
                dateOfBirth: dayjs('1971-12-16').toISOString(),
                createdAt: dayjs().toISOString()
              }
            })
          );

        const dynamodb = {
          send: mockedDynamoDBGetSend
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

        const handler = new ViewPassHandler(
          dynamodb as unknown as DynamoDBDocumentClient,
          config as unknown as Config
        );

        const req = new ViewPassRequest({ id: Id.generate(), applicantId });

        res = await handler.handle(req);
      });

      it('returns matching pass', () => {
        expect(res).toBeDefined();
        expect(res.applicant).toBeDefined();
      });

      it('reads table names from config', () => {
        expect(mockedConfigGet).toHaveBeenCalled();
      });
    });

    describe('non existent pass', () => {
      let res: IPassDetailItem;

      beforeAll(async () => {
        const mockedDynamoDBGetSend = jest.fn(async () => Promise.resolve({}));

        const dynamodb = {
          send: mockedDynamoDBGetSend
        };

        const mockedConfigGet = jest.fn(async () =>
          Promise.resolve({
            passesTables: 'passes',
            applicantsTable: 'applicants'
          })
        );

        const config = {
          get: mockedConfigGet
        };

        const handler = new ViewPassHandler(
          dynamodb as unknown as DynamoDBDocumentClient,
          config as unknown as Config
        );

        const req = new ViewPassRequest({ id: Id.generate(), applicantId });

        res = await handler.handle(req);
      });

      it('returns undefined', () => {
        expect(res).toBeUndefined();
      });
    });

    describe('pass does not belong to calling applicant', () => {
      let res: IPassDetailItem;

      beforeAll(async () => {
        const mockedDynamoDBGetSend = jest.fn(async () =>
          Promise.resolve({
            Item: {
              applicantId: Id.generate()
            }
          })
        );

        const dynamodb = {
          send: mockedDynamoDBGetSend
        };

        const mockedConfigGet = jest.fn(async () =>
          Promise.resolve({
            passesTables: 'passes',
            applicantsTable: 'applicants'
          })
        );

        const config = {
          get: mockedConfigGet
        };

        const handler = new ViewPassHandler(
          dynamodb as unknown as DynamoDBDocumentClient,
          config as unknown as Config
        );

        const req = new ViewPassRequest({ id: Id.generate(), applicantId });

        res = await handler.handle(req);
      });

      it('returns undefined', () => {
        expect(res).toBeUndefined();
      });
    });
  });
});
