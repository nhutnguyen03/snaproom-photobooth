const MAGIC = new Uint8Array([0x53, 0x4e, 0x41, 0x50, 0x52, 0x4f, 0x4f, 0x4d]);
const MANIFEST_LENGTH_BYTES = 4;

export async function createBackup(projects, photos) {
  const manifest = {
    app: "SNAPROOM",
    version: 1,
    createdAt: new Date().toISOString(),
    projects: projects.map((project) => ({
      ...project,
      resultBlob: undefined,
      photoRefs: project.photoRefs || []
    })),
    photos: await Promise.all(photos.map(async (photo) => ({
      id: photo.id,
      mime: photo.mime,
      dimensions: photo.dimensions,
      size: photo.size,
      createdAt: photo.createdAt,
      projectId: photo.projectId
    })))
  };
  const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
  const imageParts = [];

  for (const photo of photos) {
    const blob = photo.blob;
    if (!blob) continue;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const idBytes = new TextEncoder().encode(photo.id);
    imageParts.push(createLengthHeader(idBytes.length));
    imageParts.push(idBytes);
    imageParts.push(createLengthHeader(bytes.length));
    imageParts.push(bytes);
  }

  const resultParts = [MAGIC, createLengthHeader(manifestBytes.length), manifestBytes];
  resultParts.push(...imageParts);
  return new Blob(resultParts, { type: "application/x-snaproom-backup" });
}

export async function parseBackup(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let offset = 0;
  if (!MAGIC.every((value, index) => bytes[index] === value)) {
    throw new Error("INVALID_MAGIC");
  }
  offset += MAGIC.length;

  if (bytes.length < offset + MANIFEST_LENGTH_BYTES) throw new Error("INVALID_LENGTH");
  const manifestLength = readLength(bytes, offset);
  offset += MANIFEST_LENGTH_BYTES;
  if (manifestLength <= 0 || offset + manifestLength > bytes.length) throw new Error("INVALID_MANIFEST");

  let manifest;
  try {
    manifest = JSON.parse(new TextDecoder().decode(bytes.slice(offset, offset + manifestLength)));
  } catch {
    throw new Error("INVALID_MANIFEST");
  }
  offset += manifestLength;

  if (manifest.app !== "SNAPROOM" || manifest.version !== 1) throw new Error("UNSUPPORTED_BACKUP");
  if (!Array.isArray(manifest.projects) || !Array.isArray(manifest.photos)) throw new Error("INVALID_MANIFEST");

  const photos = [];
  while (offset < bytes.length) {
    if (offset + MANIFEST_LENGTH_BYTES > bytes.length) throw new Error("INVALID_IMAGE_LENGTH");
    const idLength = readLength(bytes, offset);
    offset += MANIFEST_LENGTH_BYTES;
    if (idLength <= 0 || offset + idLength > bytes.length) throw new Error("INVALID_IMAGE_ID");
    const photoId = new TextDecoder().decode(bytes.slice(offset, offset + idLength));
    offset += idLength;
    if (offset + MANIFEST_LENGTH_BYTES > bytes.length) throw new Error("INVALID_IMAGE_LENGTH");
    const imageLength = readLength(bytes, offset);
    offset += MANIFEST_LENGTH_BYTES;
    if (imageLength < 0 || offset + imageLength > bytes.length) throw new Error("INVALID_IMAGE_DATA");
    const imageBytes = bytes.slice(offset, offset + imageLength);
    offset += imageLength;

    const metadata = manifest.photos.find((photo) => photo.id === photoId);
    if (!metadata) throw new Error("ORPHAN_IMAGE");
    photos.push({
      ...metadata,
      blob: new Blob([imageBytes], { type: metadata.mime || "image/jpeg" })
    });
  }

  const manifestIds = new Set(manifest.photos.map((photo) => photo.id));
  const imageIds = new Set(photos.map((photo) => photo.id));
  if (manifestIds.size !== imageIds.size) throw new Error("MISSING_IMAGES");
  for (const id of manifestIds) {
    if (!imageIds.has(id)) throw new Error("MISSING_IMAGES");
  }

  return { manifest, photos };
}

function createLengthHeader(length) {
  const header = new Uint8Array(MANIFEST_LENGTH_BYTES);
  new DataView(header.buffer).setUint32(0, length, false);
  return header;
}

function readLength(bytes, offset) {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, MANIFEST_LENGTH_BYTES).getUint32(0, false);
}
