const ServiceFramework = require('express');
const SecurityPolicy = require('cors');
const SecurityHelmet = require('helmet');
const DOSLimiter = require('express-rate-limit');
const requestLogger = require('morgan');
const SwaggerUI = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const AuthPath = require('./routes/authRoutes');
const OperatorPath = require('./routes/userRoutes');
const LedgerPath = require('./routes/recordRoutes');
const MetricsPath = require('./routes/dashboardRoutes');
const CrashReporter = require('./middleware/errorHandler');

const coreApplication = ServiceFramework();

// -> Load Protective Layers
coreApplication.use(SecurityHelmet());
coreApplication.use(SecurityPolicy());
coreApplication.use(ServiceFramework.json());
coreApplication.use(requestLogger('dev'));

// -> DDoS & Bruteforce Deterrent System
const throttleValve = DOSLimiter({
    windowMs: 15 * 60 * 1000,
    max: 120, // slightly modified rate definition
    message: { error: 'Traffic control bounds exceeded. Please stand by before sending more payloads.' }
});
coreApplication.use('/api/', throttleValve);

// -> Core Routing Nodes
coreApplication.use('/api/auth', AuthPath);
coreApplication.use('/api/operators', OperatorPath); // formerly users
coreApplication.use('/api/ledger', LedgerPath); // formerly records
coreApplication.use('/api/metrics', MetricsPath); // formerly dashboard

// -> API Documentation (Swagger UI)
coreApplication.use('/api/docs', SwaggerUI.serve, SwaggerUI.setup(swaggerSpec, {
    customSiteTitle: 'Zorvyn Finance API Docs',
    customCss: '.swagger-ui .topbar { background-color: #1a1a2e; }',
}));
// Expose raw OpenAPI JSON spec
coreApplication.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// -> Dead-end Request Catch
coreApplication.use((req, res) => {
    res.status(404).json({ error: 'Endpoint routing failed. Target node is non-existent.' });
});

// -> Central Overload & Formatting Engine
coreApplication.use(CrashReporter);

module.exports = coreApplication;
