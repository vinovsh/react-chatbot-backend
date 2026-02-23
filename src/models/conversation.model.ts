import { Schema, model, Types, Document } from 'mongoose';

export interface ConversationDocument extends Document {
    botId: Types.ObjectId;
    sessionId: string;
    visitor: {
      ip?: string;
      userAgent?: string;
    };
    isCompleted: boolean;
  }
  
  const conversationSchema = new Schema(
    {
      botId: { type: Schema.Types.ObjectId, ref: 'Bot', index: true },
      sessionId: { type: String, index: true },
      visitor: {
        ip: String,
        userAgent: String
      },
      isCompleted: { type: Boolean, default: false }
    },
    { timestamps: true }
  );
  
  export const Conversation = model('Conversation', conversationSchema);