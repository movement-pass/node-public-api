import dayjs from 'dayjs';
import { inject, injectable } from 'tsyringe';

import {
  DynamoDBDocumentClient,
  TransactWriteCommand
} from '@aws-sdk/lib-dynamodb';

import { handles } from '../../infrastructure/handles';
import { Handler } from '../../infrastructure/handler';
import { ApplyRequest } from './apply-request';
import { IdResult } from './id-result';
import { Config } from '../../infrastructure/config';
import { IPass } from '../../entities/pass';
import { Id } from '../../infrastructure/id';

@injectable()
@handles(ApplyRequest)
class ApplyHandler extends Handler<ApplyRequest, IdResult> {
  constructor(
    @inject('DynamoDB') private readonly _dynamodb: DynamoDBDocumentClient,
    private readonly _config: Config
  ) {
    super();
  }

  async handle(request: ApplyRequest): Promise<IdResult> {
    const { passesTable, applicantsTable } = await this._config.get();

    const pass = {
      ...request,
      id: Id.generate(),
      startAt: dayjs(request.dateTime).toISOString(),
      endAt: dayjs(request.dateTime)
        .add(request.durationInHour, 'hours')
        .toISOString(),
      createdAt: dayjs().toISOString(),
      includeVehicle: !!request.includeVehicle,
      selfDriven: !!request.selfDriven,
      status: 'APPLIED'
    } as unknown as IPass;

    for (const key of ['dateTime', 'durationInHour']) {
      delete pass[key];
    }

    if (!pass.includeVehicle) {
      pass.selfDriven = false;
      for (const key of ['vehicleNo', 'driverName', 'driverLicenseNo']) {
        delete pass[key];
      }
    }

    if (pass.selfDriven) {
      for (const key of ['driverName', 'driverLicenseNo']) {
        delete pass[key];
      }
    }

    const cmd = new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: passesTable,
            Item: pass
          }
        },
        {
          Update: {
            TableName: applicantsTable,
            Key: { id: pass.applicantId },
            UpdateExpression: 'SET #ac = #ac + :inc',
            ExpressionAttributeNames: {
              '#ac': 'appliedCount'
            },
            ExpressionAttributeValues: {
              ':inc': 1
            }
          }
        }
      ]
    });

    await this._dynamodb.send(cmd);

    return { id: pass.id };
  }
}

export { ApplyHandler };
