import swaggerUi from 'swagger-ui-express';

const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Express Boiler Plate API',
    version: '1.0.0',
    description: 'API documentation for auth, users, workspaces, bots, conversations, leads, appearance, and uploads.',
  },
  servers: [{ url: '/api', description: 'API base URL' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token',
      },
    },
  },
  paths: {
    // Auth
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Sign up',
        description: 'Creates a new user and records signup timezone and IP address.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' },
                  timezone: {
                    type: 'string',
                    description: 'Client timezone identifier (e.g. \"Asia/Kolkata\"). Optional but recommended.',
                  },
                },
              },
              example: {
                email: 'user@example.com',
                password: 'Password123!',
                name: 'Test User',
                timezone: 'Asia/Kolkata',
              },
            },
          },
        },
        responses: {
          '201': { description: 'User created, returns access & refresh tokens' },
          '409': { description: 'Email already in use' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Authenticates a user and records login IP and browser (User-Agent) details.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK, returns access & refresh tokens' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK, returns rotated tokens' },
          '401': { description: 'Invalid refresh token' },
        },
      },
    },
    // Users
    '/users/me': {
      get: {
        tags: ['User'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
        },
      },
      put: {
        tags: ['User'],
        summary: 'Update current user profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    // Workspaces
    '/workspaces': {
      post: {
        tags: ['Workspaces'],
        summary: 'Create workspace',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', minLength: 3, maxLength: 100 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Workspace created' },
          '401': { description: 'Unauthorized' },
        },
      },
      get: {
        tags: ['Workspaces'],
        summary: 'List workspaces for current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/workspaces/{workspaceId}': {
      get: {
        tags: ['Workspaces'],
        summary: 'Get workspace by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Workspace not found' },
        },
      },
    },
    // Bots (just main endpoints)
    '/workspaces/{workspaceId}/bots': {
      post: {
        tags: ['Bots'],
        summary: 'Create bot in workspace',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  theme: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Bot created' },
          '401': { description: 'Unauthorized' },
        },
      },
      get: {
        tags: ['Bots'],
        summary: 'List bots in workspace',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/bots/{botId}': {
      patch: {
        tags: ['Bots'],
        summary: 'Update bot',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'botId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Bot not found' },
        },
      },
    },
    // Conversations & messages (public + internal)
    '/bots/{botId}/conversations': {
      post: {
        tags: ['Conversations'],
        summary: 'Start conversation (public)',
        parameters: [
          { name: 'botId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '201': { description: 'Conversation started' },
          '404': { description: 'Bot not found' },
        },
      },
    },
    '/conversations/{conversationId}': {
      get: {
        tags: ['Conversations'],
        summary: 'Get conversation',
        parameters: [
          { name: 'conversationId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'OK' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/conversations/{conversationId}/messages': {
      post: {
        tags: ['Messages'],
        summary: 'Post message',
        parameters: [
          { name: 'conversationId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '201': { description: 'Message created' },
          '404': { description: 'Conversation not found' },
        },
      },
      get: {
        tags: ['Messages'],
        summary: 'List messages (authenticated)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'conversationId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    // Uploads
    '/uploads/images': {
      post: {
        tags: ['Uploads'],
        summary: 'Upload image',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Image uploaded' },
          '400': { description: 'Validation / upload error' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
  },
} as const;

export const swaggerUiServe = swaggerUi.serve;
export const swaggerUiSetup = swaggerUi.setup(spec);
