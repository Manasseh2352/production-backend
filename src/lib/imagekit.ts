import ImageKit, { toFile } from "@imagekit/nodejs";

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

let client: ImageKit | null = null;

function getClient(): ImageKit {
  if (client) return client;

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("ImageKit is not configured (missing IMAGEKIT_PRIVATE_KEY).");
  }

  client = new ImageKit({ privateKey });
  return client;
}

export const isImageKitConfigured = () => Boolean(process.env.IMAGEKIT_PRIVATE_KEY);

export type ImageKitUploadResult = { url: string; publicId: string };

// Upload an in-memory file buffer to ImageKit under `folder`, returning the
// hosted URL and the ImageKit fileId (persisted as `publicId` by callers).
export async function uploadBufferToImageKit(
  buffer: Buffer,
  folder: string
): Promise<ImageKitUploadResult> {
  const imagekit = getClient();
  const fileName = `upload_${Date.now()}`;
  const result = await imagekit.files.upload({
    file: await toFile(buffer, fileName),
    fileName,
    folder: `/${folder}`,
    useUniqueFileName: true,
  });

  if (!result.url) {
    throw new Error("ImageKit upload did not return a URL.");
  }
  return { url: result.url, publicId: result.fileId ?? "" };
}
