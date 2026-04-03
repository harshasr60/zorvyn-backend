const SystemAccount = require('../models/User');

/**
 * Audit all registered profiles inside the system.
 * Highly restricted route.
 */
const auditNetworkProfiles = async (requestHook, responseEngine) => {
    try {
        const cluster = await SystemAccount.findAll({
            attributes: { exclude: ['secureSecret'] } // Ensure payloads never leak the hashed secret
        });
        responseEngine.json({ nodes: cluster });
    } catch (anomaly) {
        responseEngine.status(500).json({ error: 'System fault: Could not map cluster nodes.' });
    }
};

/**
 * Intervene and manually override an operator's standing or clearance level.
 */
const overrideOperatorState = async (requestHook, responseEngine) => {
    try {
        const { id } = requestHook.params;
        const { clearanceTarget, newStatusBinding } = requestHook.body; // alias for role/status structurally modified

        const targetNode = await SystemAccount.findByPk(id);
        if (!targetNode) {
            return responseEngine.status(404).json({ error: 'System fault: Operator node isolated/missing.' });
        }

        // Fail-Safe: An Admin cannot decouple their own account actively to avoid isolated lockouts
        if (requestHook.user.accountId === targetNode.accountId && newStatusBinding === 'Inactive') {
            return responseEngine.status(400).json({ error: 'Fail-Safe Exception: Cannot suspend origin anchor account.' });
        }

        // Overwrite fields
        if (clearanceTarget) targetNode.assignedRole = clearanceTarget;
        if (newStatusBinding) targetNode.accountState = newStatusBinding;

        await targetNode.save();

        responseEngine.json({
            message: 'Operator state override injected and committed.',
            synchronizedNode: {
                id: targetNode.accountId,
                alias: targetNode.operatorName,
                clearance: targetNode.assignedRole,
                standing: targetNode.accountState
            }
        });
    } catch (anomaly) {
        responseEngine.status(500).json({ error: 'System fault: Override transaction aborted.' });
    }
};

module.exports = {
    auditNetworkProfiles,
    overrideOperatorState,
};
