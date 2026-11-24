export function buildCssFilter(values) {
  const exposure = 1 + (Number(values.exposure) || 0) / 100;
  const warmth = Number(values.warmth) || 0;
  return [
    `brightness(${((Number(values.brightness) || 100) * exposure) / 100})`,
    `contrast(${(Number(values.contrast) || 100) / 100})`,
    `saturate(${(Number(values.saturation) || 100) / 100})`,
    `sepia(${Math.max(0, warmth) / 100})`,
    `hue-rotate(${warmth < 0 ? -8 : 0}deg)`,
    `blur(${(Number(values.blur) || 0) * 0.4}px)`
  ].join(" ");
}

export function applyCanvasFilter(context, values) {
  const exposure = 1 + (Number(values.exposure) || 0) / 100;
  const warmth = Number(values.warmth) || 0;
  context.filter = [
    `brightness(${((Number(values.brightness) || 100) * exposure) / 100})`,
    `contrast(${(Number(values.contrast) || 100) / 100})`,
    `saturate(${(Number(values.saturation) || 100) / 100})`,
    `sepia(${Math.max(0, warmth) / 100})`,
    `hue-rotate(${warmth < 0 ? -8 : 0}deg)`,
    `blur(${(Number(values.blur) || 0) * 0.4}px)`
  ].join(" ");
}
