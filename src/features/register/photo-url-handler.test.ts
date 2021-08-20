import 'reflect-metadata';

import { IPhotoUrlResult } from './photo-url-result';
import { Config } from '../../infrastructure/config';
import { PhotoUrlRequest } from './photo-url-request';
import { PhotoUrlHandler } from './photo-url-handler';

describe('PhotoUrlHandler', () => {
  describe('handle', () => {
    const PhotoURL =
      'https://photos.movement-pass.com/b9747bab813648198bf6988918b239e2.png';
    let mockedConfigGet: jest.Mock;
    let res: IPhotoUrlResult;

    beforeAll(async () => {
      const mockedGenerateUploadUrl = jest.fn(async () =>
        Promise.resolve(PhotoURL)
      );

      mockedConfigGet = jest.fn(async () =>
        Promise.resolve({
          photoBucketName: 'photos.movement-pass.com',
          photoUploadExpiration: '300'
        })
      );

      const config = {
        get: mockedConfigGet
      };

      const handler = new PhotoUrlHandler(
        mockedGenerateUploadUrl,
        config as unknown as Config
      );

      res = await handler.handle(
        new PhotoUrlRequest({ contentType: 'image/jpg', filename: 'me.jpg' })
      );
    });

    it('reads bucket details from config', () => {
      expect(mockedConfigGet).toHaveBeenCalled();
    });

    it('returns url with filename', () => {
      expect(res.url).toBe(PhotoURL);
      expect(res.filename).toBeDefined();
    });
  });
});
