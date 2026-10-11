"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequestError = void 0;
const AppErrors_1 = require("./AppErrors");
class BadRequestError extends AppErrors_1.AppError {
    constructor(message = "Bad Request") {
        super(message, 400);
    }
}
exports.BadRequestError = BadRequestError;
//# sourceMappingURL=BadRequestError.js.map