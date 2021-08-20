import Joi from 'joi';

import { NextFunction, Request, Response } from 'express';

function validate(schema: Joi.Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { value, error } = schema.validate(req.body);

    if (error) {
      res.status(400).send({
        errors: error.details.map((d) => d.message)
      });
      return;
    }

    req.body = value;
    next();
  };
}

export { validate };
