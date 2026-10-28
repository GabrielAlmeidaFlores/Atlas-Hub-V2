export class ApiTokenNotFoundError extends Error {
  constructor(message = 'Token não encontrado') {
    super(message);
    this.name = 'ApiTokenNotFoundError';
  }
}
