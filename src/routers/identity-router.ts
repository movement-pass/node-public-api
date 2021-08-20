import express, { Request, Response, Router } from 'express';

import { IdentityController } from '../controllers/identity-controller';

import { validate } from '../middlewares/validate';
import { registerRequestSchema } from '../features/register/register-request';
import { loginRequestSchema } from '../features/login/login-request';
import { photoUrlRequestSchema } from '../features/register/photo-url-request';

function identityRouter(controller: IdentityController): Router {
  const router = express.Router();

  router.post(
    '/register',
    validate(registerRequestSchema),
    async (req: Request, res: Response) => controller.register(req, res)
  );

  router.post(
    '/login',
    validate(loginRequestSchema),
    async (req: Request, res: Response) => controller.login(req, res)
  );

  router.post(
    '/photo',
    validate(photoUrlRequestSchema),
    async (req: Request, res: Response) => controller.photo(req, res)
  );

  return router;
}

export { identityRouter };
