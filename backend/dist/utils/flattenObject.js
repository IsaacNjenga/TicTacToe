"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenObject = void 0;
// Utility to flatten nested objects for Mongoose dot-notation updates
const flattenObject = (obj, prefix = "") => {
    return Object.keys(obj).reduce((acc, key) => {
        const pre = prefix.length ? `${prefix}.` : "";
        if (typeof obj[key] === "object" &&
            obj[key] !== null &&
            !Array.isArray(obj[key]) &&
            !(obj[key] instanceof Date)) {
            Object.assign(acc, (0, exports.flattenObject)(obj[key], `${pre}${key}`));
        }
        else {
            acc[`${pre}${key}`] = obj[key];
        }
        return acc;
    }, {});
};
exports.flattenObject = flattenObject;
//# sourceMappingURL=flattenObject.js.map