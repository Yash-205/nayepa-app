import { BaseCheckpointSaver, Checkpoint, CheckpointMetadata, CheckpointTuple } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import AgentCheckpoint from "@/models/AgentCheckpoint";

export class MongoCheckpointer extends BaseCheckpointSaver {
  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata
  ): Promise<RunnableConfig> {
    const threadId = config.configurable?.thread_id;
    if (!threadId) {
      throw new Error("Missing thread_id in checkpointer config");
    }

    const checkpointId = checkpoint.id;

    // Save or update checkpoint in MongoDB
    await AgentCheckpoint.findOneAndUpdate(
      { threadId, checkpointId },
      {
        threadId,
        checkpointId,
        parentCheckpointId: config.configurable?.checkpoint_id,
        checkpoint,
        metadata,
      },
      { upsert: true, new: true }
    );

    return {
      configurable: {
        thread_id: threadId,
        checkpoint_id: checkpointId,
      },
    };
  }

  // Intermediate writes saver (needed by BaseCheckpointSaver)
  async putWrites(
    _config: RunnableConfig,
    _writes: any[],
    _taskId: string
  ): Promise<void> {
    // Intermediate writes are not critical for our simple sequential onboarding state
    return Promise.resolve();
  }

  // Deletes all checkpoints associated with a given threadId
  async deleteThread(threadId: string): Promise<void> {
    await AgentCheckpoint.deleteMany({ threadId });
  }

  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const threadId = config.configurable?.thread_id;
    const checkpointId = config.configurable?.checkpoint_id;

    if (!threadId) {
      return undefined;
    }

    let query: any = { threadId };
    if (checkpointId) {
      query.checkpointId = checkpointId;
    }

    // Find the latest checkpoint if no specific checkpointId is provided
    const doc = await AgentCheckpoint.findOne(query)
      .sort({ createdAt: -1 })
      .lean();

    if (!doc) {
      return undefined;
    }

    return {
      config: {
        configurable: {
          thread_id: doc.threadId as string,
          checkpoint_id: doc.checkpointId as string,
        },
      },
      checkpoint: doc.checkpoint as Checkpoint,
      metadata: doc.metadata as CheckpointMetadata,
      parentConfig: doc.parentCheckpointId
        ? {
            configurable: {
              thread_id: doc.threadId as string,
              checkpoint_id: doc.parentCheckpointId as string,
            },
          }
        : undefined,
    };
  }

  // list checkpoints (needed by BaseCheckpointSaver)
  async *list(
    config: RunnableConfig,
    options?: any
  ): AsyncGenerator<CheckpointTuple> {
    const threadId = config.configurable?.thread_id;
    if (!threadId) {
      return;
    }

    let query: any = { threadId };
    if (options?.before) {
      // Custom filter to list checkpoints created before a certain id
      query.checkpointId = { $lt: options.before };
    }

    const docs = await AgentCheckpoint.find(query)
      .sort({ createdAt: -1 })
      .lean();

    for (const doc of docs) {
      yield {
        config: {
          configurable: {
            thread_id: doc.threadId as string,
            checkpoint_id: doc.checkpointId as string,
          },
        },
        checkpoint: doc.checkpoint as Checkpoint,
        metadata: doc.metadata as CheckpointMetadata,
        parentConfig: doc.parentCheckpointId
          ? {
              configurable: {
                thread_id: doc.threadId as string,
                checkpoint_id: doc.parentCheckpointId as string,
              },
            }
          : undefined,
      };
    }
  }
}
