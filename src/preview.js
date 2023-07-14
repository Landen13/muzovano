import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';

import _ from 'lodash';
import Color from 'color';
import Vibrant from 'node-vibrant';
import sanitize from 'sanitize-filename';
import minimist from 'minimist';
import { createCanvas, loadImage, registerFont } from 'canvas';
import { dirname } from 'dirname-filename-esm';

import {
  validateColor,
  getColorValue,
  adjustRGBColor,
} from './utils.js';

import config from './config.js';

let COLORS;

const CURRENT_DIR = process.cwd();
const PACKAGE_DIR = appRoot.toString();

const args = minimist(process.argv.slice(2));

const DEFAULT_TEXT_OPTIONS = {
  fontSize: config.CANVAS_SIZE * 0.034,
  fontFamily: 'NeutralFace',
  textColor: '#000',
};

const drawImage = async (context, url, palette, frame = true, shadow = true) => {
  const image = await loadImage(url);

  // Draw the image on the canvas
  const imageWidth = config.CANVAS_SIZE * 0.6;
  const imageHeight = imageWidth;
  const imageX = (config.CANVAS_SIZE - imageWidth) / 2;
  const imageY = config.CANVAS_SIZE * config.CANVAS_TOP_PADDING / 100;

  if (args.noframe !== undefined ? !args.noframe : frame) {
    const strokeWidth = config.CANVAS_SIZE * config.CANVAS_FRAME_STROKE_WIDTH / 100;

    const frameX = imageX - (strokeWidth / 2);
    const frameY = imageY - (strokeWidth / 2);
    const frameWidth = imageWidth + strokeWidth;
    const frameHeight = imageHeight + strokeWidth;

    const frameColor = COLORS.frame || COLORS.accent;

    context.strokeStyle = `rgb(${frameColor.join(', ')})`;
    context.lineWidth = strokeWidth;
  
    context.strokeRect(frameX, frameY, frameWidth, frameHeight);
  }

  if (args.noshadow !== undefined ? !args.noshadow : shadow) {
    const boxShadowColor = `rgba(${COLORS.shadow || [0,0,0].join(',')}, 0.5)`;
    const boxShadowBlur = config.CANVAS_SIZE * config.SHADOW_SIZE / 100;
    const boxShadowOffsetX = 0;
    const boxShadowOffsetY = 0;

    context.shadowColor = boxShadowColor;
    context.shadowBlur = boxShadowBlur;
    context.shadowOffsetX = boxShadowOffsetX;
    context.shadowOffsetY = boxShadowOffsetY;
    // Create a rectangle using the image dimensions
    context.beginPath();
    context.rect(imageX, imageY, imageWidth, imageHeight);
    context.closePath();
    // Fill the rectangle with a solid color
    context.fillStyle = 'rgba(255, 255, 255, 1)';
    context.fill();
    // Reset the shadow properties
    context.shadowColor = 'rgba(0, 0, 0, 0)';
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
  }

  context.drawImage(image, imageX, imageY, imageWidth, imageHeight);
};

const initColors = (colorNames, palette) => {
  return colorNames.reduce((acc, colorVar) => {
    let colorDefault = config[`DEFAULT_COLOR_${colorVar.toUpperCase()}`];
    let colorArg = args[`${colorVar}color`];
    let colorValue = colorArg || colorDefault;

    function parseValue(value) {
      // Vibrant number
      if (value <= config.VIBRANT_ORDER.length) {
        return palette[config.VIBRANT_ORDER[value - 1]];
      }

      // Vibrant named
      if (config.VIBRANT_ORDER.includes(value)) {
        return palette[value];
      }

      // Custom color
      if (validateColor(value)) {
        return getColorValue(value);
      }
    };

    let color = parseValue(colorValue) || parseValue(colorDefault);

    if (!color) return acc;

    // Color adjustments
    let percentage = 0;

    const darken = args[`${colorVar}darken`];
    const lighten = args[`${colorVar}lighten`];

    if (darken && darken >= 0 && darken <=100) {
      percentage -= darken;
    }
    if (lighten && lighten >= 0 && lighten <=100) {
      percentage += lighten;
    }
    if (percentage !== 0) {
      color = adjustRGBColor(color, percentage);
    }

    return {
      ...acc,
      [colorVar]: color,
    };
  }, {});
};

