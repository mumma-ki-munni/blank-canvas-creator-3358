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

// email format + password min 8 chars — no confirm field per screenboard spec.
const signUpSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

type SignUpValues = z.infer<typeof signUpSchema>;

export function SignUpForm({ onSuccess }: { onSuccess: (email: string) => void }) {
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SignUpValues) => {
    // Real Supabase email sign-up — email confirmation required, no auto-confirm.
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (!error) {
      onSuccess(values.email);
      return;
    }

    const message = error.message.toLowerCase();
    if (message.includes("already") || message.includes("registered")) {
      form.setError("email", {
        message: "This email is already registered. Sign in instead.",
      });
    } else if (message.includes("password") || message.includes("weak")) {
      form.setError("password", {
        message: "Choose a stronger password with at least 8 characters.",
      });
    } else {
      toast.error("Couldn't create your account. Check your connection and try again.");
    }
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
                  autoComplete="new-password"
                  placeholder="At least 8 characters…"
                  disabled={submitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <IconLoader2 className="animate-spin" />}
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </Form>
  );
}
