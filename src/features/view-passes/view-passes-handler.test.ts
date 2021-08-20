import 'reflect-metadata';
import dayjs from 'dayjs';

import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

import { Id } from '../../infrastructure/id';
import { Config } from '../../infrastructure/config';
import { IPassListResult } from './pass-list-result';
import { ViewPassesRequest } from './view-passes-request';
import { ViewPassesHandler } from './view-passes-handler';

describe('ViewPassesHandler', () => {
  describe('handle', () => {
    const applicantId = Id.generate();
    let mockedConfigGet: jest.Mock;

    let res: IPassListResult;

    beforeAll(async () => {
      const mockedDynamoDBQuerySend = jest.fn(async () =>
        Promise.resolve({
          Items: [
            {
              startAt: dayjs().add(1, 'day').toISOString(),
              endAt: dayjs().add(1, 'day').add(4, 'hours').toISOString(),
              createdAt: dayjs().toISOString(),
              applicantId
            }
          ],
          LastEvaluatedKey: {
            id: Id.generate(),
            endAt: dayjs().subtract(7, 'days').toISOString()
          }
        })
      );

      const dynamodb = {
        send: mockedDynamoDBQuerySend
      };

      mockedConfigGet = jest.fn(async () =>
        Promise.resolve({
          passesTables: 'passes'
        })
      );

      const config = {
        get: mockedConfigGet
      };

      const handler = new ViewPassesHandler(
        dynamodb as unknown as DynamoDBDocumentClient,
        config as unknown as Config
      );

      res = await handler.handle(
        new ViewPassesRequest({
          applicantId,
          startKey: {
            id: Id.generate(),
            endAt: dayjs().subtract(3, 'days').toISOString()
          }
        })
      );
    });

    it('returns matching passes of calling applicant', () => {
      expect(res).toBeDefined();
      expect(res.passes.length).toBe(1);
      expect(res.nextKey).toBeDefined();
    });

    it('reads table names from config', () => {
      expect(mockedConfigGet).toHaveBeenCalled();
    });
  });
});
