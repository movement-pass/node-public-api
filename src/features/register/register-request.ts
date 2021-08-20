import Joi from 'joi';
import dayjs from 'dayjs';

import { Request } from '../../infrastructure/request';

class RegisterRequest extends Request {
  name: string;
  district: number;
  thana: number;
  dateOfBirth: Date;
  gender: string;
  idType: string;
  idNumber: string;
  photo: string;
  mobilePhone: string;
}

const registerRequestSchema = Joi.object({
  name: Joi.string().required().max(64),
  mobilePhone: Joi.string()
    .required()
    .pattern(/^01[3-9]\d{8}$/),
  district: Joi.number().required().min(1001).max(1075),
  thana: Joi.number().required().min(10001).max(10626),
  dateOfBirth: Joi.date()
    .required()
    .custom((value, helper) => {
      const max = dayjs().subtract(18, 'years');

      if (dayjs(value).isBefore(max) || dayjs(value).isSame(max)) {
        return value;
      }

      return helper.message(
        'Age must be 18 or over' as unknown as Joi.LanguageMessages
      );
    }, 'Age'),
  gender: Joi.string().required().allow('F', 'M', 'O'),
  idType: Joi.string().required().allow('NID', 'DL', 'PP', 'BR', 'EID', 'SID'),
  idNumber: Joi.string().required().max(64),
  photo: Joi.string().required().uri({ scheme: 'https' })
});

export { RegisterRequest, registerRequestSchema };