const drawGradient = (context, canvas, palette) => {
  // Create a vertical gradient
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);

  // Gradient color stops
  gradient.addColorStop(0, `rgb(${COLORS.start.join(',')})`);
  gradient.addColorStop(1, `rgb(${COLORS.end.join(',')})`);

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
};

async function applyVignetteEffect(canvas, _strength = 50, _color = [0, 0, 0]) {
  const context = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.max(centerX, centerY);

  let strength = _strength;
  let color = COLORS.vignette || _color;

  if (args.vignettestrength !== undefined && args.vignettestrength >= 0 && args.vignettestrength <= 100) strength = +args.vignettestrength;

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  const colorValue = getColorValue(color);
  const [r, g, b] = colorValue;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const offset = (y * canvas.width + x) * 4;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const opacity = 1 - (distance / radius) * (strength / 100);

      pixels[offset] = Math.round(pixels[offset] * opacity + r * (1 - opacity));
      pixels[offset + 1] = Math.round(pixels[offset + 1] * opacity + g * (1 - opacity));
      pixels[offset + 2] = Math.round(pixels[offset + 2] * opacity + b * (1 - opacity));
    }
  }

  context.putImageData(imageData, 0, 0);
}

const drawLogo = async (context, palette) => {
  // Load the logo image
  const logo = await loadImage(path.resolve(PACKAGE_DIR, 'images/play.png'));

  const logoWidth = config.CANVAS_SIZE * 0.514;
  const logoHeight = config.CANVAS_SIZE * 0.088;

  // Create a temporary canvas with the same dimensions as the logo image
  const tempCanvas = createCanvas(logoWidth, logoHeight);
  const tempContext = tempCanvas.getContext('2d');

  tempContext.fillStyle = 'rgba(255, 255, 255, 0)';
  tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Draw the logo image on the temporary canvas
  tempContext.drawImage(logo, 0, 0, logoWidth, logoHeight);

  // Get the image data from the temporary canvas
  const imageData = tempContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

  // Modify the pixel colors while preserving the alpha opacity state
  const { data: pixels } = imageData;

  const logoColor = COLORS.logo || COLORS.accent;

  for (let i = 0; i < pixels.length; i += 4) {
    // Modify the color channels (red, green, blue)
    if (pixels[i + 3] > 0) {
      pixels[i] = logoColor[0]; // Red
      pixels[i + 1] = logoColor[1]; // Green
      pixels[i + 2] = logoColor[2]; // Blue
    }
    // The alpha channel remains unchanged (preserving transparency)
  }

  tempContext.putImageData(imageData, 0, 0);

  // Put the modified image data onto the canvas
  const x = (config.CANVAS_SIZE - tempCanvas.width) / 2;
  const y = config.CANVAS_SIZE - tempCanvas.height - (config.CANVAS_SIZE * 0.04);

  context.drawImage(tempCanvas, x, y);

  return logo;
};

const calculateFontSize = (text, desiredWidth, fontFamily, minFontSize, maxFontSize, canvas) => {
  const context = canvas.getContext('2d');
  let fontSize = maxFontSize;

  while (fontSize >= minFontSize) {
    context.font = `${fontSize}px ${fontFamily}`;
    const measuredWidth = context.measureText(text).width;

    if (measuredWidth <= desiredWidth) {
      return fontSize;
    }

    fontSize--;
  }

  // If the desired width cannot be achieved within the given font size range, return the minimum font size
  return minFontSize;
}

export const drawText = (text, canvas, userOptions = {}, positionCallback) => {
  const context = canvas.getContext('2d');

  // Define the text properties
  const options = Object.assign({}, DEFAULT_TEXT_OPTIONS, userOptions);

  // Set the text properties
  const backupFillStyle = context.fillStyle;
  context.fillStyle = Color.rgb(options.textColor).string();
  const backupFont = context.font;
  context.font = `${options.fontSize}px ${options.fontFamily}`;

  // Calculate the text position
  const { width: textWidth } = context.measureText(text);
  const textHeight = options.fontSize;

  let x = 0;
  let y = options.fontSize;

  if (options.x !== undefined) x = options.x;
  if (options.y !== undefined) y = options.y;

  if (typeof positionCallback === 'function') {
    const { x: _x, y: _y } = positionCallback(textWidth, textHeight, options);
    x = _x;
    y = _y;
  }

  // Draw the text on the canvas
  context.textBaseline = 'top';
  context.fillText(text, x, y);
  context.fillStyle = backupFillStyle;
  context.font = backupFont;
};

