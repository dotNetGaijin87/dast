export class DomainError extends Error {
  readonly code: string;

  constructor(message: string, code = 'DOMAIN_ERROR') {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`, 'NOT_FOUND');
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION');
  }
}

/** Raised when a scan would touch a host outside a target's authorized scope. */
export class AuthorizationScopeError extends DomainError {
  constructor(host: string) {
    super(`Host "${host}" is not in the target's authorized scope.`, 'SCOPE_VIOLATION');
  }
}
