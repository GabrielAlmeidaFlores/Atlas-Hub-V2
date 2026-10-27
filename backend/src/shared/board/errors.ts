export class BoardNotFoundError extends Error {
  constructor(message = 'Board não encontrado') {
    super(message);
    this.name = 'BoardNotFoundError';
  }
}

export class BoardConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BoardConflictError';
  }
}

export class BoardForbiddenError extends Error {
  constructor(message = 'Você não tem acesso a este quadro') {
    super(message);
    this.name = 'BoardForbiddenError';
  }
}
