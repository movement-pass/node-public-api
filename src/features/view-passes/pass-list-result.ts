import { IPassItem } from '../pass-item';
import { IPassListKey } from './pass-list-key';

interface IPassListResult {
  passes: IPassItem[];
  nextKey?: IPassListKey;
}

export { IPassListResult };
