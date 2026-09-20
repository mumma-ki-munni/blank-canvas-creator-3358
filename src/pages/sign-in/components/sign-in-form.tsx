import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/base/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

// email format + password min 8 chars — matches sign-up validation.
const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm() {
  const [resetting, setResetting] = useState(false);
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SignInValues) => {
    // Real Supabase email sign-in. On success the AuthProvider's
    // onAuthStateChange SIGNED_IN event updates the session and the page's
    // redirect guard sends the user onward — no manual navigate here.
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (!error) return;

    const message = error.message.toLowerCase();
    if (message.includes("not confirmed")) {
      form.setError("email", {
        message: "Confirm your email before signing in. Check your inbox.",
      });
    } else if (message.includes("invalid") || message.includes("credentials")) {
      form.setError("password", {
        message: "Invalid email or password. Try again.",
      });
    } else {
      toast.error("Couldn't sign you in. Check your connection and try again.");
    }
  };

  // "Forgot password?" — sends a reset link for the entered email (per
  // cloudboard + docs/design/auth.md). Full reset flow is out of scope.
  const handleForgotPassword = async () => {
    const email = form.getValues("email");
    const emailCheck = z.string().email().safeParse(email);
    if (!emailCheck.success) {
      form.setError("email", {
        message: "Enter your email above, then tap Forgot password.",
      });
      return;
    }
    setResetting(true);
    // Always /auth/callback — a bare origin drops the user on the marketing
    // landing with the recovery token still in the URL.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setResetting(false);
    if (error) {
      toast.error("Couldn't send a reset link. Try again in a moment.");
      return;
    }
    toast.success("Check your email for a link to reset your password.");
  };

  const submitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  disabled={submitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Your password…"
                  disabled={submitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={submitting || resetting}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <IconLoader2 className="animate-spin" />}
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Form>
  );
}
