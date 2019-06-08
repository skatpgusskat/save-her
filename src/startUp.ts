import { initializeDatabase } from "./initializeDatabase";
import torrentDownloader from "./TorrentDownloader";

export default async function startUp() {
  return Promise.all([
    initializeDatabase(),
    torrentDownloader.init(),
  ])
    .then(() => {
      console.log('init finished');

    });

}