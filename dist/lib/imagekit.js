"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isImageKitConfigured = void 0;
exports.uploadBufferToImageKit = uploadBufferToImageKit;
const nodejs_1 = __importStar(require("@imagekit/nodejs"));
// Centralized ImageKit configuration + upload helper.
//
// Mirrors the previous Cloudinary helper's shape so call sites are unchanged:
// both expose `uploadBuffer…(buffer, folder) => { url, publicId }` plus an
// `is…Configured()` guard. Here `publicId` carries ImageKit's `fileId`, which
// is stored in the existing `profileImagePublicId` column (no DB change).
//
// Uses the official @imagekit/nodejs v7 SDK. Server-side uploads authenticate
// with the private key alone, and the upload response already returns an
// absolute URL — so publicKey / urlEndpoint aren't needed here (the client
// constructor doesn't accept them). The client is created lazily so the server
// still boots when image uploads aren't configured; the helper throws a clear
// error only when it is actually invoked without configuration.
let client = null;
function getClient() {
    if (client)
        return client;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("ImageKit is not configured (missing IMAGEKIT_PRIVATE_KEY).");
    }
    client = new nodejs_1.default({ privateKey });
    return client;
}
const isImageKitConfigured = () => Boolean(process.env.IMAGEKIT_PRIVATE_KEY);
exports.isImageKitConfigured = isImageKitConfigured;
// Upload an in-memory file buffer to ImageKit under `folder`, returning the
// hosted URL and the ImageKit fileId (persisted as `publicId` by callers).
async function uploadBufferToImageKit(buffer, folder) {
    const imagekit = getClient();
    const fileName = `upload_${Date.now()}`;
    const result = await imagekit.files.upload({
        file: await (0, nodejs_1.toFile)(buffer, fileName),
        fileName,
        folder: `/${folder}`,
        useUniqueFileName: true,
    });
    if (!result.url) {
        throw new Error("ImageKit upload did not return a URL.");
    }
    return { url: result.url, publicId: result.fileId ?? "" };
}
//# sourceMappingURL=imagekit.js.map