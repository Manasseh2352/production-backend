"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTextWhere = exports.containsInsensitive = void 0;
// Generic helpers for building Prisma where clauses.
// Keeps controller/service code smaller and consistent.
const containsInsensitive = (value) => value;
exports.containsInsensitive = containsInsensitive;
const buildTextWhere = (field, value) => {
    if (!value)
        return undefined;
    return {
        [field]: {
            contains: String(value),
            mode: "insensitive",
        },
    };
};
exports.buildTextWhere = buildTextWhere;
//# sourceMappingURL=filters.js.map