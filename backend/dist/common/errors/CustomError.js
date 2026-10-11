"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = void 0;
// common/errors/CustomError.ts
class CustomError extends Error {
    constructor(message) {
        super(message);
        // Restore prototype chain for built-in Error extensions in ES5/ES6
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.CustomError = CustomError;
//# sourceMappingURL=CustomError.js.map