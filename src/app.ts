import 'reflect-metadata';
import { container } from 'tsyringe';

import express from 'express';
import cors from 'cors';

import { SSMClient } from '@aws-sdk/client-ssm';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { Jwt } from './infrastructure/jwt';

import { IdentityController } from './controllers/identity-controller';
import { PassesController } from './controllers/passes-controller';

import { identityRouter } from './routers/identity-router';
import { passesRouter } from './routers/passes-router';

(() => {
  const region = process.env.AWS_REGION;

  const ssmClient = new SSMClient({
    region
  });

  const dynamodb = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region
    })
  );

  const s3Client = new S3Client({
    region
  });

  const generateUploadUrl = async (args: {
    bucket: string;
    key: string;
    contentType: string;
    expiresIn: number;
  }): Promise<string> => {
    const cmd = new PutObjectCommand({
      Bucket: args.bucket,
      Key: args.key,
      ContentType: args.contentType
    });

    return getSignedUrl(s3Client, cmd, { expiresIn: args.expiresIn });
  };

  container.register('SSM', { useValue: ssmClient });
  container.register('DynamoDB', { useValue: dynamodb });
  container.register('generateUploadUrl', { useValue: generateUploadUrl });
})();

const app = express();

app.use(
  cors({
    allowedHeaders: ['Authorization', 'Content-Type'],
    methods: ['GET', 'POST'],
    maxAge: 60 * 60 * 24 * 365
  })
);

app.use(express.json());

(() => {
  const version = process.env.CONFIG_ROOT_KEY.split('/').pop();

  app.use(
    `/${version}/identity`,
    identityRouter(container.resolve(IdentityController))
  );

  app.use(
    `/${version}/passes`,
    passesRouter(container.resolve(PassesController), container.resolve(Jwt))
  );
})();

export { app };
