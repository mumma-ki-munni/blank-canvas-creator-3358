import { AVATAR_MAX_BYTES, AVATAR_MAX_INPUT_BYTES } from "./avatar";

/**
 * Turn a chosen picture into something small enough to keep in the profile row.
 *
 * There is no file bucket to upload to — this workspace does not allow public
 * ones — so the photo is stored as text on the profile itself. That only works
 * if it is small, so the picture is shrunk here before it is saved: an avatar is
 * never drawn bigger than about 64 points, and 256 pixels covers that on the
 * sharpest screen. A 3 MB photo comes out around 20 KB.
 *
 * Shrinking also means the size limit is almost never hit by a real photo. The
 * limit is still checked, because "almost never" is not never.
 */

const MAX_EDGE = 256;
const QUALITY = 0.85;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file is not a picture we can read"));
    };
    image.src = url;
  });
}

/** Rough byte count of a data URL, without decoding it. */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const body = comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
  return Math.floor((body.length * 3) / 4);
}

export async function fileToAvatarDataUrl(file: File): Promise<string> {
  // Checked here, next to the number written on screen, so the two cannot drift.
  if (file.size > AVATAR_MAX_INPUT_BYTES) {
    throw new Error("That picture is bigger than 10 MB");
  }

  const image = await loadImage(file);

  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare that picture");
  context.drawImage(image, 0, 0, width, height);

  // WebP where it is supported, JPEG everywhere else. Both lose the alpha
  // channel, which is fine — the avatar is always drawn on a filled circle.
  let dataUrl = canvas.toDataURL("image/webp", QUALITY);
  if (!dataUrl.startsWith("data:image/webp")) {
    dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
  }

  if (dataUrlBytes(dataUrl) > AVATAR_MAX_BYTES) {
    throw new Error("That picture is still too big after shrinking");
  }
  return dataUrl;
}
