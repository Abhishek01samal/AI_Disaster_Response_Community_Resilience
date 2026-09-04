class ApiError extends Error {
  statusCode: number;
  success: boolean;
  message: string;
  code: string;
  data: any;

  constructor(statusCode: number, message: string, code = "API_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.message = message;
    this.code = code;
    this.data = null;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string, code = "BAD_REQUEST") {
    super(400, message, code);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string, code = "UNAUTHORIZED") {
    super(401, message, code);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string, code = "FORBIDDEN") {
    super(403, message, code);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string, code = "NOT_FOUND") {
    super(404, message, code);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, code = "CONFLICT") {
    super(409, message, code);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, code = "VALIDATION_ERROR") {
    super(422, message, code);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message: string, code = "TOO_MANY_REQUESTS") {
    super(429, message, code);
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string, code = "INTERNAL_SERVER_ERROR") {
    super(500, message, code);
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(message: string, code = "SERVICE_UNAVAILABLE") {
    super(503, message, code);
  }
}

export default ApiError;
