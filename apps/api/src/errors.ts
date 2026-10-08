export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown[];

  constructor(code: string, status: number, message: string, details: unknown[] = []) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function badRequest(message: string, details: unknown[] = []): AppError {
  return new AppError('BAD_REQUEST', 400, message, details);
}

export function validacion(message: string, details: unknown[] = []): AppError {
  return new AppError('VALIDATION', 400, message, details);
}

export function unauthorized(message = 'Necesitás iniciar sesión'): AppError {
  return new AppError('UNAUTHORIZED', 401, message);
}

export function notFound(message = 'Recurso no encontrado'): AppError {
  return new AppError('NOT_FOUND', 404, message);
}

export function stockInsuficiente(nombre: string): AppError {
  return new AppError('STOCK_INSUFICIENTE', 409, `Sin stock suficiente de "${nombre}"`, [
    { producto: nombre },
  ]);
}

export type ErrorEnvelope = {
  status: number;
  body: { error: { code: string; message: string; details: unknown[] } };
};

export function errorEnvelope(e: unknown): ErrorEnvelope {
  if (e instanceof AppError) {
    return {
      status: e.status,
      body: { error: { code: e.code, message: e.message, details: e.details } },
    };
  }
  return {
    status: 500,
    body: { error: { code: 'INTERNAL', message: 'Error interno', details: [] } },
  };
}