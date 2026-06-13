import mongoose, { Schema } from 'mongoose';

const AgentCheckpointSchema = new Schema(
  {
    threadId: { type: String, required: true, index: true },
    checkpointId: { type: String, required: true },
    parentCheckpointId: { type: String },
    checkpoint: { type: Schema.Types.Mixed, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Unique index to ensure we don't duplicate checkpoints for the same thread and point in time
AgentCheckpointSchema.index({ threadId: 1, checkpointId: 1 }, { unique: true });

const AgentCheckpoint = mongoose.models.AgentCheckpoint || mongoose.model('AgentCheckpoint', AgentCheckpointSchema);
export default AgentCheckpoint;
