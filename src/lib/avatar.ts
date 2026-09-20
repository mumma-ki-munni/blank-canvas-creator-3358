/**
 * Avatar helpers — the monogram and its colour.
 *
 * The avatar has three rungs, in order: a photo, a monogram (one or two
 * letters), then a generic person glyph. It is never an empty circle and never
 * a broken image.
 */

/**
 * One or two letters from the name. One word gives its first two letters; two
 * or more words give first-and-last initials. No name gives an empty string,
 * and the caller then falls to the glyph.
 */
export function monogram(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  const first = words[0][0] ?? "";
  const last = words[words.length - 1][0] ?? "";
  return (first + last).toUpperCase();
}

/**
 * A stable hue worked out from the person's id — never from their name.
 * Names get edited, and an avatar that changes colour when somebody fixes a
 * typo in their surname reads as a different person.
 */
export function avatarHue(id: string | null | undefined): number {
  const key = id ?? "";
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 360;
  }
  return hash;
}

/** Background and foreground for the monogram, readable in both themes. */
export function avatarColors(id: string | null | undefined): {
  background: string;
  color: string;
} {
  const hue = avatarHue(id);
  return {
    background: `oklch(0.72 0.12 ${hue})`,
    color: `oklch(0.22 0.04 ${hue})`,
  };
}

/** What the control accepts, written next to it rather than discovered by failing. */
export const AVATAR_ACCEPT = "image/png,image/jpeg,image/webp";
/** The biggest file we will even try to open. Checked before anything else. */
export const AVATAR_MAX_INPUT_BYTES = 10 * 1024 * 1024;
/** The cap on what gets STORED, after the picture is shrunk in the browser. */
export const AVATAR_MAX_BYTES = 256 * 1024;
/**
 * Says both things the rule asks for: which kinds of file, and how big. Big
 * pictures are shrunk rather than refused, so the size here is the one and only
 * limit a person can actually hit.
 */
export const AVATAR_LIMITS_TEXT =
  "PNG, JPEG or WebP, up to 10 MB. Big pictures are shrunk to fit.";
