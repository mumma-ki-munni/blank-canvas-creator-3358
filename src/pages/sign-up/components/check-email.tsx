import { useState } from "react";
import { IconMailCheck } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/base/button";
import { supabase } from "@/integrations/supabase/client";

/**
 * In-place confirmation state (storyboard Act 1, Step 4). Replaces the sign-up card
 * content after a successful email sign-up. Do NOT redirect — the user must confirm
 * their email; the AuthProvider SIGNED_IN handler routes them to /settings afterward.
 */
export function CheckEmail({ email }: { email: string }) {
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      toast.error("Couldn't resend the email. Try again in a moment.");
    } else {
      toast.success("Confirmation email sent again.");
    }
    setResending(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <IconMailCheck className="size-5" />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          We sent a confirmation link to{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>Didn't get it?</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-1"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? "Resending…" : "Resend email"}
        </Button>
      </div>
    </div>
  );
}
