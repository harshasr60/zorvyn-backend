const networkExpress = require('express');
const endpointRouter = networkExpress.Router();
const ledgerController = require('../controllers/recordController');
const imposeIdentity = require('../middleware/authMiddleware');
const assureAccess = require('../middleware/roleMiddleware');
const assessFormBody = require('../middleware/validationMiddleware');
const SchemaArchitect = require('joi');

// Rigid templates for intercepting bad payloads
const BlockCreationSchema = SchemaArchitect.object({
    txAmount: SchemaArchitect.number().min(0).required(),
    txType: SchemaArchitect.string().valid('income', 'expense').required(),
    txClassification: SchemaArchitect.string().required(),
    txExecutionDate: SchemaArchitect.date().iso().required(),
    txRemarks: SchemaArchitect.string().allow('', null).optional(),
});

const BlockMutationSchema = SchemaArchitect.object({
    txAmount: SchemaArchitect.number().min(0).optional(),
    txType: SchemaArchitect.string().valid('income', 'expense').optional(),
    txClassification: SchemaArchitect.string().optional(),
    txExecutionDate: SchemaArchitect.date().iso().optional(),
    txRemarks: SchemaArchitect.string().allow('', null).optional(),
}).min(1);

// Attach Authentication Lock globally on the Router
endpointRouter.use(imposeIdentity);

// Analytics capabilities bound routes
endpointRouter.get('/', assureAccess('Admin', 'Analyst'), ledgerController.streamLedgerData);
endpointRouter.get('/:nodeUUID', assureAccess('Admin', 'Analyst'), ledgerController.inspectLedgerNode);

// Operational capability bound routes 
endpointRouter.post('/', assureAccess('Admin'), assessFormBody(BlockCreationSchema), ledgerController.appendLedgerBlock);
endpointRouter.put('/:nodeUUID', assureAccess('Admin'), assessFormBody(BlockMutationSchema), ledgerController.mutateLedgerNode);
endpointRouter.delete('/:nodeUUID', assureAccess('Admin'), ledgerController.shadowPurgeNode);

module.exports = endpointRouter;
