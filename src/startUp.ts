process.env.NODE_ENV = (process.env.NODE_ENV && (process.env.NODE_ENV).trim().toLowerCase() == 'production') ? 'production' : 'development';

import { initializeDatabase } from "./initializeDatabase";
import torrentDownloader from "./torrentDownloader";

export default async function startUp() {
  return Promise.all([
    initializeDatabase(),
    torrentDownloader.init(),
  ])
    .then(() => {
      console.log('init finished');
    });
}
