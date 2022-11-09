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
      res.status(400).json({ errors: ['Mobile phone is already registered!'] });
      return;
    }

    res.json(result);
  }

  async login(req: Request, res: Response): Promise<void> {
    const request = new LoginRequest(req.body);

    const result = await this._mediator.send<IJwtResult, LoginRequest>(request);

    if (!result) {
      res.status(400).json({ errors: ['Invalid credentials!'] });
      return;
    }

    res.json(result);
  }

  async photo(req: Request, res: Response): Promise<void> {
    const request = new PhotoUrlRequest(req.body);

    const result = await this._mediator.send<IPhotoUrlResult, PhotoUrlRequest>(
      request
    );

    res.json(result);
  }
}

export { IdentityController };
