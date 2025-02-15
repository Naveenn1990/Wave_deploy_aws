const express = require('express');
const router = express.Router();
const serviceHierarchyController = require('../controllers/serviceHierarchyController');

// Get complete service hierarchy
router.get('/service-hierarchy', serviceHierarchyController.getServiceHierarchy);

module.exports = router;
