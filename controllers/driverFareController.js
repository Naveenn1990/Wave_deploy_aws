// controllers/driverFareController.js
const DriverFare = require('../models/DriverFare');   // adjust the path if different

// ───────────────────────────────
// CREATE  (POST /api/driverfares)
exports.createDriverFare = async (req, res) => {
  try {
    const fare = await DriverFare.create(req.body);
    return res.status(201).json(fare);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// READ ALL  (GET /api/driverfares)
exports.getAllDriverFares = async (_req, res) => {
  try {
    const fares = await DriverFare.find();
    return res.json(fares);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// READ ONE  (GET /api/driverfares/:id)
exports.getDriverFare = async (req, res) => {
  try {
    const fare = await DriverFare.findById(req.params.id);
    if (!fare) return res.status(404).json({ error: 'Driver fare not found' });
    return res.json(fare);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// UPDATE  (PUT /api/driverfares/:id)
exports.updateDriverFare = async (req, res) => {
  try {
    const fare = await DriverFare.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!fare) return res.status(404).json({ error: 'Driver fare not found' });
    return res.json(fare);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// DELETE  (DELETE /api/driverfares/:id)
exports.deleteDriverFare = async (req, res) => {
  try {
    const fare = await DriverFare.findByIdAndDelete(req.params.id);
    if (!fare) return res.status(404).json({ error: 'Driver fare not found' });
    return res.json({ message: 'Driver fare deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
