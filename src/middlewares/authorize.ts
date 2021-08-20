import { NextFunction, Request, Response } from 'express';

import { Jwt } from '../infrastructure/jwt';

function authorize(jwt: Jwt) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const authorization = req.header('authorization');

    if (!authorization) {
      res.status(403).send({ errors: ['Missing authorization!'] });
      return;
    }

    const [, token] = authorization.split(' ');

    if (!token) {
      res.status(403).send({ errors: ['Invalid authorization format!'] });
      return;
    }

    try {
      const user = await jwt.verify(token);
      // TODO: Check if the applicant also exist in db?
      (req as unknown as Record<string, string>).userId = user.id;
      next();
    } catch (e) {
      res.status(401).send({ errors: ['Unauthorized!'] });
    }
  };
}

export { authorize };
