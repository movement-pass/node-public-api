import { IPassItem } from '../pass-item';
import { IApplicantItem } from '../applicant-item';

interface IPassDetailItem extends IPassItem {
  applicant: IApplicantItem;
}

export { IPassDetailItem };
