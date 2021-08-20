import dayjs from 'dayjs';
import { inject, injectable } from 'tsyringe';

import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

import { handles } from '../../infrastructure/handles';
import { Jwt } from '../../infrastructure/jwt';
import { Config } from '../../infrastructure/config';
import { Handler } from '../../infrastructure/handler';
import { IApplicant } from '../../entities/applicant';
import { IJwtResult } from '../jwt-result';
import { LoginRequest } from './login-request';

@injectable()
@handles(LoginRequest)
class LoginHandler extends Handler<LoginRequest, IJwtResult> {
  constructor(
    @inject('DynamoDB') private readonly _dynamodb: DynamoDBDocumentClient,
    private readonly _config: Config,
    private readonly _jwt: Jwt
  ) {
    super();
  }

  async handle(request: LoginRequest): Promise<IJwtResult> {
    const { applicantsTable } = await this._config.get();

    const cmd = new GetCommand({
      TableName: applicantsTable,
      Key: {
        id: request.mobilePhone
      }
    });

    const { Item: applicant } = await this._dynamodb.send(cmd);

    if (
      !applicant ||
      dayjs(applicant.dateOfBirth).format('DDMMYYYY') !== request.dateOfBirth
    ) {
      return undefined;
    }

    applicant.dateOfBirth = dayjs(applicant.dateOfBirth).toDate();
    applicant.createdAt = dayjs(applicant.createdAt).toDate();

    const token = await this._jwt.sign(applicant as IApplicant);

    return {
      type: 'bearer',
      token
    };
  }
}

export { LoginHandler };
