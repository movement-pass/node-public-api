import { injectable } from 'tsyringe';
import { sign, verify } from 'jsonwebtoken';

import { Config } from './config';
import { IApplicant } from '../entities/applicant';

@injectable()
class Jwt {
  constructor(private readonly _config: Config) {}

  async sign(applicant: IApplicant): Promise<string> {
    const { jwtSecret, jwtExpire } = await this._config.get();

    return sign(
      {
        id: applicant.id,
        name: applicant.name,
        photo: applicant.photo
      },
      jwtSecret,
      {
        expiresIn: jwtExpire
      }
    );
  }

  async verify(token: string): Promise<{ id: string }> {
    const { jwtSecret } = await this._config.get();

    return new Promise((resolve, reject) => {
      verify(token, jwtSecret, (err, decoded) => {
        if (err) {
          return reject(err);
        }

        resolve({ id: decoded.id });
      });
    });
  }
}

export { Jwt };
