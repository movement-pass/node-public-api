import 'reflect-metadata';

import { Request, Response } from 'express';

import { IJwtResult } from '../features/jwt-result';
import { LoginRequest } from '../features/login/login-request';
import { RegisterRequest } from '../features/register/register-request';
import { PhotoUrlRequest } from '../features/register/photo-url-request';
import { Mediator } from '../infrastructure/mediator';
import { IdentityController } from './identity-controller';

describe('IdentityController', () => {
  const jwtResult: IJwtResult = {
    type: 'bearer',
    token: 'x'.repeat(128)
  };

  describe('register', () => {
    describe('valid input', () => {
      let mockedMediatorSend: jest.Mock;
      let mockedResponseSend: jest.Mock;
      let registerRequest: RegisterRequest;

      beforeAll(async () => {
        mockedMediatorSend = jest.fn(async () => Promise.resolve(jwtResult));

        const mediator = {
          send: mockedMediatorSend
        };

        const controller = new IdentityController(
          mediator as unknown as Mediator
        );

        const req = {
          body: {
            mobilePhone: '01512345678',
            name: 'An Applicant',
            district: 1075,
            thana: 10001,
            dateOfBirth: '1971-12-16',
            gender: 'M',
            idType: 'NID',
            idNumber: '0123456789',
            photo:
              'https://photos.movement-pass.com/f9321d9f2db54d55a9ed4d7fad68c038.jpg'
          }
        };

        mockedResponseSend = jest.fn();

        const res = {
          send: mockedResponseSend
        };

        await controller.register(req as Request, res as unknown as Response);
        registerRequest = mockedMediatorSend.mock.calls[0][0];
      });

      it('uses mediator', () => {
        expect(mockedMediatorSend).toHaveBeenCalled();
        expect(registerRequest).toBeInstanceOf(RegisterRequest);
      });

      it('sends jwt token', () => {
        expect(mockedResponseSend).toHaveBeenCalled();
      });
    });

    describe('already registered', () => {
      let mockedResponseSend: jest.Mock;
      let mockedResponseStatus: jest.Mock;

      beforeAll(async () => {
        const mockedMediatorSend = jest.fn(async () => Promise.resolve(null));

        const mediator = {
          send: mockedMediatorSend
        };

        const controller = new IdentityController(
          mediator as unknown as Mediator
        );

        const req = {
          body: {}
        };

        mockedResponseSend = jest.fn();
        mockedResponseStatus = jest.fn(() => ({ send: mockedResponseSend }));

        const res = {
          status: mockedResponseStatus,
          send: mockedResponseSend
        };

        await controller.register(req as Request, res as unknown as Response);
      });

      it('sends bad request', () => {
        expect(mockedResponseStatus).toHaveBeenCalledWith(400);
        expect(mockedResponseSend).toHaveBeenCalled();
      });
    });
  });

  describe('login', () => {
    describe('valid credentials', () => {
      let mockedMediatorSend: jest.Mock;
      let mockedResponseSend: jest.Mock;
      let loginRequest: LoginRequest;

      beforeAll(async () => {
        mockedMediatorSend = jest.fn(async () => Promise.resolve(jwtResult));

        const mediator = {
          send: mockedMediatorSend
        };

        const controller = new IdentityController(
          mediator as unknown as Mediator
        );

        const req = {
          body: {
            mobilePhone: '01512345678',
            dateOfBirth: '16121971'
          }
        };

        mockedResponseSend = jest.fn();

        const res = {
          send: mockedResponseSend
        };

        await controller.login(req as Request, res as unknown as Response);

        loginRequest = mockedMediatorSend.mock.calls[0][0];
      });

      it('uses mediator', () => {
        expect(mockedMediatorSend).toHaveBeenCalled();
        expect(loginRequest).toBeInstanceOf(LoginRequest);
      });

      it('sends jwt token', () => {
        expect(mockedResponseSend).toHaveBeenCalled();
      });
    });

    describe('invalid credentials', () => {
      let mockedResponseSend: jest.Mock;
      let mockedResponseStatus: jest.Mock;

      beforeAll(async () => {
        const mockedMediatorSend = jest.fn(async () => Promise.resolve(null));

        const mediator = {
          send: mockedMediatorSend
        };

        const controller = new IdentityController(
          mediator as unknown as Mediator
        );

        mockedResponseSend = jest.fn();
        mockedResponseStatus = jest.fn(() => ({ send: mockedResponseSend }));

        const res = {
          status: mockedResponseStatus,
          send: mockedResponseSend
        };

        const req = {
          body: {}
        };

        await controller.login(req as Request, res as unknown as Response);
      });

      it('sends bad request', () => {
        expect(mockedResponseStatus).toHaveBeenCalledWith(400);
        expect(mockedResponseSend).toHaveBeenCalled();
      });
    });
  });

  describe('photo', () => {
    let mockedMediatorSend: jest.Mock;
    let mockedResponseSend: jest.Mock;
    let photoUrlRequest: PhotoUrlRequest;

    beforeAll(async () => {
      mockedMediatorSend = jest.fn(async () => Promise.resolve({}));

      const mediator = {
        send: mockedMediatorSend
      };

      const controller = new IdentityController(
        mediator as unknown as Mediator
      );

      const req = {
        body: {
          contentType: 'image/jpg',
          filename: 'me.jpg'
        }
      };

      mockedResponseSend = jest.fn();

      const res = {
        send: mockedResponseSend
      };

      await controller.photo(req as Request, res as unknown as Response);
      photoUrlRequest = mockedMediatorSend.mock.calls[0][0];
    });

    it('uses mediator', () => {
      expect(mockedMediatorSend).toHaveBeenCalled();
      expect(photoUrlRequest).toBeInstanceOf(PhotoUrlRequest);
    });

    it('sends result', () => {
      expect(mockedResponseSend).toHaveBeenCalled();
    });
  });
});
