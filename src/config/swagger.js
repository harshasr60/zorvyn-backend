const swaggerJsdoc = require('swagger-jsdoc');

const definition = {
    openapi: '3.0.0',
    info: {
        title: 'Financial Orchestration & RBAC Backend Engine',
        version: '1.0.0',
        description: `
A finance dashboard backend with role-based access control.

**Roles & Permissions:**
| Role | Register/Login | View Ledger | Manage Ledger | Radar Metrics | Manage Operators |
|---|---|---|---|---|---|
| Viewer | ✅ | ❌ | ❌ | ✅ | ❌ |
| Analyst | ✅ | ✅ | ❌ | ✅ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |

**Get started:** Register via \`POST /api/auth/register\`, then use the returned token in the **Authorize** button.
    `,
        contact: {
            name: 'GitHub Repository',
            url: 'https://github.com/harshasr60/zorvyn-backend',
        },
    },
    servers: [
        { url: 'http://localhost:3000', description: 'Local Development' },
        { url: 'https://zorvyn-backend.onrender.com', description: 'Production (Render)' },
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter the JWT token obtained from /api/auth/login',
            },
        },
        schemas: {
            RegisterRequest: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                    username: { type: 'string', example: 'john_doe', minLength: 3 },
                    email: { type: 'string', format: 'email', example: 'john@example.com' },
                    password: { type: 'string', minLength: 6, example: 'secret123' },
                    role: { type: 'string', enum: ['Viewer', 'Analyst', 'Admin'], example: 'Viewer' },
                },
            },
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'john@example.com' },
                    password: { type: 'string', example: 'secret123' },
                },
            },
            AuthResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    token: { type: 'string', description: 'JWT Bearer token' },
                    operatorProfile: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            alias: { type: 'string' },
                            contact: { type: 'string' },
                            clearance: { type: 'string', enum: ['Viewer', 'Analyst', 'Admin'] },
                        },
                    },
                },
            },
            LedgerBlock: {
                type: 'object',
                properties: {
                    ledgerId: { type: 'string', format: 'uuid' },
                    transactionValue: { type: 'number', example: 2500.00 },
                    movementType: { type: 'string', enum: ['income', 'expense'] },
                    classification: { type: 'string', example: 'Salary' },
                    executionDate: { type: 'string', format: 'date', example: '2026-04-01' },
                    additionalRemarks: { type: 'string', example: 'Monthly salary credit' },
                    obsolete: { type: 'boolean', example: false },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
            CreateLedgerRequest: {
                type: 'object',
                required: ['txAmount', 'txType', 'txClassification', 'txExecutionDate'],
                properties: {
                    txAmount: { type: 'number', minimum: 0, example: 1500.00 },
                    txType: { type: 'string', enum: ['income', 'expense'], example: 'income' },
                    txClassification: { type: 'string', example: 'Freelance' },
                    txExecutionDate: { type: 'string', format: 'date', example: '2026-04-03' },
                    txRemarks: { type: 'string', example: 'Client project payment' },
                },
            },
            RadarSummary: {
                type: 'object',
                properties: {
                    temporalSpan: {
                        type: 'object',
                        properties: {
                            from: { type: 'string' },
                            until: { type: 'string' },
                        },
                    },
                    healthVitals: {
                        type: 'object',
                        properties: {
                            totalGross: { type: 'number' },
                            totalOverhead: { type: 'number' },
                            computedBalance: { type: 'number' },
                        },
                    },
                    segmentAnalysis: { type: 'object' },
                    eventFootprints: { type: 'array', items: { $ref: '#/components/schemas/LedgerBlock' } },
                },
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    error: { type: 'string' },
                },
            },
        },
    },
    tags: [
        { name: 'Auth', description: 'Operator registration and session management' },
        { name: 'Operators', description: 'Admin-only user management (requires Admin token)' },
        { name: 'Ledger', description: 'Financial transaction records (Admin/Analyst)' },
        { name: 'Metrics', description: 'Real-time aggregated dashboard radar (all roles)' },
    ],
    paths: {
        '/api/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Register a new operator',
                description: 'Creates a new user. First Admin can be registered without a token. Subsequent Admins require an existing Admin token.',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
                },
                responses: {
                    201: { description: 'Operator enrolled', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
                    400: { description: 'Validation error or duplicate email/username', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                    403: { description: 'Only admins can create other admins', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                },
            },
        },
        '/api/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Login and receive a JWT token',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
                },
                responses: {
                    200: { description: 'Session synchronized', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
                    401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                    403: { description: 'Account suspended', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                },
            },
        },
        '/api/operators': {
            get: {
                tags: ['Operators'],
                summary: 'List all registered operators',
                description: 'Returns all user nodes. **Admin only.**',
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: 'List of operators', content: { 'application/json': { schema: { type: 'object', properties: { nodes: { type: 'array' } } } } } },
                    401: { description: 'Unauthorized' },
                    403: { description: 'Insufficient clearance' },
                },
            },
        },
        '/api/operators/{id}': {
            put: {
                tags: ['Operators'],
                summary: 'Update operator role or status',
                description: 'Override an operator\'s clearance tier or account standing. **Admin only.**',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    clearanceTarget: { type: 'string', enum: ['Viewer', 'Analyst', 'Admin'] },
                                    newStatusBinding: { type: 'string', enum: ['Active', 'Inactive'] },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Operator state updated' },
                    400: { description: 'Self-deactivation blocked or invalid payload' },
                    404: { description: 'Operator not found' },
                },
            },
        },
        '/api/ledger': {
            get: {
                tags: ['Ledger'],
                summary: 'Stream paginated ledger blocks',
                description: 'Retrieve financial records with filtering. **Admin and Analyst only.**',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'pageSlice', in: 'query', schema: { type: 'integer', default: 1 } },
                    { name: 'chunkSize', in: 'query', schema: { type: 'integer', default: 10 } },
                    { name: 'filterType', in: 'query', schema: { type: 'string', enum: ['income', 'expense'] } },
                    { name: 'filterTag', in: 'query', schema: { type: 'string' }, description: 'Filter by category' },
                    { name: 'horizonStart', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Start date (YYYY-MM-DD)' },
                    { name: 'horizonEnd', in: 'query', schema: { type: 'string', format: 'date' }, description: 'End date (YYYY-MM-DD)' },
                ],
                responses: {
                    200: { description: 'Paginated ledger stream', content: { 'application/json': { schema: { type: 'object', properties: { metrics: { type: 'object' }, ledgerPipe: { type: 'array', items: { $ref: '#/components/schemas/LedgerBlock' } } } } } } },
                    401: { description: 'Unauthorized' },
                    403: { description: 'Insufficient clearance' },
                },
            },
            post: {
                tags: ['Ledger'],
                summary: 'Append a new financial block',
                description: 'Creates a new income or expense record. **Admin only.**',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateLedgerRequest' } } },
                },
                responses: {
                    201: { description: 'Block committed to ledger', content: { 'application/json': { schema: { type: 'object', properties: { eventTrace: { type: 'string' }, data: { $ref: '#/components/schemas/LedgerBlock' } } } } } },
                    400: { description: 'Validation error' },
                    403: { description: 'Insufficient clearance' },
                },
            },
        },
        '/api/ledger/{nodeUUID}': {
            get: {
                tags: ['Ledger'],
                summary: 'Inspect a single ledger block',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'nodeUUID', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    200: { description: 'Ledger block found', content: { 'application/json': { schema: { $ref: '#/components/schemas/LedgerBlock' } } } },
                    404: { description: 'Block not found or shadow-purged' },
                },
            },
            put: {
                tags: ['Ledger'],
                summary: 'Mutate a ledger block',
                description: 'Partially update an existing record. **Admin only.**',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'nodeUUID', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    txAmount: { type: 'number' },
                                    txType: { type: 'string', enum: ['income', 'expense'] },
                                    txClassification: { type: 'string' },
                                    txExecutionDate: { type: 'string', format: 'date' },
                                    txRemarks: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Block mutated' },
                    404: { description: 'Block not found' },
                },
            },
            delete: {
                tags: ['Ledger'],
                summary: 'Shadow-purge a ledger block (soft delete)',
                description: 'Marks the record as obsolete without deleting it from the database. **Admin only.**',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'nodeUUID', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    200: { description: 'Shadow purge executed' },
                    404: { description: 'Block not found' },
                },
            },
        },
        '/api/metrics/radar': {
            get: {
                tags: ['Metrics'],
                summary: 'Compile business radar (dashboard summary)',
                description: 'Returns total income, expenses, net balance, category breakdowns, and recent activity. Accessible by **all roles**.',
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: 'timeStart', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filter from date (YYYY-MM-DD)' },
                    { name: 'timeEnd', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filter to date (YYYY-MM-DD)' },
                ],
                responses: {
                    200: { description: 'Radar summary compiled', content: { 'application/json': { schema: { $ref: '#/components/schemas/RadarSummary' } } } },
                    401: { description: 'Unauthorized' },
                },
            },
        },
    },
};

const swaggerSpec = swaggerJsdoc({
    definition,
    apis: [], // Using inline definition above
});

module.exports = swaggerSpec;
