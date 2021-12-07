import Joi from 'joi';

import { Request } from '../../infrastructure/request';

class ApplyRequest extends Request {
  fromLocation: string;
  toLocation: string;
  district: number;
  thana: number;
  dateTime: Date;
  durationInHour: number;
  type: string;
  reason: string;
  includeVehicle: boolean;
  vehicleNo?: string;
  selfDriven?: boolean;
  driverName?: string;
  driverLicenseNo?: string;
  applicantId: string;
}

const applyRequestSchema = Joi.object({
  fromLocation: Joi.string().required().max(64),
  toLocation: Joi.string().required().max(64),
  district: Joi.number().required().min(1001).max(1075),
  thana: Joi.number().required().min(10001).max(10626),
  dateTime: Joi.date().required().iso(),
  durationInHour: Joi.number().required().min(1).max(12),
  type: Joi.string().required().allow('R', 'O'),
  reason: Joi.string().required().max(64),
  includeVehicle: Joi.boolean().required(),
  vehicleNo: Joi.alternatives().conditional('includeVehicle', {
    is: true,
    then: Joi.string().required().max(64),
    otherwise: Joi.string().optional()
  }),
  selfDriven: Joi.alternatives()
    .conditional('includeVehicle', {
      is: true,
      then: Joi.boolean().required(),
      otherwise: Joi.boolean().optional()
    })
    .default(false),
  driverName: Joi.alternatives().conditional('selfDriven', {
    is: false,
    then: Joi.string().required().max(64),
    otherwise: Joi.string().optional()
  }),
  driverLicenseNo: Joi.alternatives().conditional('selfDriven', {
    is: false,
    then: Joi.string().required().max(64),
    otherwise: Joi.string().optional()
  })
});

export { ApplyRequest, applyRequestSchema };
