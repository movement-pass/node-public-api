import serverlessExpress from '@vendia/serverless-express';

import { app } from './app';

const handler = serverlessExpress({ app });

export { handler };
