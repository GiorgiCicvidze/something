import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAdminLogin, getGetAdminMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skull, Lock } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username required"),
  password: z.string().min(1, "Password required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const loginMutation = useAdminLogin();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (data: LoginForm) => {
    setError(null);
    loginMutation.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAdminMeQueryKey() });
          setLocation("/admin/dashboard");
        },
        onError: () => {
          setError("Invalid credentials. Access denied.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-primary/20 bg-primary/10 mb-6">
            <Skull className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            ETERNAL<span className="text-primary">HARDCORE</span>
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-2">
            Admin Access
          </p>
        </div>

        {/* Login card */}
        <div
          className="p-8 rounded-2xl border border-white/8 backdrop-blur-xl"
          style={{ background: "rgba(15,15,15,0.8)", boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 32px 64px rgba(0,0,0,0.6)" }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Restricted Access</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-username"
                        className="bg-white/5 border-white/10 font-mono placeholder:text-muted-foreground/30 focus:border-primary/40 focus:ring-primary/20 h-11"
                        placeholder="username"
                        autoComplete="username"
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
                    <FormLabel className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        data-testid="input-password"
                        className="bg-white/5 border-white/10 font-mono placeholder:text-muted-foreground/30 focus:border-primary/40 focus:ring-primary/20 h-11"
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-destructive font-mono py-3 px-4 rounded-lg bg-destructive/10 border border-destructive/20"
                  data-testid="text-error"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                data-testid="button-login"
                disabled={loginMutation.isPending}
                className="w-full h-11 font-mono uppercase tracking-widest text-sm bg-primary hover:bg-primary/90 transition-all duration-200"
                style={{ boxShadow: "0 0 20px hsl(348 83% 47% / 0.3)" }}
              >
                {loginMutation.isPending ? "Authenticating..." : "Enter"}
              </Button>
            </form>
          </Form>
        </div>

        <div className="text-center mt-6">
          <a
            href="/"
            data-testid="link-back-home"
            className="text-xs font-mono text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
          >
            Back to site
          </a>
        </div>
      </motion.div>
    </div>
  );
}
