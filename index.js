import 'dotenv/config';
// import pThrottle from 'p-throttle';
import Vibrant from 'node-vibrant';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import minimist from 'minimist';
import sanitize from 'sanitize-filename';

import { searchAlbum } from './src/spotify.js';
import { createImage } from './src/preview.js';
import { removeParentheses } from './src/utils.js';

import * as _config from './src/config.js';

const config = _config.default;

const argv = minimist(process.argv.slice(2));

async function main() {
  const query = (argv.artist && argv.release) ? `${argv.artist} - ${argv.release}` : (argv.q || argv.query);

  if (!query) {
    console.info('');
    console.info('Please use --artist and --release to continue.');
    console.info('');
    console.info('Alternative parameters are --q and --query.');
    console.info('');
    console.info('Examples:');
    console.info('  muzovano --artist=Igorrr --release=Hallelujah');
    console.info('  muzovano --artist="Avenged Sevenfold" --release="Life Is But a Dream"');
    console.info('  muzovano --q="Avenged Sevenfold - Life Is But a Dream');
    console.info('');
    console.info('Warning: for --q and --query use ` - ` as a separator between artist and release name.');
    return;
  }

  fs.mkdirSync(config.PREVIEW_FOLDER_PATH, { recursive: true });

  const sanitizedQuery = sanitize(query);

  const spotifyFilePath = path.join(config.SPOTIFY_FOLDER_PATH, `${sanitizedQuery}.json`);

  let spotifySearchData;

  // check if exists
  if (!fs.existsSync(spotifyFilePath)) {
    spotifySearchData = await searchAlbum(query);
  } else console.log('Data already downloaded! Reading from files...');

  spotifySearchData = spotifySearchData || JSON.parse(fs.readFileSync(spotifyFilePath, 'utf8'));

  const artistName = spotifySearchData.artists[0].name;
  const releaseName = spotifySearchData.name;
  const coverUrl = spotifySearchData.images[0].url;

  const palette = await Vibrant.from(coverUrl).getPalette();

  for (const color in palette) {
    if (Object.hasOwnProperty.call(palette, color)) {
      palette[color] = palette[color]._rgb.map(c => parseInt(c));
      console.log('\x1b[48;2;' + palette[color].join(';') + 'm  \x1b[0m', ':', color);
    }
  }

  await createImage(coverUrl, palette, {
    artistName,
    releaseName: removeParentheses(releaseName),
  });

  console.log('Successfully finished');
}

await main();
