/**
 * Curates structural access permissions based on role elevations.
 * Takes an array of role titles that are permitted entry.
 */
const requireClearance = (...admittedTiers) => {
    return (req, res, currentStream) => {
        const operator = req.user;

        // Safety check against misconfigured preceding middlewares
        if (!operator || !admittedTiers.includes(operator.assignedRole)) {
            return res.status(403).json({
                error: 'Operations Error: Requisite clearance tier was not satisfied for this boundary.'
            });
        }

        // Elevation passed, pipe to the next execution body
        currentStream();
    };
};

module.exports = requireClearance;
