import startUp from './startUp';
import { startApiServer } from './startApiServer';

startUp()
  .then(() => startApiServer());
