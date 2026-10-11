// common/errors/CustomError.ts
export abstract class CustomError extends Error {
  abstract statusCode: number;

  constructor(message: string) {
    super(message);
    // Restore prototype chain for built-in Error extensions in ES5/ES6
    Object.setPrototypeOf(this, new.target.prototype);
  }

  abstract serializeErrors(): { message: string; field?: string }[];
}