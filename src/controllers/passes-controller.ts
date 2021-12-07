import { injectable } from 'tsyringe';

import { Request, Response } from 'express';

import { Mediator } from '../infrastructure/mediator';
import { ApplyRequest } from '../features/apply/apply-request';
import { IdResult } from '../features/apply/id-result';
import { ViewPassRequest } from '../features/view-pass/view-pass-request';
import { IPassDetailItem } from '../features/view-pass/pass-detail-item';
import { ViewPassesRequest } from '../features/view-passes/view-passes-request';
import { IPassListResult } from '../features/view-passes/pass-list-result';

@injectable()
class PassesController {
  constructor(private readonly _mediator: Mediator) {}

  async apply(req: Request, res: Response): Promise<void> {
    const request = new ApplyRequest({
      ...req.body,
      applicantId: (req as unknown as Record<string, string>).userId
    });

    const result = await this._mediator.send<IdResult, ApplyRequest>(request);

    res.status(201).send(result);
  }

  async detail(req: Request, res: Response): Promise<void> {
    const request = new ViewPassRequest({
      id: req.params.id,
      applicantId: (req as unknown as Record<string, string>).userId
    });

    const detail = await this._mediator.send<IPassDetailItem, ViewPassRequest>(
      request
    );

    if (!detail) {
      res.status(404).send({ errors: ['Pass does not exist!'] });
      return;
    }

    res.header(
      'cache-control',
      `private,max-age=${detail.status === 'APPLIED' ? 60 * 5 : 60 * 24 * 30}`
    );

    res.send(detail);
  }

  async list(req: Request, res: Response): Promise<void> {
    const request = new ViewPassesRequest({
      applicantId: (req as unknown as Record<string, string>).userId
    });

    if (req.query.id && req.query.endAt) {
      request.startKey = {
        id: req.query.id as string,
        endAt: req.query.endAt as string
      };
    }

    const result = await this._mediator.send<
      IPassListResult,
      ViewPassesRequest
    >(request);

    res.header('cache-control', `private,max-age=${60 * 5}`);

    res.send(result);
  }
}

export { PassesController };
