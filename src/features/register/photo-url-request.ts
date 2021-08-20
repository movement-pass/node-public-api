import Joi from 'joi';

import { Request } from '../../infrastructure/request';

class PhotoUrlRequest extends Request {
  contentType: string;
  filename: string;
}

const photoUrlRequestSchema = Joi.object({
  contentType: Joi.string()
    .required()
    .regex(/^image\/(png|jpg|jpeg)$/),
  filename: Joi.string()
    .required()
    .regex(/^.*\.(png|jpg|jpeg)$/i)
});

export { PhotoUrlRequest, photoUrlRequestSchema };
