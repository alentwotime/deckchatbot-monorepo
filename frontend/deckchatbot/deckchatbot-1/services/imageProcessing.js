const sharp = require('sharp');
const potrace = require('potrace');
const { extractMeasurementsFromGraphPaper } = require('../utils/geometry');

async function extractMeasurements(image) {
  try {
    const processedPath = `${image.path}-processed.png`;
    await sharp(image.path)
      .resize(800)
      .toFile(processedPath);

    const svgPath = `${processedPath}.svg`;
    potrace.trace(processedPath, { color: 'black' }, (err, svg) => {
      if (err) {
        throw err;
      }
      require('fs').writeFileSync(svgPath, svg);
    });

    return extractMeasurementsFromGraphPaper(svgPath);
  } catch (error) {
    console.error('Error extracting measurements:', error);
    throw new Error('Failed to extract measurements');
  }
}

module.exports = { extractMeasurements };