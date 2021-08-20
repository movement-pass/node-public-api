import { injectable } from 'tsyringe';

import { Request, Response } from 'express';

import { Mediator } from '../infrastructure/mediator';
import { RegisterRequest } from '../features/register/register-request';
import { LoginRequest } from '../features/login/login-request';
import { IJwtResult } from '../features/jwt-result';
import { PhotoUrlRequest } from '../features/register/photo-url-request';
import { IPhotoUrlResult } from '../features/register/photo-url-result';

@injectable()
class IdentityController {
  constructor(private readonly _mediator: Mediator) {}

  async register(req: Request, res: Response): Promise<void> {
    const request = new RegisterRequest(req.body);

    const result = await this._mediator.send<IJwtResult, RegisterRequest>(
      request
    );

    if (!result) {
      res.status(400).send({ errors: ['Mobile phone is already registered!'] });
      return;
    }

    res.send(result);
  }

  async login(req: Request, res: Response): Promise<void> {
    const request = new LoginRequest(req.body);

    const result = await this._mediator.send<IJwtResult, LoginRequest>(request);

    if (!result) {
      res.status(400).send({ errors: ['Invalid credentials!'] });
      return;
    }

    res.send(result);
  }

  async photo(req: Request, res: Response): Promise<void> {
    const request = new PhotoUrlRequest(req.body);

    const result = await this._mediator.send<IPhotoUrlResult, PhotoUrlRequest>(
      request
    );

    res.send(result);
  }
}

export { IdentityController };
