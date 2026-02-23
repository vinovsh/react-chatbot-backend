import Joi from 'joi';
import { NextFunction, Request, Response } from 'express';

function validate(schema: Joi.ObjectSchema, prop: 'body' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate((req as any)[prop], { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(422).json({
        success: false,
        errors: error.details.map((d: Joi.ValidationErrorItem) => ({ message: d.message, path: d.path }))
      });
    }
    (req as any)[prop] = value;
    next();
  };
}

export const validateCreateWorkspace = validate(
  Joi.object({
    name: Joi.string().min(3).max(100).required()
  })
);

export const validateCreateBot = validate(
  Joi.object({
    name: Joi.string().min(3).max(100).required(),
    theme: Joi.object().optional()
  })
);

export const validateListBots = validate(
  Joi.object({
    search: Joi.string().max(100).optional()
  }),
  'query'
);

export const validateUpdateBot = validate(
  Joi.object({
    name: Joi.string().min(3).max(100).optional(),
    status: Joi.string().valid('draft', 'published').optional(),
    theme: Joi.object().optional()
  })
);

export const validateSaveFlow = validate(
  Joi.object({
    nodes: Joi.array().required(),
    edges: Joi.array().required()
  })
);

export const validateStartConversation = validate(
  Joi.object({
    sessionId: Joi.string().max(200).optional()
  })
);

export const validatePostMessage = validate(
  Joi.object({
    sender: Joi.string().valid('bot', 'user').required(),
    content: Joi.string().min(1).required(),
    nodeId: Joi.string().optional()
  })
);

export const validatePostLead = validate(
  Joi.object({
    botId: Joi.string().required(),
    data: Joi.object().default({})
  })
);

export const validateListLeads = validate(
  Joi.object({
    from: Joi.string().isoDate().optional(),
    to: Joi.string().isoDate().optional()
  }),
  'query'
);

export const validateAppearanceUpdate = validate(
  Joi.object({
    avatar: Joi.object({
      type: Joi.string().valid('default', 'custom').optional(),
      url: Joi.string().uri().optional()
    }).optional(),
    theme: Joi.object({
      type: Joi.string().valid('solid', 'gradient').optional(),
      solid: Joi.object({
        color: Joi.string()
          .pattern(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
          .optional()
      }).optional(),
      gradient: Joi.object({
        angle: Joi.number().min(0).max(360).optional(),
        colors: Joi.array()
          .items(
            Joi.string().pattern(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
          )
          .min(2)
          .optional()
      }).optional()
    }).optional(),
    position: Joi.string().valid('bottom-left', 'bottom-right').optional(),
    branding: Joi.object({
      showBranding: Joi.boolean().optional(),
      brandLogoUrl: Joi.string().uri().optional()
    }).optional(),
    isDraft: Joi.boolean().optional()
  })
);

export const validateAppearancePreview = validate(
  Joi.object({
    avatar: Joi.object({
      type: Joi.string().valid('default', 'custom').optional(),
      url: Joi.string().uri().optional()
    }).optional(),
    theme: Joi.object({
      type: Joi.string().valid('solid', 'gradient').optional(),
      solid: Joi.object({
        color: Joi.string()
          .pattern(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
          .optional()
      }).optional(),
      gradient: Joi.object({
        angle: Joi.number().min(0).max(360).optional(),
        colors: Joi.array()
          .items(
            Joi.string().pattern(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
          )
          .min(2)
          .optional()
      }).optional()
    }).optional(),
    position: Joi.string().valid('bottom-left', 'bottom-right').optional(),
    branding: Joi.object({
      showBranding: Joi.boolean().optional(),
      brandLogoUrl: Joi.string().uri().optional()
    }).optional()
  })
);

