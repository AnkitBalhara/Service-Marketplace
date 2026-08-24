export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Three-Sided Services Marketplace API',
    version: '1.0.0',
    description:
      'Production-grade REST API for a three-sided services marketplace: Customers, Vendors, and Administrators.',
  },
  servers: [
    {
      url: '/api',
      description: 'API Gateway Base URL',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'System health check',
        responses: {
          '200': { description: 'Server is healthy' },
        },
      },
    },
    '/auth/register/customer': {
      post: {
        summary: 'Register customer account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', example: 'customer@example.com' },
                  password: { type: 'string', example: 'Password123!' },
                  name: { type: 'string', example: 'Alice Customer' },
                  phone: { type: 'string', example: '+91 9876543210' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Customer registered successfully' },
          '409': { description: 'Email already exists' },
        },
      },
    },
    '/auth/register/vendor': {
      post: {
        summary: 'Register vendor account (enters PENDING status)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name', 'businessName', 'contactNumber', 'address'],
                properties: {
                  email: { type: 'string', example: 'vendor@example.com' },
                  password: { type: 'string', example: 'Password123!' },
                  name: { type: 'string', example: 'Bob Vendor' },
                  businessName: { type: 'string', example: 'Luxe Salon & Spa' },
                  contactNumber: { type: 'string', example: '+91 9876543211' },
                  address: { type: 'string', example: '123 MG Road, Bangalore' },
                  timezone: { type: 'string', example: 'Asia/Kolkata' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Vendor registered in PENDING status' },
          '409': { description: 'Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Sign in to obtain access and refresh tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'superadmin@marketplace.com' },
                  password: { type: 'string', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Authentication successful' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current user identity, role, and dynamic permission slugs',
        responses: {
          '200': { description: 'User profile with effective permission slugs' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/catalogue/services': {
      get: {
        summary: 'Search and filter published services with server-side pagination',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'query', in: 'query', schema: { type: 'string' } },
          { name: 'categoryId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Paginated list of services' },
        },
      },
    },
    '/availability/services/{id}/slots': {
      get: {
        summary: 'Derive real-time bookable slots from rules, exceptions, and active bookings',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'offeringId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'startDate', in: 'query', required: true, schema: { type: 'string', example: '2026-08-25' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', example: '2026-08-30' } },
        ],
        responses: {
          '200': { description: 'Derived slots with remaining capacity' },
        },
      },
    },
    '/bookings': {
      post: {
        summary: 'Create booking with atomic concurrency protection against overbooking',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['serviceId', 'offeringId', 'date', 'startTime', 'paymentMode'],
                properties: {
                  serviceId: { type: 'string' },
                  offeringId: { type: 'string' },
                  date: { type: 'string', example: '2026-08-26' },
                  startTime: { type: 'string', example: '10:00' },
                  paymentMode: { type: 'string', enum: ['PAY_NOW', 'PAY_AFTER'] },
                  paymentToken: { type: 'string', example: 'tok_success', description: 'Deterministic token: tok_success, tok_fail, tok_delay' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Booking created' },
          '409': { description: 'Slot capacity exceeded under concurrency' },
        },
      },
    },
    '/payments/webhook': {
      post: {
        summary: 'Simulated asynchronous payment webhook',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['event', 'providerRef'],
                properties: {
                  event: { type: 'string', enum: ['payment.success', 'payment.failed'] },
                  providerRef: { type: 'string', example: 'mock_pay_123456' },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Webhook processed idempotently' },
        },
      },
    },
  },
};
