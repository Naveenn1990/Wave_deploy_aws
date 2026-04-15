// routes/driverFareRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/driverFareController');

router
  .route('/')
  .post(ctrl.createDriverFare)
  .get(ctrl.getAllDriverFares);

router
  .route('/:id')
  .get(ctrl.getDriverFare)
  .put(ctrl.updateDriverFare)
  .delete(ctrl.deleteDriverFare);

module.exports = router;
