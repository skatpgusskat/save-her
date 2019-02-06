process.env.NODE_ENV = (process.env.NODE_ENV && (process.env.NODE_ENV).trim().toLowerCase() == 'production') ? 'production' : 'development';

import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import TorrentDownloader from "./TorrentDownloader";

const torrentDownloader = new TorrentDownloader();
const app = new Koa();

app.use(bodyParser());

const router = new Router();

router.post('/magnet', async (ctx) => {
  const {
    magnetUri,
  } = ctx.request.body;
  await torrentDownloader.requestDownload(magnetUri);
  ctx.status = 200;
});

router.get('/torrents', (ctx) => {
  const torrents = torrentDownloader.getAllTorrents();
  ctx.body = torrents.map(torrent => {
    return {
      magnetURI: torrent.magnetURI,
    };
  });
});

app.use(router.routes());

const port = 8080;
torrentDownloader.init().then(() => {
  console.log('init finished');
  app.listen(port, () => {
    console.log(`start server on port ${port}`);
  });
});
