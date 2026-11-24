import { seasonalFrameMetadata } from "./seasonal-frame-art.js";

export const frames = seasonalFrameMetadata.map((frame) => ({
  ...frame,
  favorite: false
}));
