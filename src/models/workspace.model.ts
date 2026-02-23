import { Schema, model, Types, Document } from 'mongoose';

export interface WorkspaceDocument extends Document {
  name: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
}

const workspaceSchema = new Schema(
  {
    name: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

export const Workspace = model('Workspace', workspaceSchema);