import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import torrentDownloader from "./torrentDownloader";
import TorrentModel from './Model/TorrentModel';
import UserModel from './Model/UserModel';
import { transaction } from 'objection';
import FileModel from './Model/FileModel';

export function startApiServer(): Promise<void> {
  const app = new Koa();

  app.use(bodyParser());

  const router = new Router();

  router.post('/login', async (ctx) => {
    console.log(ctx.request.body);
    const {
      username,
    } = ctx.request.body;

    console.log(username);

    let userModel = await UserModel.query().findOne({
      username,
    });

    if (!userModel) {
      userModel = await UserModel.query().insertAndFetch({
        username,
      });
    }

    ctx.status = 200;
    ctx.response.body = {
      userId: userModel.id,
    };
  });

  router.post('/magnet', async (ctx) => {
    const {
      userId,
      magnetUri,
    } = ctx.request.body;

    const torrent = await torrentDownloader.startDownload(magnetUri);

    await transaction(TorrentModel.knex(), async trx => {
      const userModel = await UserModel.query(trx).findById(userId);

      const torrentModel = await TorrentModel.query(trx).findOne({
        infoHash: torrent.infoHash,
      });

      const relationModel = await userModel.$relatedQuery('torrents', trx).where({
        userId: userModel.id,
        torrentId: torrentModel.id,
      });

      if (relationModel.length) {
        return;
      }

      await userModel.$relatedQuery('torrents', trx).relate(torrentModel.id);
    });

    ctx.status = 200;
  });

  router.get('/torrents', async (ctx) => {
    const {
      userId,
    } = ctx.request.query;

    const {
      torrents
    } = await UserModel.query()
      .where({
        id: userId,
      })
      .eager({
        torrents: true,
      })
      .first();

    console.log(torrents.length);

    ctx.body = { torrents };
  });

  router.get('/files', async (ctx) => {
    const {
      torrentId,
    } = ctx.request.query;

    const files = await FileModel.query().where({
      torrentId,
    });

    console.log(files.length);

    ctx.body = { files };
  });

  app.use(router.routes());

  const port = 8080;

  return new Promise((resolve) => {
    app.listen(port, () => {
      console.log(`start server on port ${port}`);
      resolve();
    });
  });
}
