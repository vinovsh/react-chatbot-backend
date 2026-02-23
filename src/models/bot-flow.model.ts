import { Schema, model, Types, Document } from 'mongoose';

export interface BotFlowDocument extends Document {
    botId: Types.ObjectId;
    nodes: any[];
    edges: any[];
    version: number;
  }
  
  const botFlowSchema = new Schema(
    {
      botId: { type: Schema.Types.ObjectId, ref: 'Bot', index: true },
      nodes: { type: Array, required: true },
      edges: { type: Array, required: true },
      version: { type: Number, default: 1 }
    },
    { timestamps: true }
  );
  
  export const BotFlow = model('BotFlow', botFlowSchema);