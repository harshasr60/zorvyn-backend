const routerProxy = require('express').Router();
const sessionOrchestrator = require('../controllers/authController');
const inputEvaluator = require('../middleware/validationMiddleware');
const JoiCore = require('joi');

// Contract definition for initial entry
const enrollmentBlueprint = JoiCore.object({
    username: JoiCore.string().min(3).max(30).required(),
    email: JoiCore.string().email().required(),
    password: JoiCore.string().min(6).required(),
    role: JoiCore.string().valid('Viewer', 'Analyst', 'Admin').optional(),
});

// Contract definition for establishing sessions
const synchronizationBlueprint = JoiCore.object({
    email: JoiCore.string().email().required(),
    password: JoiCore.string().required(),
});

// Binding the endpoints to their orchestration logic
routerProxy.post('/register', inputEvaluator(enrollmentBlueprint), sessionOrchestrator.enrolOperator);
routerProxy.post('/login', inputEvaluator(synchronizationBlueprint), sessionOrchestrator.initiateSession);

module.exports = routerProxy;
