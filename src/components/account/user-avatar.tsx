import { useEffect, useState } from "react";
import { IconUser } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { avatarColors, monogram } from "@/lib/avatar";

/**
 * The avatar, three rungs in order: photo, monogram, glyph.
 *
 * It is never an empty circle and never a broken image. A photo that fails to
 * load falls back to the monogram — a missing face is the normal case, not an
 * error.
 *
 * `nameIsWritten` says whether the person's name appears as text right beside
 * this avatar. When it does the avatar is decoration and is hidden from screen
 * readers, because "G L, Georgemaine Lourens" is noise. When it does not, this
 * circle is the only thing identifying the account, so it carries the name.
 */
export function UserAvatar({
  userId,
  name,
  photoUrl,
  size = 32,
  nameIsWritten = false,
  className,
}: {
  userId: string | null | undefined;
  name: string | null | undefined;
  photoUrl: string | null | undefined;
  size?: number;
  nameIsWritten?: boolean;
  className?: string;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);

  // A new photo deserves a fresh attempt, even if the last one failed.
  useEffect(() => setPhotoFailed(false), [photoUrl]);

  const letters = monogram(name);
  const { background, color } = avatarColors(userId);
  const showPhoto = Boolean(photoUrl) && !photoFailed;

  const label = name?.trim() ? name : "Your account";
  const a11y = nameIsWritten
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": label };

  const box = cn(
    "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
    className,
  );
  const style = { width: size, height: size };

  if (showPhoto) {
    return (
      <span className={box} style={style} {...a11y}>
        <img
          src={photoUrl ?? ""}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setPhotoFailed(true)}
        />
      </span>
    );
  }

  if (letters) {
    return (
      <span
        className={cn(box, "font-medium leading-none")}
        style={{ ...style, background, color, fontSize: Math.round(size * 0.4) }}
        {...a11y}
      >
        {letters}
      </span>
    );
  }

  return (
    <span
      className={cn(box, "bg-muted text-muted-foreground")}
      style={style}
      {...a11y}
    >
      <IconUser style={{ width: size * 0.6, height: size * 0.6 }} />
    </span>
  );
}
