"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = void 0;
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next); // This "catch" automatically sends it to globalErrorHandler in middleware
    };
};
exports.catchAsync = catchAsync;
//# sourceMappingURL=catchAsync.js.map