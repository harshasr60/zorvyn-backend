const { Op } = require('sequelize');
const FinancialLedger = require('../models/Record');
const SystemAccount = require('../models/User');

/**
 * Commits a new financial block onto the ledger backbone.
 */
const appendLedgerBlock = async (engineReq, engineRes) => {
    try {
        const { txAmount, txType, txClassification, txExecutionDate, txRemarks } = engineReq.body;

        const blockPayload = await FinancialLedger.create({
            transactionValue: txAmount,
            movementType: txType,
            classification: txClassification,
            executionDate: txExecutionDate,
            additionalRemarks: txRemarks,
            authorizerId: engineReq.user.accountId, // Ties strictly to whoever initiated the commit
        });

        engineRes.status(201).json({ eventTrace: 'Ledger block permanently chained', data: blockPayload });
    } catch (anomaly) {
        engineRes.status(500).json({ error: 'Process fault: Unable to mount block to the ledger stream.' });
    }
};

/**
 * Queries and pipes a segment of the ledger respecting filter horizons.
 */
const streamLedgerData = async (engineReq, engineRes) => {
    try {
        const {
            pageSlice = 1,
            chunkSize = 10,
            filterType,
            filterTag,
            horizonStart,
            horizonEnd,
            sortByPivot = 'executionDate',
            sortDirection = 'DESC'
        } = engineReq.query;

        const skipIndex = (pageSlice - 1) * chunkSize;

        // Core filtering bounds
        const boundaryConditions = { obsolete: false };
        if (filterType) boundaryConditions.movementType = filterType;
        if (filterTag) boundaryConditions.classification = filterTag;

        // Time horizons evaluation
        if (horizonStart || horizonEnd) {
            boundaryConditions.executionDate = {};
            if (horizonStart) boundaryConditions.executionDate[Op.gte] = horizonStart;
            if (horizonEnd) boundaryConditions.executionDate[Op.lte] = horizonEnd;
        }

        const compiledStream = await FinancialLedger.findAndCountAll({
            where: boundaryConditions,
            limit: parseInt(chunkSize, 10),
            offset: parseInt(skipIndex, 10),
            order: [[sortByPivot, sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
            include: [{
                model: SystemAccount,
                as: 'author',
                attributes: ['accountId', 'operatorName']
            }]
        });

        engineRes.json({
            metrics: {
                totalBlocks: compiledStream.count,
                totalSlices: Math.ceil(compiledStream.count / chunkSize),
                activeSlice: parseInt(pageSlice, 10),
            },
            ledgerPipe: compiledStream.rows,
        });
    } catch (anomaly) {
        engineRes.status(500).json({ error: 'Process fault: Slicing routine destabilized.' });
    }
};

/**
 * Access a specific standalone node from the ledger.
 */
const inspectLedgerNode = async (engineReq, engineRes) => {
    try {
        const block = await FinancialLedger.findOne({
            where: { ledgerId: engineReq.params.nodeUUID, obsolete: false },
            include: [{ model: SystemAccount, as: 'author', attributes: ['accountId', 'operatorName'] }]
        });

        if (!block) {
            return engineRes.status(404).json({ error: 'Orphaned node: The requested block does not exist or has been shadow-purged.' });
        }

        engineRes.json(block);
    } catch (anomaly) {
        engineRes.status(500).json({ error: 'Process fault: Inspection lens disrupted.' });
    }
};

/**
 * Mutations handler for an existing standalone node.
 */
const mutateLedgerNode = async (engineReq, engineRes) => {
    try {
        const { nodeUUID } = engineReq.params;
        const { txAmount, txType, txClassification, txExecutionDate, txRemarks } = engineReq.body;

        const activeBlock = await FinancialLedger.findOne({ where: { ledgerId: nodeUUID, obsolete: false } });
        if (!activeBlock) {
            return engineRes.status(404).json({ error: 'Orphaned node: Target block is missing.' });
        }

        // Apply mutation properties lazily
        if (txAmount !== undefined) activeBlock.transactionValue = txAmount;
        if (txType !== undefined) activeBlock.movementType = txType;
        if (txClassification !== undefined) activeBlock.classification = txClassification;
        if (txExecutionDate !== undefined) activeBlock.executionDate = txExecutionDate;
        if (txRemarks !== undefined) activeBlock.additionalRemarks = txRemarks;

        await activeBlock.save();

        engineRes.json({ eventTrace: 'Node structure seamlessly mutated', mutatedBlock: activeBlock });
    } catch (anomaly) {
        engineRes.status(500).json({ error: 'Process fault: Engine rejected block mutation syntax.' });
    }
};

/**
 * Implements a Shadow Purge instead of hardware truncation.
 */
const shadowPurgeNode = async (engineReq, engineRes) => {
    try {
        const mutableBlock = await FinancialLedger.findOne({ where: { ledgerId: engineReq.params.nodeUUID, obsolete: false } });
        if (!mutableBlock) {
            return engineRes.status(404).json({ error: 'Orphaned node: Target already wiped or invalid reference.' });
        }

        mutableBlock.obsolete = true;
        await mutableBlock.save();

        engineRes.json({ eventTrace: 'Shadow purge executed successfully. Node disconnected from active streams.' });
    } catch (anomaly) {
        engineRes.status(500).json({ error: 'Process fault: Shadow purge pipeline jammed.' });
    }
};

module.exports = {
    appendLedgerBlock,
    streamLedgerData,
    inspectLedgerNode,
    mutateLedgerNode,
    shadowPurgeNode,
};
