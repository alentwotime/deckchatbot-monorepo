const { calculateSteps, ftInToDecimal } = require('../src/utils/geometry');

function calculateStepsEndpoint(req, res) {
  const { height } = req.body;
  const heightFt = ftInToDecimal(height);
  if (!heightFt || isNaN(heightFt) || heightFt <= 0) {
    return res.status(400).json({
      errors: [{ msg: 'Valid height is required' }]
    });
  }
  const steps = calculateSteps(heightFt * 12); // convert feet to inches
  res.json({ steps });
}

module.exports = { calculateStepsEndpoint };
