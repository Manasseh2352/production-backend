"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = void 0;
const parsePagination = (params) => {
    const pageRaw = params?.page;
    const limitRaw = params?.limit;
    const page = pageRaw !== undefined ? Number(pageRaw) : 1;
    const limit = limitRaw !== undefined ? Number(limitRaw) : 20;
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 20;
    const skip = (safePage - 1) * safeLimit;
    return { page: safePage, limit: safeLimit, skip };
};
exports.parsePagination = parsePagination;
//# sourceMappingURL=pagination.js.map