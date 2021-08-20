import { Request } from '../../infrastructure/request';
import { IPassListKey } from './pass-list-key';

class ViewPassesRequest extends Request {
  applicantId: string;
  startKey?: IPassListKey;
}

export { ViewPassesRequest };
