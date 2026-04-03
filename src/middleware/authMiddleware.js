const tokenVerifier = require('jsonwebtoken');
const SystemAccount = require('../models/User');

const ENV_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

/**
 * Ensures requests to protected boundaries carry valid identity manifests.
 */
const enforceIdentitySession = async (req, res, next) => {
    try {
        const rawHeader = req.header('Authorization');

        // Fallback if header entirely missing or malformed
        if (!rawHeader || !rawHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Gateway locked. Identity manifest required.' });
        }

        // Isolate the base64 payload
        const tokenExtract = rawHeader.substring(7); // Removes "Bearer "
        const unpacked = tokenVerifier.verify(tokenExtract, ENV_SECRET);

        // Look up the identity in the datastore - unpacked.sub holds ID
        const operator = await SystemAccount.findOne({ where: { accountId: unpacked.sub } });

        if (!operator) {
            return res.status(401).json({ error: 'Gateway locked. Identity reference is a phantom.' });
        }

        // Verify operational capacity
        if (operator.accountState !== 'Active') {
            return res.status(403).json({ error: 'Gateway locked. Identity is under suspension.' });
        }

        // Attach identity context to the stream and proceed
        req.user = operator;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Gateway locked. Manifest is tampered or expired.' });
    }
};

module.exports = enforceIdentitySession;
