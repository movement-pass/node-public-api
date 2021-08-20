import express, { Request, Response, Router } from 'express';

import { PassesController } from '../controllers/passes-controller';
import { Jwt } from '../infrastructure/jwt';

import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';

import { applyRequestSchema } from '../features/apply/apply-request';

function passesRouter(controller: PassesController, jwt: Jwt): Router {
  const router = express.Router();

  router.use(authorize(jwt));

  router.get('/:id', async (req: Request, res: Response) =>
    controller.detail(req, res)
  );

  router.get('/', async (req: Request, res: Response) =>
    controller.list(req, res)
  );

  router.post(
    '/',
    validate(applyRequestSchema),
    async (req: Request, res: Response) => controller.apply(req, res)
  );

  return router;
}

export { passesRouter };
