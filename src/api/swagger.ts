import { z } from "zod";
import { signupSchema, loginSchema } from "../utils/validation";
import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import type { OpenAPIV3 } from "openapi-types";

/**
 * Convert Zod schema to OpenAPI schema programmatically
 */
const zodToOpenApi = (schema: z.ZodTypeAny): OpenAPIV3.SchemaObject => {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: Record<string, OpenAPIV3.SchemaObject> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const fieldSchema = value as z.ZodTypeAny;
      properties[key] = zodToOpenApi(fieldSchema);
      
      // Check if field is required (not optional, not nullable)
      if (!(fieldSchema instanceof z.ZodOptional) && !(fieldSchema instanceof z.ZodNullable)) {
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  if (schema instanceof z.ZodString) {
    const openApiSchema: OpenAPIV3.SchemaObject = { type: "string" };
    
    // Check for UUID
    if ((schema as any)._def.checks?.some((check: any) => check.kind === "uuid")) {
      openApiSchema.format = "uuid";
    }
    
    // Check for min/max length
    const minLength = (schema as any)._def.checks?.find((check: any) => check.kind === "min")?.value;
    const maxLength = (schema as any)._def.checks?.find((check: any) => check.kind === "max")?.value;
    if (minLength) openApiSchema.minLength = minLength;
    if (maxLength) openApiSchema.maxLength = maxLength;
    
    // Check for regex pattern
    const regex = (schema as any)._def.checks?.find((check: any) => check.kind === "regex")?.regex;
    if (regex) openApiSchema.pattern = regex.source;
    
    return openApiSchema;
  }

  if (schema instanceof z.ZodNumber) {
    const openApiSchema: OpenAPIV3.SchemaObject = { type: "number" };
    const isInt = (schema as any)._def.checks?.some((check: any) => check.kind === "int");
    if (isInt) openApiSchema.type = "integer";
    return openApiSchema;
  }

  if (schema instanceof z.ZodEnum) {
    return {
      type: "string",
      enum: schema.options,
    };
  }

  if (schema instanceof z.ZodArray) {
    return {
      type: "array",
      items: zodToOpenApi(schema.element),
    };
  }

  if (schema instanceof z.ZodOptional) {
    return zodToOpenApi(schema.unwrap());
  }

  if (schema instanceof z.ZodNullable) {
    const unwrapped = zodToOpenApi(schema.unwrap());
    return {
      ...unwrapped,
      nullable: true,
    };
  }

  // Default fallback
  return { type: "string" };
};

/**
 * Programmatically generate OpenAPI specification
 */
export const generateSwaggerSpec = (): OpenAPIV3.Document => {
  // Convert Zod schemas to OpenAPI schemas
  const signupRequestSchema = zodToOpenApi(signupSchema);
  const loginRequestSchema = zodToOpenApi(loginSchema);

  const userSchema: OpenAPIV3.SchemaObject = {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid", description: "User ID" },
      username: { type: "string", description: "Username" },
      points: { type: "integer", description: "User points" },
      created_at: { type: "string", format: "date-time", nullable: true },
      updated_at: { type: "string", format: "date-time", nullable: true },
    },
  };

  const errorSchema: OpenAPIV3.SchemaObject = {
    type: "object",
    properties: {
      error: { type: "string" },
      details: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: { type: "string" },
            message: { type: "string" },
          },
        },
      },
    },
  };

  const healthCheckSchema: OpenAPIV3.SchemaObject = {
    type: "object",
    properties: {
      status: { type: "string", enum: ["healthy", "unhealthy"] },
      timestamp: { type: "string", format: "date-time" },
      uptime: { type: "number" },
      database: { type: "string", enum: ["connected", "disconnected"] },
    },
  };

  const authResponseSchema: OpenAPIV3.SchemaObject = {
    type: "object",
    properties: {
      token: { type: "string", description: "JWT token" },
      user: userSchema,
    },
  };

  const leaderboardResponseSchema: OpenAPIV3.SchemaObject = {
    type: "object",
    properties: {
      leaders: {
        type: "array",
        items: userSchema,
      },
    },
  };

  const spec: OpenAPIV3.Document = {
    openapi: "3.0.0",
    info: {
      title: "Tic Tac Toe API",
      version: "1.0.0",
      description: "Backend API for Tic Tac Toe game with real-time multiplayer support",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8082}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token authentication. Include token in Authorization header as 'Bearer <token>'",
        },
      },
      schemas: {
        User: userSchema,
        Error: errorSchema,
        HealthCheck: healthCheckSchema,
        AuthResponse: authResponseSchema,
        LeaderboardResponse: leaderboardResponseSchema,
      },
    },
    paths: {
      "/health": {
        get: {
          summary: "Health check endpoint",
          description: "Check server and database health status",
          tags: ["Health"],
          responses: {
            "200": {
              description: "Server is healthy",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthCheck" },
                },
              },
            },
            "503": {
              description: "Server is unhealthy",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthCheck" },
                },
              },
            },
          },
        },
      },
      "/api/health": {
        get: {
          summary: "Health check endpoint (API)",
          description: "Check server and database health status",
          tags: ["Health"],
          responses: {
            "200": {
              description: "Server is healthy",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthCheck" },
                },
              },
            },
            "503": {
              description: "Server is unhealthy",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthCheck" },
                },
              },
            },
          },
        },
      },
      "/api/signup": {
        post: {
          summary: "Create a new user account",
          description:
            "Register a new user and receive a JWT token. Username must be 3-20 characters (alphanumeric and underscore only). Password must be at least 7 characters with at least one letter and one number.",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: signupRequestSchema,
              },
            },
          },
          responses: {
            "201": {
              description: "User created successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthResponse" },
                },
              },
            },
            "400": {
              description: "Validation error or username already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/login": {
        post: {
          summary: "Authenticate user",
          description: "Login with username and password to receive a JWT token",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: loginRequestSchema,
              },
            },
          },
          responses: {
            "200": {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthResponse" },
                },
              },
            },
            "401": {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/leaderboard": {
        get: {
          summary: "Get leaderboard",
          description: "Retrieve top 100 players by points, ordered by points descending",
          tags: ["Leaderboard"],
          responses: {
            "200": {
              description: "Leaderboard retrieved successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/LeaderboardResponse" },
                },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
    },
  };

  return spec;
};

// Generate the spec
export const swaggerSpec = generateSwaggerSpec();

/**
 * Setup Swagger UI programmatically
 * This function sets up the Swagger documentation endpoint
 */
export const setupSwagger = (app: Express): void => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Tic Tac Toe API Documentation",
  }));
};
