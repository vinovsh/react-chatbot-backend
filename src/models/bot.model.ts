import { Schema, model, Types, Document } from 'mongoose';

export interface BotDocument extends Document {
    workspaceId: Types.ObjectId;
    name: string;
    status: 'draft' | 'published';
    theme?: object;
  }
  
  const botSchema = new Schema(
    {
      workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', index: true },
      name: { type: String, required: true },
      status: { type: String, enum: ['draft', 'published'], default: 'draft' },
      theme: { type: Object }
    },
    { timestamps: true }
  );
  
  export const Bot = model('Bot', botSchema);