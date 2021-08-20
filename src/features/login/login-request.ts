import Joi from 'joi';

import { Request } from '../../infrastructure/request';

class LoginRequest extends Request {
  mobilePhone: string;
  dateOfBirth: string;
}

const loginRequestSchema = Joi.object({
  mobilePhone: Joi.string()
    .required()
    .pattern(/^01[3-9]\d{8}$/),
  dateOfBirth: Joi.string()
    .required()
    .pattern(/^\d{8}$/)
});

export { LoginRequest, loginRequestSchema };
