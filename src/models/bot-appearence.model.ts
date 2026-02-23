import { Schema, model, Types, Document } from 'mongoose';

export interface BotAppearanceDocument extends Document {
  botId: Types.ObjectId;

  avatar: {
    type: 'default' | 'custom';
    url?: string;
  };

  theme: {
    type: 'solid' | 'gradient';

    solid?: {
      color: string;
    };

    gradient?: {
      angle: number;
      colors: string[];
    };
  };

  position: 'bottom-left' | 'bottom-right';

  branding: {
    showBranding: boolean;
    brandLogoUrl?: string;
  };

  isDraft: boolean;
}

const botAppearanceSchema = new Schema(
  {
    botId: {
      type: Schema.Types.ObjectId,
      ref: 'Bot',
      required: true,
      unique: true,
      index: true
    },

    avatar: {
      type: {
        type: String,
        enum: ['default', 'custom'],
        default: 'default'
      },
      url: { type: String }
    },

    theme: {
      type: {
        type: String,
        enum: ['solid', 'gradient'],
        default: 'solid'
      },

      solid: {
        color: { type: String, default: '#16A34A' }
      },

      gradient: {
        angle: { type: Number, default: 135 },
        colors: {
          type: [String],
          validate: {
            validator: (v: string[]) => !v || v.length >= 2,
            message: 'Gradient requires at least two colors'
          }
        }
      }
    },

    position: {
      type: String,
      enum: ['bottom-left', 'bottom-right'],
      default: 'bottom-right'
    },

    branding: {
      showBranding: { type: Boolean, default: true },
      brandLogoUrl: { type: String }
    },

    isDraft: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const BotAppearance = model<BotAppearanceDocument>(
  'BotAppearance',
  botAppearanceSchema
);