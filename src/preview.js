import fs from 'fs';

import _ from 'lodash';
import Color from 'color';
import sanitize from 'sanitize-filename';
import minimist from 'minimist';
import { createCanvas, loadImage, registerFont } from 'canvas';

import {
  validateColor,
  getColorValue,
  adjustRGBColor,
} from './utils.js';

import * as _config from './config.js';

const config = _config.default;
config.runtime = {};

const argv = minimist(process.argv.slice(2));

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

  if (argv.noframe !== undefined ? !argv.noframe : frame) {
    const strokeWidth = config.CANVAS_SIZE * config.CANVAS_FRAME_STROKE_WIDTH / 100;

    const frameX = imageX - (strokeWidth / 2);
    const frameY = imageY - (strokeWidth / 2);
    const frameWidth = imageWidth + strokeWidth;
    const frameHeight = imageHeight + strokeWidth;

    const colors = config.runtime.colors;
    const frameColor = colors.frame || colors.accent;

    context.strokeStyle = `rgb(${frameColor.join(', ')})`;
    context.lineWidth = strokeWidth;
  
    context.strokeRect(frameX, frameY, frameWidth, frameHeight);
  }

  if (argv.noshadow !== undefined ? !argv.noshadow : shadow) {
    const boxShadowColor = `rgba(0, 0, 0, 0.5)`;
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

const initColors = (colors, palette) => {
  return colors.reduce((acc, colorVar) => {
    let colorDefault = config[`DEFAULT_COLOR_${colorVar.toUpperCase()}`];
    let colorArg = argv[`${colorVar}color`];
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

    const darken = argv[`${colorVar}darken`];
    const lighten = argv[`${colorVar}lighten`];

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
  gradient.addColorStop(0, `rgb(${config.runtime.colors.start.join(',')})`);
  gradient.addColorStop(1, `rgb(${config.runtime.colors.end.join(',')})`);

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
};

async function applyVignetteEffect(canvas, _strength = 50, _color = [0, 0, 0]) {
  const context = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.max(centerX, centerY);

  let strength = _strength;
  let color = config.runtime.colors.vignette || _color;

  if (argv.vignettestrength !== undefined && argv.vignettestrength >= 0 && argv.vignettestrength <= 100) strength = +argv.vignettestrength;

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
  const logo = await loadImage('./images/play.png');

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

  const colors = config.runtime.colors;
  const logoColor = colors.logo || colors.accent;

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

export const createImage = async (imageUrl, palette, data) => {
  registerFont(config.FONT_TTF_PATH, { family: config.FONT_FAMILY });
  registerFont(config.FONT_TTF_PATH2, { family: config.FONT_FAMILY2 });

  const canvas = createCanvas(config.CANVAS_SIZE, config.CANVAS_SIZE);
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const context = canvas.getContext('2d', { alpha: true });

  config.runtime = {
    ...config.runtime,
    colors: initColors(config.COLORS, palette),
  };


  drawGradient(context, canvas, palette);

  if (!['0', 0, false, 'no'].includes(argv.vignette)) applyVignetteEffect(canvas);
  const logo = await drawLogo(context, palette);
  await drawImage(context, imageUrl, palette);

  const size = calculateFontSize(
    data.releaseName.toUpperCase(),
    config.CANVAS_SIZE * 0.6,
    `${DEFAULT_TEXT_OPTIONS.fontFamily}-Bold`,
    0,
    config.CANVAS_SIZE * 0.06,
    canvas,
  );

  const colors = config.runtime.colors;
  const textColor = colors.text || colors.accent;

  drawText(
    data.releaseName.toUpperCase(),
    canvas,
    {
      textColor,
      fontFamily: `${DEFAULT_TEXT_OPTIONS.fontFamily}-Bold`,
      fontSize: size,
    },
    (textWidth, textHeight, options) => {
      const x = (canvas.width - textWidth) / 2;

      const start = (config.CANVAS_SIZE * config.CANVAS_TOP_PADDING / 100) + (config.CANVAS_SIZE * config.CANVAS_FRAME_STROKE_WIDTH / 100) + (canvas.height * 0.6);

      const end = canvas.height - (config.CANVAS_SIZE * 0.04) - (config.CANVAS_SIZE * 0.088);

      const y = start + parseInt(1.2 * ((end - start - size - (config.CANVAS_SIZE * 0.034)) / 3.2));
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
      const y = end - textHeight - parseInt((end - start - size - (config.CANVAS_SIZE * 0.034)) / 3.2);
      return { x, y };
    },
  );

  // todo add UA logo if UA
  // ua.png

  // draw lastfm stats
  // drawText(
  //   `Last.fm listeners: ${data.listeners}`,
  //   canvas,
  //   {
  //     fontSize: 16,
  //     textColor,
  //   },
  // );

  // Convert the canvas to a PNG image buffer
  const buffer = canvas.toBuffer();

  // Save the image buffer to a file
  let filename = data.artistName + ' - ' + data.releaseName;
  // const filenameParams = Object.entries(_.pick(argv, config.COLORS.map(color => `${color}color`)))
  //   .map(([key, value]) => key + '=' + value)
  //   .join('_');

  // if (filenameParams) {
  //   filename += '_';
  //   filename += filenameParams;
  // }

  fs.writeFileSync(`./${config.PREVIEW_FOLDER_PATH}/${sanitize(filename)}.png`, buffer);

  console.log(`Preview for ${sanitize(filename)} is ready!`);
}
