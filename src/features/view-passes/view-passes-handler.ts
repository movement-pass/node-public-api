import dayjs from 'dayjs';
import { inject, injectable } from 'tsyringe';

import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

import { handles } from '../../infrastructure/handles';
import { Handler } from '../../infrastructure/handler';
import { Config } from '../../infrastructure/config';
import { ViewPassesRequest } from './view-passes-request';
import { IPassListResult } from './pass-list-result';
import { IPassListKey } from './pass-list-key';
import { IPassItem } from '../pass-item';

@injectable()
@handles(ViewPassesRequest)
class ViewPassesHandler extends Handler<ViewPassesRequest, IPassListResult> {
  constructor(
    @inject('DynamoDB') private readonly _dynamodb: DynamoDBDocumentClient,
    private readonly _config: Config
  ) {
    super();
  }

  async handle(request: ViewPassesRequest): Promise<IPassListResult> {
    const { passesTable } = await this._config.get();

    const cmd = new QueryCommand({
      TableName: passesTable,
      IndexName: 'ix_applicantId-endAt',
      KeyConditionExpression: '#aid = :aid',
      ExpressionAttributeNames: {
        '#aid': 'applicantId'
      },
      ExpressionAttributeValues: {
        ':aid': request.applicantId
      },
      Limit: 25,
      ScanIndexForward: false
    });

    if (request.startKey) {
      if (request.startKey.id && request.startKey.endAt) {
        cmd.input.ExclusiveStartKey = {
          id: request.startKey.id,
          endAt: request.startKey.endAt,
          applicantId: request.applicantId
        };
      }
    }

    const { Items, LastEvaluatedKey } = await this._dynamodb.send(cmd);

    let nextKey: IPassListKey;

    if (LastEvaluatedKey) {
      nextKey = {
        id: LastEvaluatedKey.id,
        endAt: LastEvaluatedKey.endAt
      };
    }

    const passes = Items.map((item) => {
      const pass = {
        ...item,
        startAt: dayjs(item.startAt).toDate(),
        endAt: dayjs(item.endAt).toDate(),
        createdAt: dayjs(item.createdAt).toDate()
      } as IPassItem;

      delete pass['applicantId'];

      return pass;
    });

    return {
      passes,
      nextKey
    };
  }
}

export { ViewPassesHandler };
