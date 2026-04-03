const { Op } = require('sequelize');
const runtimeDB = require('../config/db');
const FinancialLedger = require('../models/Record');

/**
 * Calculates heavy statistical data streams targeting graphical frontend components.
 */
const compileBusinessRadar = async (pipeReq, pipeRes) => {
    try {
        const { timeStart, timeEnd } = pipeReq.query;

        const baseConstraints = { obsolete: false };
        if (timeStart || timeEnd) {
            baseConstraints.executionDate = {};
            if (timeStart) baseConstraints.executionDate[Op.gte] = timeStart;
            if (timeEnd) baseConstraints.executionDate[Op.lte] = timeEnd;
        }

        // Leveraging aggregation pipelines rather than iterative maps for big-O efficiency
        const grossIncomeTracker = await FinancialLedger.sum('transactionValue', { where: { ...baseConstraints, movementType: 'income' } }) || 0;
        const overheadCostTracker = await FinancialLedger.sum('transactionValue', { where: { ...baseConstraints, movementType: 'expense' } }) || 0;
        const finalBalance = grossIncomeTracker - overheadCostTracker;

        // Granular taxonomy calculations via native groupings
        const groupedClassifications = await FinancialLedger.findAll({
            attributes: [
                'movementType',
                'classification',
                [runtimeDB.fn('SUM', runtimeDB.col('transactionValue')), 'computedTotal']
            ],
            where: baseConstraints,
            group: ['movementType', 'classification'],
            raw: true
        });

        // Formatting raw query objects for a clean Frontend consumption
        const parsedNodes = groupedClassifications.reduce((accumulator, item) => {
            const parentType = item.movementType;
            if (!accumulator[parentType]) accumulator[parentType] = [];
            accumulator[parentType].push({
                classification: item.classification,
                volume: parseFloat(item.computedTotal)
            });
            return accumulator;
        }, {});

        // Last 5 events cache extraction
        const footprintLogs = await FinancialLedger.findAll({
            where: baseConstraints,
            order: [['executionDate', 'DESC'], ['createdAt', 'DESC']],
            limit: 5,
            attributes: ['ledgerId', 'transactionValue', 'movementType', 'classification', 'executionDate', 'additionalRemarks']
        });

        pipeRes.json({
            temporalSpan: {
                from: timeStart || 'Genesis Epoch',
                until: timeEnd || 'Current Tick'
            },
            healthVitals: {
                totalGross: parseFloat(grossIncomeTracker),
                totalOverhead: parseFloat(overheadCostTracker),
                computedBalance: parseFloat(finalBalance)
            },
            segmentAnalysis: parsedNodes,
            eventFootprints: footprintLogs
        });
    } catch (errorState) {
        console.error('Radar Compilation Crash:', errorState);
        pipeRes.status(500).json({ error: 'Analytics subsystem threw an unhandled exception while spinning Radar map.' });
    }
};

module.exports = {
    compileBusinessRadar
};
