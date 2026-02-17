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
    },
  },
};
