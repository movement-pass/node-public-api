import dayjs from 'dayjs';
import { inject, injectable } from 'tsyringe';

import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

import { handles } from '../../infrastructure/handles';
import { Jwt } from '../../infrastructure/jwt';
import { Config } from '../../infrastructure/config';
import { Handler } from '../../infrastructure/handler';
import { IApplicant } from '../../entities/applicant';
import { IJwtResult } from '../jwt-result';
import { RegisterRequest } from './register-request';

@injectable()
@handles(RegisterRequest)
class RegisterHandler extends Handler<RegisterRequest, IJwtResult> {
  constructor(
    @inject('DynamoDB') private readonly _dynamodb: DynamoDBDocumentClient,
    private readonly _config: Config,
    private readonly _jwt: Jwt
  ) {
    super();
  }

  async handle(request: RegisterRequest): Promise<IJwtResult> {
    const { applicantsTable } = await this._config.get();

    const applicant = {
      ...request,
      id: request.mobilePhone,
      dateOfBirth: dayjs(request.dateOfBirth).toISOString(),
      createdAt: dayjs().toISOString(),
      appliedCount: 0,
      approvedCount: 0,
      rejectedCount: 0
    } as unknown as IApplicant;

    delete applicant['mobilePhone'];

    const cmd = new PutCommand({
      TableName: applicantsTable,
      Item: applicant,
      ConditionExpression: 'attribute_not_exists(#i)',
      ExpressionAttributeNames: { '#i': 'id' }
    });

    try {
      await this._dynamodb.send(cmd);

      applicant.dateOfBirth = dayjs(applicant.dateOfBirth).toDate();
      applicant.createdAt = dayjs(applicant.createdAt).toDate();
    } catch (e) {
      if (e.name === 'ConditionalCheckFailedException') {
        return undefined;
      }
      throw e;
    }

    const token = await this._jwt.sign(applicant);

    return {
      type: 'bearer',
      token
    };
  }
}

export { RegisterHandler };
