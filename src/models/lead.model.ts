import { Schema, model, Types, Document } from 'mongoose';

export interface LeadDocument extends Document {
    botId: Types.ObjectId;
    conversationId: Types.ObjectId;
    data: Record<string, any>;
  }
  
  const leadSchema = new Schema(
    {
      botId: { type: Schema.Types.ObjectId, ref: 'Bot', index: true },
      conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
      data: { type: Object }
    },
    { timestamps: true }
  );
  
  export const Lead = model('Lead', leadSchema);