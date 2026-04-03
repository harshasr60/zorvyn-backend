/**
 * Gateway interception layer.
 * Rejects payloads that do not strictly match internal data blueprints.
 */
const evaluatePayload = (schemaContext) => {
  return (req, res, forwardQueue) => {
    // Utilize the pre-configured Joi boundary constraint
    const { error } = schemaContext.validate(req.body, { abortEarly: false });

    if (error) {
      // Flatten validation array into a single explicit trace
      const traceString = error.details.map((fault) => fault.message).join(' | ');
      return res.status(400).json({ error: `Constraint Breach: ${traceString}` });
    }

    // Everything is structurally sound, pass to the engine
    forwardQueue();
  };
};

module.exports = evaluatePayload;
