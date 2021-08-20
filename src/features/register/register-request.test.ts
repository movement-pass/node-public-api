import dayjs from 'dayjs';

import { RegisterRequest, registerRequestSchema } from './register-request';

describe('RegisterRequest ', () => {
  describe('validation', () => {
    const valid = new RegisterRequest({
      name: 'An applicant',
      district: 1075,
      thana: 10001,
      dateOfBirth: dayjs().subtract(18, 'years').toDate(),
      gender: 'M',
      idType: 'NID',
      idNumber: '1234567890',
      photo: 'https://photos.movement-pass.com/123456.jpg',
      mobilePhone: '01512345678'
    });

    describe('age', () => {
      describe('valid', () => {
        it('returns no error', () => {
          const { error } = registerRequestSchema.validate({ ...valid });

          expect(error).toBeUndefined();
        });
      });

      describe('invalid', () => {
        it('returns error', () => {
          const { error } = registerRequestSchema.validate({
            ...valid,
            dateOfBirth: dayjs().subtract(17, 'years').toDate()
          });

          expect(error).toBeDefined();
        });
      });
    });
  });
});
