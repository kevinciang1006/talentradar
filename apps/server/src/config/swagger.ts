import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TalentRadar API',
      version: '1.0.0',
      description: 'API for the TalentRadar remote talent discovery and hiring platform',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Company authentication' },
      { name: 'Admin Auth', description: 'Admin authentication' },
      { name: 'Talent', description: 'Talent pool search & profiles' },
      { name: 'Jobs', description: 'Company job/role management' },
      { name: 'Pipeline', description: 'Hiring pipeline management' },
      { name: 'Dashboard', description: 'Company dashboard data' },
      { name: 'Admin', description: 'Remote Leverage admin operations' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
