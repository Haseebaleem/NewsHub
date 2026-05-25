import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/pages/auth/AuthLayout';
import { login as loginRequest, type LoginPayload } from '@/api/auth';
import { describeError } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const DEMO_EMAIL = 'demo@newshub.local';
const DEMO_PASSWORD = 'Demo123!';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [demoDismissed, setDemoDismissed] = useLocalStorage('newshub.demo-box-dismissed', false);
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
    onSuccess: (data) => {
      setSession(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0] ?? ''}.`);
      const target = (location.state as { from?: Location } | null)?.from?.pathname ?? '/feed';
      navigate(target, { replace: true });
    },
    onError: (error) => {
      toast.error(describeError(error, 'Could not sign you in.'));
    },
  });

  const onSubmit = (values: FormValues): void => {
    mutation.mutate(values);
  };

  const fillDemoCredentials = (): void => {
    setValue('email', DEMO_EMAIL, { shouldValidate: true });
    setValue('password', DEMO_PASSWORD, { shouldValidate: true });
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Pick up where you left off."
      footer={{ prompt: "Don't have an account?", href: '/register', cta: 'Create one' }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            aria-invalid={errors.email !== undefined}
            {...register('email')}
          />
          {errors.email !== undefined ? (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pr-10"
              aria-invalid={errors.password !== undefined}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password !== undefined ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      {!demoDismissed ? (
        <div className="relative mt-8 rounded-lg border border-border bg-card/50 p-4 text-sm">
          <button
            type="button"
            onClick={() => setDemoDismissed(true)}
            className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Dismiss demo credentials"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="mb-2 flex items-center gap-2 pr-6">
            <Sparkles className="h-4 w-4 text-brand" aria-hidden />
            <span className="font-medium text-foreground">Try the demo</span>
          </div>
          <p className="mb-3 pr-4 text-muted-foreground">
            Skip registration with the pre-seeded demo account. Comes with 10 bookmarks and 30
            reading-history entries so the stats and timeline pages have meaningful data.
          </p>
          <div className="space-y-1 font-mono text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Email</span>
              <code className="truncate text-foreground">{DEMO_EMAIL}</code>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Password</span>
              <code className="text-foreground">{DEMO_PASSWORD}</code>
            </div>
          </div>
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-brand/30 bg-brand/5 px-2.5 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand/10"
          >
            <Sparkles className="h-3 w-3" aria-hidden />
            Fill demo credentials
          </button>
        </div>
      ) : null}
    </AuthLayout>
  );
}
