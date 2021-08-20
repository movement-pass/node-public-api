import { Request } from '../../infrastructure/request';

class ViewPassRequest extends Request {
  id: string;
  applicantId: string;
}

export { ViewPassRequest };
