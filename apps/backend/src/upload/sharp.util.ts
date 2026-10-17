import sharp = require('sharp');

sharp.concurrency(1);
sharp.cache(false);

export const SHARP_INPUT_PIXEL_LIMIT = 50_000_000;

export default sharp;
