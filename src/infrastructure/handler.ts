import { Request } from './request';

abstract class Handler<TRequest extends Request, TResult> {
  abstract handle(request: TRequest): Promise<TResult>;
}

export { Handler };
