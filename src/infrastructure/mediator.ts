import { injectAll, injectable, registry } from 'tsyringe';

import { Handler } from './handler';
import { Request } from './request';

import { RegisterHandler } from '../features/register/register-handler';
import { LoginHandler } from '../features/login/login-handler';
import { PhotoUrlHandler } from '../features/register/photo-url-handler';
import { ApplyHandler } from '../features/apply/apply-handler';
import { ViewPassesHandler } from '../features/view-passes/view-passes-handler';
import { ViewPassHandler } from '../features/view-pass/view-pass-handler';

const registrations = [
  RegisterHandler,
  LoginHandler,
  PhotoUrlHandler,
  ApplyHandler,
  ViewPassesHandler,
  ViewPassHandler
].map((c) => ({
  token: 'Handler',
  useClass: c
}));

@injectable()
@registry(registrations)
class Mediator {
  private readonly _map = new Map<string, Handler<unknown, unknown>>();

  constructor(@injectAll('Handler') handlers: Handler<unknown, unknown>[]) {
    for (const handler of handlers) {
      const type = handler.constructor.prototype.__REQUEST_TYPE__;
      this._map.set(type, handler);
    }
  }

  async send<TResult, TRequest extends Request>(
    request: TRequest
  ): Promise<TResult> {
    const handler = this._map.get(request.constructor.name);

    const res = await handler.handle(request);

    return res as TResult;
  }
}

export { Mediator };
