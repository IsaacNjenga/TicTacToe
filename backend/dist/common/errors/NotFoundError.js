"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = void 0;
const CustomError_1 = require("./CustomError");
class NotFoundError extends CustomError_1.CustomError {
    constructor(message = "Resource not found") {
        super(message);
        this.message = message;
        this.statusCode = 404;
    }
    serializeErrors() {
        return [{ message: this.message }];
    }
}
exports.NotFoundError = NotFoundError;
//# sourceMappingURL=NotFoundError.js.map