import startUp from "./startUp";
import fetch from 'node-fetch';
import { startApiServer } from "./startApiServer";
import TorrentModel from "./Model/TorrentModel";
import FileModel from "./Model/FileModel";

const magnet = 'magnet:?xt=urn:btih:a88fda5954e89178c372716a6a78b8180ed4dad3&dn=The+WIRED+CD+-+Rip.+Sample.+Mash.+Share&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fwired-cd.torrent';

async function login(username: string): Promise<number> {
  const response = await fetch('http://localhost:8080/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      username,
    }),
  });
  const { userId } = await response.json();
  return userId;
}

async function downloadMagnet(userId: number, magnetUri: string): Promise<void> {
  await fetch('http://localhost:8080/magnet', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      magnetUri,
    }),
  });
}


async function getUserTorrents(userId: number): Promise<TorrentModel[]> {
  const response = await fetch(`http://localhost:8080/torrents?userId=${userId}`);
  const { torrents } = await response.json();
  return torrents;
}

async function getFiles(torrentId: number): Promise<FileModel[]> {
  const response = await fetch(`http://localhost:8080/files?torrentId=${torrentId}`);
  const { files } = await response.json();
  return files;
}

async function run() {
  await startUp();
  await startApiServer();

  const userId = await login('namse');
  console.log(userId);

  await downloadMagnet(userId, magnet);

  const torrents = await getUserTorrents(userId);
  console.log(torrents);

  const files = await getFiles(torrents[0].id);
  console.log(files);
}

run().catch(err => console.error(err));
