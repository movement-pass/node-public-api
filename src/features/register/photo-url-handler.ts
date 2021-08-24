import { extname } from 'path';
import { inject, injectable } from 'tsyringe';

import { handles } from '../../infrastructure/handles';
import { Config } from '../../infrastructure/config';
import { Handler } from '../../infrastructure/handler';
import { IPhotoUrlResult } from './photo-url-result';
import { PhotoUrlRequest } from './photo-url-request';
import { Id } from '../../infrastructure/id';

@injectable()
@handles(PhotoUrlRequest)
class PhotoUrlHandler extends Handler<PhotoUrlRequest, IPhotoUrlResult> {
  constructor(
    @inject('generateUploadUrl')
    private readonly _generateUploadUrl: (args: {
      bucket: string;
      key: string;
      contentType: string;
      expiresIn: number;
    }) => Promise<string>,
    private readonly _config: Config
  ) {
    super();
  }

  async handle(request: PhotoUrlRequest): Promise<IPhotoUrlResult> {
    const { photoBucketName, photoUploadExpiration } = await this._config.get();

    const filename = `${Id.generate()}${extname(request.filename)}`;

    const url = await this._generateUploadUrl({
      bucket: photoBucketName,
      key: filename,
      contentType: request.contentType,
      expiresIn: Number(photoUploadExpiration)
    });

    return {
      url,
      filename
    };
  }
}

export { PhotoUrlHandler };
