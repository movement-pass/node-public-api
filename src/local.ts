import * as dotenv from 'dotenv';

dotenv.config();

// eslint-disable-next-line import/first
import { app } from './app';

app.listen(process.env.PORT, () => {
  // eslint-disable-next-line no-console
  console.info(`Server running on http://localhost:${process.env.PORT}/`);
});
