
import { loadImage } from 'canvas';

import { constructOptions }  from '../helpers/fields';
import { getColorValue } from '../utils.js';

const PICTURE_DEFAULT_OPTIONS = {
  frame: false,
  frameThickness: 2.5,
  frameColor: white,
  shadow: false,
  shadowSpread: 7.5,
  blur: false,
};

const checkRequiredFields = options => {
  if (!(options.size || (options.width && options.height))) {
    console.warn('no Picture size provided.');
    return false;
  }

  if (!options.source) {
    console.warn('no Picture source provided.');
    return false;
  }

  return true;
};

{
  size: 60,
  frame: true,
  shadow: true,
}

export default async (canvas, userOptions) => {
  const options = constructOptions(PICTURE_DEFAULT_OPTIONS, userOptions);
  const isValid = checkRequiredFields(options);
  if (!isValid) return false;

  // const drawImage = async (context, url, palette) => {

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const image = await loadImage(options.source);
  const imageWidth = (options.width || options.size) * canvasWidth / 100;
  const imageHeight = (options.height || options.size) * canvasHeight / 100;
  let tempCanvasWidth = imageWidth;
  let tempCanvasHeight = imageHeight;

  let frameThickness = 0;

  if (options.frame) {
    frameThickness = ((imageWidth + imageHeight) / 2) * options.frameThickness / 100;
    tempCanvasWidth += frameThickness * 2;
    tempCanvasHeight += frameThickness * 2;
  }

  let shadowSpread = 0;

  if (options.shadow) {
    shadowSpread = ((imageWidth + imageHeight) / 2) * options.shadowSpread / 100;
    tempCanvasWidth += shadowSpread * 2;
    tempCanvasHeight += shadowSpread * 2;
  }

  const imageX = frameThickness + shadowSpread;
  const imageY = frameThickness + shadowSpread;

  const tempCanvas = createCanvas(tempCanvasWidth, tempCanvasHeight);
  const tempContext = tempCanvas.getContext('2d');

  if (options.shadow) {
    const shadowX = 0;
    const shadowY = 0;
    const shadowWidth = imageWidth + frameThickness + shadowSpread;
    const shadowHeight = imageWidth + frameThickness + shadowSpread;
    const shadowColor = options.shadowColor;

    const shadowColor = `rgba(${getColorValue(options.shadowColor).join(',')},0.5)`;
    const shadowSpread = options.shadowSpread;
  }

  if (options.frame) {
    const frameX = shadowSpread;
    const frameY = shadowSpread;
    const frameWidth = imageWidth + frameThickness;
    const frameHeight = imageHeight + frameThickness;
    const frameColor = options.frameColor;



    tempContext.strokeStyle = `rgb(${getColorValue(options.frameColor).join(',')})`;
    tempContext.lineWidth = frameThickness;
    tempContext.strokeRect(frameX, frameY, frameWidth, frameHeight);
  }

  // calc coordinates
  let edges = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };

  switch (options.horizontalAlignment) {
    case 'left':
      edges.left = 0;
      break;
    case 'right':
      edges.right = 0;
      break;
    case 'center':
      edges.left = (canvasWidth - imageWidth) / 2
  }

  // switch (options.)
  // const imageX = ;
  const imageY = canvasHeight * config.CANVAS_TOP_PADDING / 100;

  if (!args.noframe) {
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

  if (!args.noshadow) {
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