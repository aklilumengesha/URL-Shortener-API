// JSON Schema definitions for URL endpoints

export const createUrlSchema = {
  body: {
    type: 'object',
    required: ['url'],
    properties: {
      url: {
        type: 'string',
        format: 'uri',
        description: 'The original URL to shorten',
      },
      customAlias: {
        type: 'string',
        pattern: '^[a-zA-Z0-9_-]+$',
        minLength: 3,
        maxLength: 20,
        description: 'Optional custom short code',
      },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        shortCode: { type: 'string' },
        shortUrl: { type: 'string' },
        originalUrl: { type: 'string' },
        createdAt: { type: 'string' },
      },
    },
  },
};
