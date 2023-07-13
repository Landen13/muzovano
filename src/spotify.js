import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import fetch from 'node-fetch';
import minimist from 'minimist';
import sanitize from 'sanitize-filename';
import { distance as getDistanceString } from 'fastest-levenshtein';
import { createCanvas, loadImage, Image } from 'canvas';

import * as _config from './config.js';

const config = _config.default;

const argv = minimist(process.argv.slice(2));

let accessToken;

async function getAccessToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

export const searchAlbum = async query => {
  console.log('Spotify search request for query:', `'${query}'`);

  if (!accessToken) accessToken = await getAccessToken();

  const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${argv.spotifytype || 'album'}&limit=${argv.spotifylimit || '3'}&market=${argv.spotifymarket || 'UA'}`, {
    headers: { 'Authorization': 'Bearer ' + accessToken },
  });

  const searchData = await response.json();
  let items = searchData.albums.items;

  let releaseType = null;

  if (argv.releasetype !== undefined && ['album', 'single', 'compilation'].includes(argv.releasetype)) releaseType = argv.releasetype;

  const sanitizedQuery = sanitize(query.trim());

  if (releaseType) items = items.filter(({ album_type }) => album_type === releaseType);

  items = items.filter(({ artists }) => artists[0].name.toLowerCase() === query.split(' - ')[0].toLowerCase());

  const itemsNames = items.map(item => `${item.artists[0].name} - ${item.name}`);

  let album;

  const distances = {};

  itemsNames.forEach((name, index) => {
    const distance = getDistanceString(query, name);
    if (distances[distance] === undefined) distances[distance] = [];
    distances[distance].push(items[index]);
  });

  const closestItems = distances[Math.min(...Object.keys(distances))];

  const releaseTypes = [
    'single',
    'album',
    'compilation',
  ];

  if (closestItems.length === 1) {
    album = closestItems[0];
  } else {
    album = _.orderBy(closestItems, ['release_date', item => _.indexOf(releaseTypes, item.album_type)], ['desc', 'asc'])[0];
  }

  fs.mkdirSync(config.SPOTIFY_FOLDER_PATH, { recursive: true });

  let filename = sanitizedQuery;
  // if (album.album_type !== 'album') {
  //   filename += '_';
  //   filename += album.album_type;
  // }
  filename += '.json';

  const filePath = path.join(config.SPOTIFY_FOLDER_PATH, filename);

  await fs.writeFileSync(filePath, JSON.stringify(album, null, 2));

  return album;
};
