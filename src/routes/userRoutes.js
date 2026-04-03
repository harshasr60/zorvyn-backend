const pathway = require('express').Router();
const nodeController = require('../controllers/userController');
const enforceIdentitySession = require('../middleware/authMiddleware');
const requireClearance = require('../middleware/roleMiddleware');
const evaluatePayload = require('../middleware/validationMiddleware');
const JoiCore = require('joi');

const stateOverrideBlueprint = JoiCore.object({
    clearanceTarget: JoiCore.string().valid('Viewer', 'Analyst', 'Admin').optional(),
    newStatusBinding: JoiCore.string().valid('Active', 'Inactive').optional(),
}).min(1);

// Mount the defense layers at the top level of this cluster
pathway.use(enforceIdentitySession, requireClearance('Admin'));

// Attach endpoints
pathway.get('/', nodeController.auditNetworkProfiles);
pathway.put('/:id', evaluatePayload(stateOverrideBlueprint), nodeController.overrideOperatorState);

module.exports = pathway;
