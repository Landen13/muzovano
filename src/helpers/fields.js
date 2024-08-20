export const POSITIONAL_FIELDS = {
  horizontalAlignment: 'left',
  verticalAlignment: 'top',

  topOffset: 0,
  topOffsetTarget: null,

  leftOffset: 0,
  leftOffsetTarget: null,

  rightOffset: 0,
  rightOffsetTarget: null,

  bottomOffset: 0,
  bottomOffsetTarget: null,

  shiftX: 0,
  shiftY: 0,
};

export const constructOptions = (componentFields, userOptions) => Object.assign({}, componentFields, userOptions);