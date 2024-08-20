#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { packageDirectorySync } from 'pkg-dir';

const PACKAGE_DIR = packageDirectorySync({ cwd: new URL(import.meta.url) });
const { version } = JSON.parse(fs.readFileSync(path.resolve(PACKAGE_DIR, 'package.json')));

const args = minimist(process.argv.slice(2));

if (process.argv.length <= 2) {
  console.log('Usage: muzovano <album>');
  console.log('Alternatives:');
  console.log('  --q=<album> - Search for albums on Spotify');
  // console.log('  set-api-key - Set the Spotify API key');
  // console.log('For more information, run impressivesound --help');
  process.exit(0);
}

if (args.v || args.version) {
  console.log(version);
}

// process.exit(0);

// npm
import 'dotenv/config';
import inquirer from 'inquirer';
import fetch from 'node-fetch';
import minimist from 'minimist';
import sanitize from 'sanitize-filename';

// local
import { searchAlbum } from './src/spotify.js';
import { createImage } from './src/preview.js';
import { removeParentheses } from './src/utils.js';
import config, { configstore } from './src/config.js';

const COMMAND = args._.length > 1 ? args._[0] : null;

const getSearchQuery = () => {
  if (args.artist && args.title) return args.artist + ' - ' + args.title;
  if (args.q) return args.q;
  if (args.query) return args.query;
  if (args.release) return args.release;
  if (args.album) return args.album;
  if (args.single) return args.single;
  if (COMMAND) return args._[1];
  return args._[0] || null;
};

const promptUser = async () => {
  const {
    clientId,
    clientSecret,
  } = await inquirer.prompt([
    {
      type: 'input',
      name: 'clientId',
      message: 'Enter your Spotify Client ID:',
      validate: valueRaw => {
        const value = valueRaw.trim();
        if (value === '') return 'Spotify Client ID is required.';
        if (
          value.length < 32
          || value.length > 32
        ) return 'Spotify Client ID must have 32 characters.';
        return true;
      },
    },
    {
      type: 'input',
      name: 'clientSecret',
      message: 'Enter your Spotify Client Secret:',
      validate: valueRaw => {
        const value = valueRaw.trim();
        if (value === '') return 'Spotify Client Secret is required.';
        if (
          value.length < 32
          || value.length > 32
        ) return 'Spotify Client Secret must have 32 characters.';
        return true;
      },
    },
  ]);

  configstore.set('SPOTIFY_CLIENT_ID', clientId);
  configstore.set('SPOTIFY_CLIENT_SECRET', clientSecret);
}

const initClientTokens = async () => {
  const checkTokensAvailability = () => configstore.get('SPOTIFY_CLIENT_ID') && configstore.get('SPOTIFY_CLIENT_SECRET');
  if (!checkTokensAvailability()) {
    await promptUser();
  }
  if (!checkTokensAvailability()) {
    configstore.set('SPOTIFY_CLIENT_ID', process.env.SPOTIFY_CLIENT_ID);
    configstore.set('SPOTIFY_CLIENT_SECRET', process.env.SPOTIFY_CLIENT_SECRET);
  }

  return checkTokensAvailability();
}

async function main() {
  await initClientTokens();

  const searchQuery = getSearchQuery();
  const album = await searchAlbum(sanitize(searchQuery));
  const artistName = album.artists[0].name;
  const releaseName = album.name;
  const coverUrl = album.images[0].url;

  const {
    generatedPath,
    palette,
  } = await createImage(coverUrl, {
    artistName,
    releaseName: removeParentheses(releaseName),
  });

  console.log('Done');
}

await main();
