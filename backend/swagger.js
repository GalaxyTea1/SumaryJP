const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SumaryJP API',
            version: '1.0.0',
            description: 'API Documentation for SumaryJP backend',
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Local development server',
            },
            {
                url: 'https://jp-backend-api.onrender.com/api',
                description: 'Production server',
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [{
            bearerAuth: []
        }],
    },
    apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = {
    swaggerUi,
    specs,
};
