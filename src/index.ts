import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import TorrentDownloader from "./TorrentDownloader";

const torrentDownloader = new TorrentDownloader();
const app = new Koa();

app.use(bodyParser());

const router = new Router();

router.post('/magnet', (ctx) => {
  const {
    magnetUri,
  } = ctx.request.body;
  torrentDownloader.requestDownload(magnetUri);
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

app.listen(8080);
