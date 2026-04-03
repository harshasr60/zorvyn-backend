# Financial Orchestration & RBAC Backend Engine

This defines a scalable backend engine for a financial statistics and aggregation dashboard system. It enforces rigid structural access through a layered Role-Based Access Control (RBAC) mechanism.

## Architectural Capabilities
- **Operator Governance**: Orchestrate identities securely. Includes explicit hierarchies: Viewer, Analyst, and Admin nodes.
- **Ledger Operations**: Create, sync, modify, and shadow-purge atomic monetary transactions (Income/Expenses).
- **Radar Metrics Engine**: Generates real-time, aggregated financial intelligence via optimized SQL groupings.
- **Fortified Security**: 
  - Token-bound (JWT) identity manifests
  - Boundary input protection through Joi schemas
  - Network-level throttling (express-rate-limit) to reject DDoS and brute-force vectors
  - Layered security headers via Helmet

## Core Tech Profile
- **Node.js & Express.js** as the fundamental networking framework.
- **Sequelize & SQLite** serving as the unified ORM bridging and native persistence boundary.
- **JWT & bcryptjs** orchestrating payload hashing and session handshakes.

## Deployment Walkthrough

### Minimum Requirements
- Node.js Runtime (v14 or newer)
- npm package manager

### Initialization Flow
1. Clone the repository block.
2. Jump into the core folder:
   \`\`\`bash
   cd "zorvyn backend assessment"
   \`\`\`
3. Resolve internal packages:
   \`\`\`bash
   npm install
   \`\`\`
4. (Optional) Inject Environment Variables:
   Construct a \`.env\` file in the root to mutate default behaviors:
   \`\`\`
   PORT=3000
   JWT_SECRET=super-secret-key-for-dev
   \`\`\`
5. Ignite the engine:
   \`\`\`bash
   npm run dev
   \`\`\`
   *(Or \`npm start\` for standard runtime)*

> **Note**: A local DB construct (\`database.sqlite\`) is built autonomously on first ignition.

## Endpoint Index 

### Authentication Layer
- \`POST /api/auth/register\`: Emit a new operator node. Generates an Admin if the cluster is completely empty.
- \`POST /api/auth/login\`: Exchange credentials for an active session manifest (JWT Token).

### Operator Layer (Requires Admin Capability)
*Note: Append \`Authorization: Bearer <token>\` to requests.*
- \`GET /api/operators\`: Dump a listing of all registered nodes in the cluster.
- \`PUT /api/operators/:id\`: Mutate another existing operator's internal standing or clearance tier.

### Ledger Storage Layer (Requires Assured Access)
*Note: Append \`Authorization: Bearer <token>\` to requests.*
- \`GET /api/ledger\`: Stream paginated ledger blocks. Accepts params: \`pageSlice\`, \`chunkSize\`, \`filterType\`, \`filterTag\`, \`horizonStart\`, \`horizonEnd\`. (Admin, Analyst)
- \`GET /api/ledger/:nodeUUID\`: Inspect a single financial block visually. (Admin, Analyst)
- \`POST /api/ledger\`: Inject a new financial block onto the chain. (Admin Only)
- \`PUT /api/ledger/:nodeUUID\`: Mutate properties of an existing block. (Admin Only)
- \`DELETE /api/ledger/:nodeUUID\`: Shadow-purge an actively linked block. (Admin Only)

### Radar Metrics Layer (Requires Viewer/Analyst/Admin Capabilties)
*Note: Append \`Authorization: Bearer <token>\` to requests.*
- \`GET /api/metrics/radar\`: Extracts heavy aggregation data representing the gross vitals and segmented footprint history. 
  - Valid Query Params: \`timeStart\`, \`timeEnd\`.

## Engineering Tradeoffs
1. **Simplified Storage Engine**: SQLite binds directly into the file system, destroying the overhead of setting up Postgres/Mongo docker containers just for functional assessment. Standardized using Sequelize so scaling it to Postgres is roughly a one-line config alteration.
2. **Setup Flexibility**: The initial auth routine detects structural emptiness to permit a naked Admin creation hook, preventing dead-locking the system during the first localized run.
3. **Shadow-Purging Data (Soft-Deletes)**: Financial data should structurally never be unconditionally purged for compliance auditing; hence \`DELETE\` runs a shadow purge flipping the visibility boolean rather than destroying the memory block outright.
