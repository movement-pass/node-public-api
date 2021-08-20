import 'reflect-metadata';
import dayjs from 'dayjs';

import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

import { LoginRequest } from './login-request';
import { IJwtResult } from '../jwt-result';
import { Config } from '../../infrastructure/config';
import { Jwt } from '../../infrastructure/jwt';
import { LoginHandler } from './login-handler';

describe('LoginHandler', () => {
  describe('handle', () => {
    const DateOfBirth = new Date(1971, 11, 16);

    let req: LoginRequest;

    beforeAll(() => {
      req = new LoginRequest({
        mobilePhone: '01512345678',
        dateOfBirth: dayjs(DateOfBirth).format('DDMMYYYY')
      });
    });

    describe('valid credentials', () => {
      let mockedDynamoDBGetSend: jest.Mock;
      let mockedConfigGet: jest.Mock;
      let mockedJwtSign: jest.Mock;
      let res: IJwtResult;
      let dynamodbGetCommand: GetCommand;

      beforeAll(async () => {
        mockedDynamoDBGetSend = jest.fn(async () =>
          Promise.resolve({
            Item: {
              id: req.mobilePhone,
              dateOfBirth: dayjs(DateOfBirth).toISOString()
            }
          })
        );

        const dynamodb = {
          send: mockedDynamoDBGetSend
        };

        mockedConfigGet = jest.fn(async () =>
          Promise.resolve({
            applicantsTable: 'applicants'
          })
        );

        const config = {
          get: mockedConfigGet
        };

        mockedJwtSign = jest.fn(async () => Promise.resolve('x'.repeat(128)));

        const jwt = {
          sign: mockedJwtSign
        };

        const handler = new LoginHandler(
          dynamodb as unknown as DynamoDBDocumentClient,
          config as unknown as Config,
          jwt as unknown as Jwt
        );

        res = await handler.handle(req);

        dynamodbGetCommand = mockedDynamoDBGetSend.mock.calls[0][0];
      });

      it('used mobilePhone to load applicant', () => {
        expect(dynamodbGetCommand.input.Key.id).toBe(req.mobilePhone);
      });

      it('reads table names from config', () => {
        expect(mockedConfigGet).toHaveBeenCalled();
      });

      it('reads from db', () => {
        expect(mockedDynamoDBGetSend).toHaveBeenCalled();
      });

      it('generates jwt token', () => {
        expect(mockedJwtSign).toHaveBeenCalled();
      });

      it('returns jwt result', () => {
        expect(res).toBeDefined();
      });
    });

    describe('non existent applicant', () => {
      let res: IJwtResult;

      beforeAll(async () => {
        const mockedDynamoDBGetSend = jest.fn(async () => Promise.resolve({}));

        const dynamodb = {
          send: mockedDynamoDBGetSend
        };

        const mockedConfigGet = jest.fn(async () =>
          Promise.resolve({
            applicantsTable: 'applicants'
          })
        );

        const config = {
          get: mockedConfigGet
        };

        const handler = new LoginHandler(
          dynamodb as unknown as DynamoDBDocumentClient,
          config as unknown as Config,
          undefined
        );

        res = await handler.handle(req);
      });

      it('returns undefined', () => {
        expect(res).toBeUndefined();
      });
    });

    describe('invalid credentials', () => {
      let res: IJwtResult;

      beforeAll(async () => {
        const mockedDynamoDBGetSend = jest.fn(async () =>
          Promise.resolve({
            Item: {
              id: req.mobilePhone,
              dateOfBirth: dayjs(DateOfBirth).add(1, 'day').toISOString()
            }
          })
        );

        const dynamodb = {
          send: mockedDynamoDBGetSend
        };

        const mockedConfigGet = jest.fn(async () =>
          Promise.resolve({
            applicantsTable: 'applicants'
          })
        );

        const config = {
          get: mockedConfigGet
        };

        const handler = new LoginHandler(
          dynamodb as unknown as DynamoDBDocumentClient,
          config as unknown as Config,
          undefined
        );

        res = await handler.handle(req);
      });

      it('returns undefined', () => {
        expect(res).toBeUndefined();
      });
    });
  });
});
