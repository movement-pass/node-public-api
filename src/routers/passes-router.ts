import express, { Request, Response, Router } from 'express';

import { PassesController } from '../controllers/passes-controller';
import { Jwt } from '../infrastructure/jwt';

import { authorize } from '../middlewares/authorize';

function passesRouter(controller: PassesController, jwt: Jwt): Router {
  const router = express.Router();

  router.use(authorize(jwt));

  router.get('/:id', async (req: Request, res: Response) =>
    controller.detail(req, res)
  );

  router.get('/', async (req: Request, res: Response) =>
    controller.list(req, res)
  );

  return router;
}

export { passesRouter };
