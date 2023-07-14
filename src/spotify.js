import fs from 'fs';
import path from 'path';

import fetch from 'node-fetch';
import _ from 'lodash';
import minimist from 'minimist';
import sanitize from 'sanitize-filename';
import inquirer from 'inquirer';
import { distance as getDistance } from 'fastest-levenshtein';
import { createCanvas, loadImage, Image } from 'canvas';

import config, { configstore } from './config.js';

const args = minimist(process.argv.slice(2));

let accessToken;

const chooseAlbum = async (items, next) => {
  const choices = items.map(item => ({
    value: item.id,
    name: `[${item.album_type}] ${item.artists.map(({ name }) => name).join(', ')} - ${item.name} | ${item.total_tracks} tracks | ${new Date(item.release_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
  }));

  if (next) {
    choices.push({
      value: false,
      name: 'Show more results...',
    });
  }

  const { choice: id } = await inquirer.prompt([{
    type: 'list',
    name: 'choice',
    message: 'Choose your release',
    default: 0,
    choices,
  }]);

  if (id) return items.find(item => item.id === id) || false;

  return false;
};

const getAccessToken = async () => {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(configstore.get('SPOTIFY_CLIENT_ID') + ':' + configstore.get('SPOTIFY_CLIENT_SECRET')).toString('base64'),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();

  if (data.error === 'invalid_client') {
    configstore.delete('SPOTIFY_CLIENT_ID');
    configstore.delete('SPOTIFY_CLIENT_SECRET');

    return null;
  }

  return data.access_token;
};

export const searchAlbum = async query => {
  console.log('Spotify search request for query:', `'${query}'`);

  if (!accessToken) accessToken = await getAccessToken();

  if (!accessToken) {
    console.log('Broken Spotify client credentials. Run again to set credentials again.');
    process.exit(0);
  }

  const searchLimit = args.searchlimit || config.SEARCH_LIMIT || 3;
  const searchType = args.searchtype || config.SEARCH_TYPE || 'album';
  const searchMarket = args.spotifymarket || config.SEARCH_MARKET || 'UA';

  let offset = 0;
  let hasNext = true;
  let album;

  while (hasNext) {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${searchType}&limit=${searchLimit}&market=${searchMarket}`, {
      headers: { 'Authorization': 'Bearer ' + accessToken },
    });
    const data = await response.json();
    const items = data.albums.items.slice();
    const next = data.albums.next;

    album = await chooseAlbum(items, next);
  
    if (!album) {
      offset += searchLimit;
      continue;
    }
    break;
  }

  const filePath = path.join(config.SPOTIFY_FOLDER_PATH, `${album.id}.json`);
  fs.mkdirSync(config.SPOTIFY_FOLDER_PATH, { recursive: true });
  await fs.writeFileSync(filePath, JSON.stringify(album, null, 2));

  return album;
};
