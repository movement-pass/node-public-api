import 'reflect-metadata';
import dayjs from 'dayjs';

import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

import { RegisterRequest } from './register-request';
import { IJwtResult } from '../jwt-result';
import { Config } from '../../infrastructure/config';
import { Jwt } from '../../infrastructure/jwt';
import { RegisterHandler } from './register-handler';

describe('RegisterHandler', () => {
  describe('handle', () => {
    let req: RegisterRequest;

    beforeAll(() => {
      req = new RegisterRequest({
        name: 'An applicant',
        district: 9876,
        thana: 12345,
        dateOfBirth: dayjs().subtract(18, 'years').toDate(),
        gender: 'M',
        idType: 'NID',
        idNumber: '1234567890',
        photo: 'https://photos.movement-pass.com/123456.jpg',
        mobilePhone: '01512345678'
      });
    });

    describe('new applicant', () => {
      let mockedDynamoDBPutSend: jest.Mock;
      let mockedConfigGet: jest.Mock;
      let mockedJwtSign: jest.Mock;
      let res: IJwtResult;
      let dynamoDBPutCommand: PutCommand;

      beforeAll(async () => {
        mockedDynamoDBPutSend = jest.fn(async () => Promise.resolve());

        const dynamodb = {
          send: mockedDynamoDBPutSend
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

        const handler = new RegisterHandler(
          dynamodb as unknown as DynamoDBDocumentClient,
          config as unknown as Config,
          jwt as unknown as Jwt
        );

        res = await handler.handle(req);

        dynamoDBPutCommand = mockedDynamoDBPutSend.mock.calls[0][0];
      });

      it('uses mobilePhone as id', () => {
        expect(dynamoDBPutCommand.input.Item.id).toBe(req.mobilePhone);
        expect(dynamoDBPutCommand.input.Item.mobilePhone).toBeUndefined();
      });

      it('converts dateOfBirth to ISO string', () => {
        expect(dynamoDBPutCommand.input.Item.dateOfBirth).toStrictEqual(
          req.dateOfBirth
        );
      });

      it('adds createdAt', () => {
        expect(dynamoDBPutCommand.input.Item.createdAt).toBeDefined();
      });

      it('adds appliedCount', () => {
        expect(dynamoDBPutCommand.input.Item.appliedCount).toBe(0);
      });

      it('adds appliedCount', () => {
        expect(dynamoDBPutCommand.input.Item.appliedCount).toBe(0);
      });

      it('adds approvedCount', () => {
        expect(dynamoDBPutCommand.input.Item.approvedCount).toBe(0);
      });

      it('adds rejectedCount', () => {
        expect(dynamoDBPutCommand.input.Item.rejectedCount).toBe(0);
      });

      it('reads table names from config', () => {
        expect(mockedConfigGet).toHaveBeenCalled();
      });

      it('persists in db', () => {
        expect(mockedDynamoDBPutSend).toHaveBeenCalled();
      });

      it('generates jwt token', () => {
        expect(mockedJwtSign).toHaveBeenCalled();
      });

      it('returns jwt result', () => {
        expect(res).toBeDefined();
      });
    });

    describe('already registered', () => {
      let res: IJwtResult;

      beforeAll(async () => {
        const mockedDynamoDBPutSend = jest.fn(async () =>
          // eslint-disable-next-line prefer-promise-reject-errors
          Promise.reject({ name: 'ConditionalCheckFailedException' })
        );

        const dynamodb = {
          send: mockedDynamoDBPutSend
        };

        const mockedConfigGet = jest.fn(async () =>
          Promise.resolve({
            applicantsTable: 'applicants'
          })
        );

        const config = {
          get: mockedConfigGet
        };

        const handler = new RegisterHandler(
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

    describe('unexpected exception', () => {
      let handler: RegisterHandler;

      beforeAll(() => {
        const mockedDynamoDBPutSend = jest.fn(async () =>
          Promise.reject(new Error('Internal Error!'))
        );

        const dynamodb = {
          send: mockedDynamoDBPutSend
        };

        const mockedConfigGet = jest.fn(async () =>
          Promise.resolve({
            applicantsTable: 'applicants'
          })
        );

        const config = {
          get: mockedConfigGet
        };

        handler = new RegisterHandler(
          dynamodb as unknown as DynamoDBDocumentClient,
          config as unknown as Config,
          undefined
        );
      });

      it('rethrows exception', async () => {
        await expect(handler.handle(req)).rejects.toBeDefined();
      });
    });
  });
});
