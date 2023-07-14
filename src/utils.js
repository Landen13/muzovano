import Color from 'color';
import colorConvert from 'color-convert';

// validate if a color is valid
// HEX (3 and 6 digits), RGB/RGBA strings and named css colors
export const validateColor = color => {
  const hexRegex = /^#([A-Fa-f0-9]{6})$/;
  const hex3Regex = /^#([A-Fa-f0-9]{3})$/;
  const rgbRegex = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*(\d+(\.\d+)?))?\s*\)$/;

  if (
    hexRegex.test(color)
    || hex3Regex.test(color)
    || rgbRegex.test(color)
    || colorConvert.keyword.rgb(color)
  ) {
    return true;
  }

  return false;
};

// extract RGB color values as an array
// supports HEX (3 and 6 digits), RGB/RGBA strings and named css colors
export const getColorValue = color => {
  if (Array.isArray(color) && color.length === 3) return color;
  const hexRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
  const rgbRegex = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*(\d+(\.\d+)?))?\s*\)$/;

  if (hexRegex.test(color)) {
    const hexDigits = color.slice(1); // Remove the leading #
    let r, g, b;

    if (hexDigits.length === 3) {
      r = parseInt(hexDigits[0] + hexDigits[0], 16);
      g = parseInt(hexDigits[1] + hexDigits[1], 16);
      b = parseInt(hexDigits[2] + hexDigits[2], 16);
    } else {
      r = parseInt(hexDigits.slice(0, 2), 16);
      g = parseInt(hexDigits.slice(2, 4), 16);
      b = parseInt(hexDigits.slice(4, 6), 16);
    }

    return [r, g, b];
  } else if (rgbRegex.test(color)) {
    const [, r, g, b] = color.match(rgbRegex);
    return [parseInt(r, 10), parseInt(g, 10), parseInt(b, 10)];
  } else if (colorConvert.keyword.rgb(color)) {
    return colorConvert.keyword.rgb(color);
  }

  throw new Error(`Invalid color format: ${color}`);
};

// adjusts lightness of rgb color by percentage
// can be negative and positive (-100 / +100);
export const adjustRGBColor = (rgb, percentage) => {
  if (!percentage) return rgb;
  return Color.rgb(rgb)[percentage > 0 ? 'lighten' : 'darken'](Math.abs(percentage) / 100).rgb().array().map(item => parseInt(item));
};

export const removeParentheses = str => {
  const regex = /\([^)]*\)$/;
  return str.replace(regex, "").trim();
};
