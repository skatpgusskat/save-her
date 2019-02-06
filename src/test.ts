import TorrentDownloader from "./TorrentDownloader";

const torrentDownloader = new TorrentDownloader();
torrentDownloader.addMagnet('magnet:?xt=urn:btih:05E76C8B1795CE49E203BE4C39E378F7A97CBED5&dn=2018-04-18-raspbian-stretch-lite.zip&tr=http%3a%2f%2ftracker.raspberrypi.org%3a6969%2fannounce');

console.log('hi');