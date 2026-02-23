import { Schema, model, Types, Document } from 'mongoose';

export interface MessageDocument extends Document {
    conversationId: Types.ObjectId;
    sender: 'bot' | 'user';
    content: string;
    nodeId?: string;
  }
  
  const messageSchema = new Schema(
    {
      conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', index: true },
      sender: { type: String, enum: ['bot', 'user'] },
      content: { type: String },
      nodeId: { type: String }
    },
    { timestamps: true }
  );
  
  export const Message = model('Message', messageSchema);