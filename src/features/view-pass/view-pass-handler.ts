import dayjs from 'dayjs';
import { inject, injectable } from 'tsyringe';

import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

import { handles } from '../../infrastructure/handles';
import { Handler } from '../../infrastructure/handler';
import { Config } from '../../infrastructure/config';
import { IPassDetailItem } from './pass-detail-item';
import { ViewPassRequest } from './view-pass-request';
import { IPass } from '../../entities/pass';
import { IApplicant } from '../../entities/applicant';

@injectable()
@handles(ViewPassRequest)
class ViewPassHandler extends Handler<ViewPassRequest, IPassDetailItem> {
  constructor(
    @inject('DynamoDB') private readonly _dynamodb: DynamoDBDocumentClient,
    private readonly _config: Config
  ) {
    super();
  }

  async handle(request: ViewPassRequest): Promise<IPassDetailItem> {
    const pass = await this.getPass(request.id);

    if (!pass || pass.applicantId !== request.applicantId) {
      return undefined;
    }

    const applicant = await this.getApplicant(request.applicantId);

    const detail = {
      ...pass,
      startAt: dayjs(pass.startAt).toDate(),
      endAt: dayjs(pass.endAt).toDate(),
      createdAt: dayjs(pass.createdAt).toDate(),
      applicant: {
        ...applicant,
        dateOfBirth: dayjs(applicant.dateOfBirth).toDate(),
        createdAt: dayjs(applicant.createdAt).toDate()
      }
    };

    delete detail['applicantId'];

    return detail as IPassDetailItem;
  }

  private async getPass(id: string): Promise<IPass> {
    const { passesTable } = await this._config.get();

    const cmd = new GetCommand({
      TableName: passesTable,
      Key: {
        id
      }
    });

    const { Item } = await this._dynamodb.send(cmd);

    return Item as IPass;
  }

  private async getApplicant(id: string): Promise<IApplicant> {
    const { applicantsTable } = await this._config.get();

    const cmd = new GetCommand({
      TableName: applicantsTable,
      Key: {
        id
      }
    });

    const { Item } = await this._dynamodb.send(cmd);

    return Item as IApplicant;
  }
}

export { ViewPassHandler };
