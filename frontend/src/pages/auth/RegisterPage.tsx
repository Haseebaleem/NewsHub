import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/pages/auth/AuthLayout';
import { register as registerRequest, type RegisterPayload } from '@/api/auth';
import { describeError } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[a-z]/, 'Add a lowercase letter')
      .regex(/[A-Z]/, 'Add an uppercase letter')
      .regex(/[0-9]/, 'Add a number'),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords must match',
    path: ['password_confirmation'],
  });

type FormValues = z.infer<typeof schema>;

interface StrengthMeta {
  score: number;
  label: string;
  tone: string;
}

function scorePassword(password: string): StrengthMeta {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (password === '') return { score: 0, label: '', tone: '' };
  if (score <= 1) return { score: 1, label: 'Too weak', tone: 'bg-destructive' };
  if (score === 2) return { score: 2, label: 'Weak', tone: 'bg-amber-500/70' };
  if (score === 3) return { score: 3, label: 'Okay', tone: 'bg-amber-400' };
  if (score === 4) return { score: 4, label: 'Strong', tone: 'bg-emerald-500/80' };
  return { score: 5, label: 'Excellent', tone: 'bg-emerald-500' };
}

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', password_confirmation: '' },
  });

  const password = watch('password');
  const strength = useMemo(() => scorePassword(password ?? ''), [password]);

  const mutation = useMutation({
    mutationFn: (payload: RegisterPayload) => registerRequest(payload),
    onSuccess: (data) => {
      setSession(data.token, data.user);
      toast.success('Account created — welcome to NewsHub.');
      navigate('/feed', { replace: true });
    },
    onError: (error) => {
      toast.error(describeError(error, 'Could not create your account.'));
    },
  });

  const onSubmit = (values: FormValues): void => {
    mutation.mutate(values);
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start saving articles in under a minute."
      footer={{ prompt: 'Already registered?', href: '/login', cta: 'Sign in' }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            autoFocus
            placeholder="Your name"
            aria-invalid={errors.name !== undefined}
            {...register('name')}
          />
          {errors.name !== undefined ? (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
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
              autoComplete="new-password"
              placeholder="At least 8 chars, mixed case, a number"
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

          {(password ?? '').length > 0 ? (
            <div className="space-y-1.5 pt-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <span
                    key={bar}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      bar <= strength.score ? strength.tone : 'bg-border',
                    )}
                  />
                ))}
              </div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {strength.label}
              </p>
            </div>
          ) : null}

          {errors.password !== undefined ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password_confirmation">Confirm password</Label>
          <Input
            id="password_confirmation"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={errors.password_confirmation !== undefined}
            {...register('password_confirmation')}
          />
          {errors.password_confirmation !== undefined ? (
            <p className="text-xs text-destructive">
              {errors.password_confirmation.message}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
