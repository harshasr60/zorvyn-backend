const CrashReporter = (engineErr, req, res, flowNext) => {
    // Log the active stack trace so devops can trace the breakdown
    console.error('[CRASH TRACE]: ', engineErr.stack);

    // Surface database-specific formatting exceptions intelligently
    if (engineErr.name === 'SequelizeValidationError') {
        const errorFragments = engineErr.errors.map(breakdown => breakdown.message);
        return res.status(400).json({
            error: 'Data Structure Compromise Detected',
            traceLog: errorFragments
        });
    }

    // Generic unhandled trap
    res.status(500).json({
        error: 'Critical Core Exception',
        diagnostic: process.env.NODE_ENV === 'development' ? engineErr.message : 'Silenced in production bounds.'
    });
};

module.exports = CrashReporter;
