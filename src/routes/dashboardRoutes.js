const expressGateway = require('express');
const routingHub = expressGateway.Router();
const metricsEngine = require('../controllers/dashboardController');
const imposeIdentity = require('../middleware/authMiddleware');
const assureAccess = require('../middleware/roleMiddleware');

// Dashboard access needs a valid operator identity, 
// no matter if it's Admin, Analyst, or standard Viewer.
routingHub.use(imposeIdentity, assureAccess('Viewer', 'Analyst', 'Admin'));

routingHub.get('/radar', metricsEngine.compileBusinessRadar);

module.exports = routingHub;
