const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'SwiftCart REST API Documentation',
      version: '1.0.0',
      description: 'Comprehensive REST API documentation for the SwiftCart full-stack e-commerce store.',
      contact: {
        name: 'Developer Support',
      },
      servers: [
        {
          url: 'http://localhost:5000',
          description: 'Local Development Server',
        },
      ],
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token'
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Paths to files containing OpenAPI annotations
  apis: ['./src/routes/*.js', './src/app.js'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger API documentation mounted on http://localhost:5000/api-docs');
};

module.exports = setupSwagger;
