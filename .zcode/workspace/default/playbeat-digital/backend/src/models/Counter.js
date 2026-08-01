const mongoose = require('mongoose');

/**
 * Atomic counters for human-friendly numbers (ORD-..., TKT-...).
 * findOneAndUpdate + $inc is atomic, so numbers are unique even under
 * concurrent serverless invocations.
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

counterSchema.statics.next = async function next(name) {
  const doc = await this.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
