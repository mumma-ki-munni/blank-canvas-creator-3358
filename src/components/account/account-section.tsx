import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-provider";
import { useDataProvider } from "@/lib/data-provider";
import { AVATAR_ACCEPT, AVATAR_LIMITS_TEXT } from "@/lib/avatar";
import { UserAvatar } from "./user-avatar";

/**
 * Settings › Account. The photo sits at the top, above the name, because this
 * section is where the account is described and a face is part of describing
 * it.
 *
 * The avatar itself is the control, and a button beside it says what it does.
 * Both open the same file picker: the avatar alone is a guess at what is
 * clickable, the button alone wastes the obvious target.
 */
export function AccountSection() {
  const { user } = useAuth();
  const { useProfile, useUpdateAccount, useUploadAvatar } = useDataProvider();
  const { data: profile } = useProfile();
  const updateAccount = useUpdateAccount();
  const uploadAvatar = useUploadAvatar();

  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile?.full_name ?? "");
  const [nameSeeded, setNameSeeded] = useState(profile?.id ?? null);

  // Seed the field once the profile arrives, without an effect.
  if (profile && nameSeeded !== profile.id) {
    setNameSeeded(profile.id);
    setName(profile.full_name ?? "");
  }

  const photoUrl = profile?.avatar_url ?? null;
  const displayName = profile?.full_name ?? user?.email ?? null;

  const pickPhoto = useCallback(() => fileRef.current?.click(), []);

  const handleFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Let the same file be chosen twice in a row.
      event.target.value = "";
      if (!file) return;
      const url = await uploadAvatar.mutateAsync(file);
      if (url) toast.success("Photo updated");
    },
    [uploadAvatar],
  );

  const handleRemovePhoto = useCallback(async () => {
    await updateAccount.mutateAsync({ avatar_url: null });
  }, [updateAccount]);

  const handleSaveName = useCallback(async () => {
    await updateAccount.mutateAsync({ full_name: name.trim() });
    toast.success("Name saved");
  }, [name, updateAccount]);

  const nameChanged = name.trim() !== (profile?.full_name ?? "").trim();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Label>Photo</Label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={pickPhoto}
            disabled={uploadAvatar.isPending}
            className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Change photo"
          >
            <UserAvatar
              userId={profile?.id ?? user?.id}
              name={displayName}
              photoUrl={photoUrl}
              size={64}
              nameIsWritten
            />
          </button>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={pickPhoto}
                disabled={uploadAvatar.isPending}
              >
                {uploadAvatar.isPending && (
                  <IconLoader2 className="size-4 animate-spin" />
                )}
                Change photo
              </Button>

              {/* Remove is offered only when there is a photo, and it drops back
                  to the monogram — never to an empty circle. */}
              {photoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePhoto}
                  disabled={updateAccount.isPending}
                >
                  Remove photo
                </Button>
              )}
            </div>

            {/* The limits are written next to the control, not discovered by failing. */}
            <p className="text-xs text-muted-foreground">{AVATAR_LIMITS_TEXT}</p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept={AVATAR_ACCEPT}
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="account-name">Name</Label>
        <div className="flex items-center gap-2">
          <Input
            id="account-name"
            value={name}
            placeholder="Your name"
            onChange={(event) => setName(event.target.value)}
          />
          <Button
            type="button"
            onClick={handleSaveName}
            disabled={!nameChanged || updateAccount.isPending}
          >
            Save
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Your initials come from this name when you have no photo.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Email</Label>
        <p className="text-sm text-foreground">{user?.email ?? "—"}</p>
      </div>
    </div>
  );
}
