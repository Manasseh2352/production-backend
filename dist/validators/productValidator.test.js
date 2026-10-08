"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const productValidator_1 = require("./productValidator");
(0, node_test_1.default)('accepts imageUrl as a single URL', () => {
    const result = productValidator_1.createProductSchema.parse({
        productName: 'YAM',
        quantityKg: 10,
        imageUrl: 'https://ik.imagekit.io/demo/test.jpg',
    });
    strict_1.default.deepEqual(result.images, ['https://ik.imagekit.io/demo/test.jpg']);
});
(0, node_test_1.default)('accepts a single string in images', () => {
    const result = productValidator_1.createProductSchema.parse({
        productName: 'YAM',
        quantityKg: 10,
        images: 'https://ik.imagekit.io/demo/test.jpg',
    });
    strict_1.default.deepEqual(result.images, ['https://ik.imagekit.io/demo/test.jpg']);
});
//# sourceMappingURL=productValidator.test.js.map