const getPaletteFromImage = async imageUrl => {
  const palette = await Vibrant.from(imageUrl).getPalette();

  for (const color in palette) {
    if (Object.hasOwnProperty.call(palette, color)) {
      palette[color] = palette[color]._rgb.map(c => parseInt(c));
    }
  }

  return palette;
};

const logPalette = palette => {
  for (const color in palette) {
    console.log('\x1b[48;2;' + palette[color].join(';') + 'm  \x1b[0m', ':', color);
  }
}

export const createImage = async (imageUrl, data) => {
  registerFont(path.resolve(PACKAGE_DIR, config.FONT_TTF_PATH), { family: config.FONT_FAMILY });
  registerFont(path.resolve(PACKAGE_DIR, config.FONT_TTF_PATH2), { family: config.FONT_FAMILY2 });

  console.log('Using cover from:', imageUrl);
  console.log('');

  const palette = await getPaletteFromImage(imageUrl);

  console.log('Extracted colors from album cover:');
  logPalette(palette);
  console.log('');

  const canvas = createCanvas(config.CANVAS_SIZE, config.CANVAS_SIZE);
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const context = canvas.getContext('2d', { alpha: true });

  const colorsSymbol = Symbol();

  config[colorsSymbol] = initColors(config.COLORS, palette);

  COLORS = config[colorsSymbol];

  drawGradient(context, canvas, palette);

  if (args.novignette !== undefined && !args.novignette) {
    applyVignetteEffect(canvas);
  }

  const logo = await drawLogo(context, palette);
  await drawImage(context, imageUrl, palette);

  const releaseFontSize = calculateFontSize(
    data.releaseName.toUpperCase(),
    config.CANVAS_SIZE * 0.6,
    `${DEFAULT_TEXT_OPTIONS.fontFamily}-Bold`,
    0,
    config.CANVAS_SIZE * 0.06,
    canvas,
  );

  const textColor = COLORS.text || COLORS.accent;

  drawText(
    data.releaseName.toUpperCase(),
    canvas,
    {
      textColor,
      fontFamily: `${DEFAULT_TEXT_OPTIONS.fontFamily}-Bold`,
      fontSize: releaseFontSize,
    },
    (textWidth, textHeight, options) => {
      const x = (canvas.width - textWidth) / 2;

      const start = (config.CANVAS_SIZE * config.CANVAS_TOP_PADDING / 100) + (config.CANVAS_SIZE * config.CANVAS_FRAME_STROKE_WIDTH / 100) + (canvas.height * 0.6);

      const end = canvas.height - (config.CANVAS_SIZE * 0.04) - (config.CANVAS_SIZE * 0.088);

      const y = start + parseInt(1.2 * ((end - start - releaseFontSize - (config.CANVAS_SIZE * 0.034)) / 3.2));
      return { x, y };
    },
  );

  drawText(
    data.artistName.toUpperCase(),
    canvas,
    { textColor },
    (textWidth, textHeight, options) => {
      const x = (canvas.width - textWidth) / 2;
      const start = (config.CANVAS_SIZE * 0.06) + (config.CANVAS_SIZE * config.CANVAS_FRAME_STROKE_WIDTH / 100) + (canvas.height * 0.6);
      const end = canvas.height - (config.CANVAS_SIZE * 0.04) - (config.CANVAS_SIZE * 0.088);
      const y = end - textHeight - parseInt((end - start - releaseFontSize - (config.CANVAS_SIZE * 0.034)) / 3.2);
      return { x, y };
    },
  );

  // Convert the canvas to a PNG image buffer
  const buffer = canvas.toBuffer();
  const filename = sanitize(data.artistName + ' - ' + data.releaseName);
  const generatedPath = path.resolve(CURRENT_DIR, config.PREVIEW_FOLDER_PATH, `${filename}.png`);

  fs.mkdirSync(path.resolve(CURRENT_DIR, config.PREVIEW_FOLDER_PATH), { recursive: true });
  fs.writeFileSync(generatedPath, buffer);

  console.log(`Preview for ${sanitize(filename)} is ready!`);
  console.log(generatedPath);
  console.log('');

  return {
    generatedPath,
    palette,
  };
};
