import { v4 as uuid } from 'uuid';

const Id = {
  generate: (): string => uuid().replace(/-/g, '').toLowerCase()
};

export { Id };
