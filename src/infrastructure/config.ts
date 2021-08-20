import { inject, singleton } from 'tsyringe';

import { SSMClient, GetParametersByPathCommand } from '@aws-sdk/client-ssm';

@singleton()
class Config {
  private _cache: Record<string, string>;

  constructor(@inject('SSM') private readonly _ssm: SSMClient) {}

  async get(): Promise<Record<string, string>> {
    if (this._cache) {
      return Promise.resolve(this._cache);
    }

    this._cache = await this.load(process.env.CONFIG_ROOT_KEY, []);

    return this._cache;
  }

  private async load(
    rootKey: string,
    list: { key: string; value: string }[],
    nextToken?: string
  ): Promise<Record<string, string>> {
    const cmd = new GetParametersByPathCommand({
      Path: rootKey,
      Recursive: true,
      WithDecryption: true,
      MaxResults: 10,
      NextToken: nextToken
    });

    const { Parameters, NextToken } = await this._ssm.send(cmd);

    if (Parameters.length) {
      list.push(
        ...Parameters.map((p) => ({
          key: p.Name,
          value: p.Value
        }))
      );
    }

    if (NextToken) {
      return this.load(rootKey, list, NextToken);
    }

    const result: Record<string, string> = {};

    for (const item of list) {
      const key = item.key.substring(rootKey.length + 1);
      result[key] = item.value;
    }

    return result;
  }
}

export { Config };
