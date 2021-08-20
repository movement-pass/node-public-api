import 'reflect-metadata';

import { SSMClient, GetParametersByPathCommand } from '@aws-sdk/client-ssm';

import { Config } from './config';

describe('Config', () => {
  describe('get', () => {
    const CONFIG_ROOT_KEY = '/movement-pass/v1';
    const LAMBDA_TASK_ROOT = '/var/foo';

    let mockedGetParametersByPathSend: jest.Mock;
    let res: Record<string, string>;
    let command: GetParametersByPathCommand;

    beforeAll(async () => {
      process.env.CONFIG_ROOT_KEY = CONFIG_ROOT_KEY;
      process.env.LAMBDA_TASK_ROOT = LAMBDA_TASK_ROOT;

      mockedGetParametersByPathSend = jest
        .fn()
        .mockReturnValueOnce(
          Promise.resolve({
            Parameters: [
              {
                Name: `${CONFIG_ROOT_KEY}/key1`,
                Value: 'value1'
              }
            ],
            NextToken: 'marker'
          })
        )
        .mockReturnValueOnce(
          Promise.resolve({
            Parameters: [
              {
                Name: `${CONFIG_ROOT_KEY}/key2`,
                Value: 'value2'
              }
            ]
          })
        );

      const ssm = {
        send: mockedGetParametersByPathSend
      };

      const config = new Config(ssm as unknown as SSMClient);

      await config.get();

      res = await config.get();
      command = mockedGetParametersByPathSend.mock.calls[0][0];
    });

    afterAll(() => {
      delete process.env.CONFIG_ROOT_KEY;
      delete process.env.LAMBDA_TASK_ROOT;
    });

    it('reuses cache', () => {
      expect(mockedGetParametersByPathSend).toHaveBeenCalledTimes(2);
    });

    it('uses config root key to load values', () => {
      expect(command.input.Path).toBe(CONFIG_ROOT_KEY);
    });

    it('strip outs config root key', () => {
      for (const key of Object.keys(res)) {
        expect(key).not.toMatch(`^${CONFIG_ROOT_KEY}`);
      }
    });
  });
});
