require('dotenv').config();
const coreApplication = require('./src/app');
const runtimeDB = require('./src/config/db');

const LISTENING_SOCKET = process.env.PORT || 3000;

const igniteEngine = async () => {
    try {
        // 1. Establish pipeline to the storage cluster
        await runtimeDB.authenticate();
        console.log('[NODE-INIT]: Persistence layer handshake complete. Engine attached.');

        // 2. Synchronize structures 
        // Alter guarantees non-destructive structural shifts based on model iterations
        await runtimeDB.sync({ alter: true });
        console.log('[NODE-INIT]: Relational schemas have been forcefully synchronized.');

        // 3. Mount to listening boundary
        coreApplication.listen(LISTENING_SOCKET, () => {
            console.log(`[NODE-INIT]: Operational bounds established on socket ${LISTENING_SOCKET}.`);
        });
    } catch (fatality) {
        console.error('[NODE-INIT]: A fatal failure occurred trying to launch the runtime:', fatality);
        process.exit(1);
    }
};

// Fire
igniteEngine();
