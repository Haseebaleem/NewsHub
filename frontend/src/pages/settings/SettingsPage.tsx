import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Loader2, Lock, User as UserIcon, Sliders } from 'lucide-react';
import toast from 'react-hot-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useMe, usePreferences } from '@/hooks/queries';
import { updatePreferences } from '@/api/preferences';
import { describeError } from '@/api/client';
import { useThemeStore } from '@/stores/theme.store';
import { CATEGORIES, COUNTRIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Category, Preferences, ThemeName } from '@/types/api';

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, feed preferences, and account.
        </p>
      </header>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <UserIcon className="mr-1.5 h-3.5 w-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Sliders className="mr-1.5 h-3.5 w-3.5" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="account">
            <Lock className="mr-1.5 h-3.5 w-3.5" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfilePanel />
        </TabsContent>
        <TabsContent value="preferences">
          <PreferencesPanel />
        </TabsContent>
        <TabsContent value="account">
          <AccountPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------- Profile -------------------------- */

function ProfilePanel() {
  const { data: user } = useMe();
  return (
    <Section title="Your profile" description="The basics shown on your avatar and account menu.">
      <div className="flex items-center gap-4">
        <Avatar name={user?.name ?? null} />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{user?.name ?? '—'}</span>
          <span className="font-mono text-xs text-muted-foreground">{user?.email ?? '—'}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="profile-name">Name</Label>
          <Input id="profile-name" value={user?.name ?? ''} readOnly disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" value={user?.email ?? ''} readOnly disabled />
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-md border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <div>
          Profile editing and password change land in a follow-up update. For now your profile data
          is read-only.
        </div>
      </div>
    </Section>
  );
}

/* ------------------------ Preferences ------------------------ */

function PreferencesPanel() {
  const { data: prefs, isLoading } = usePreferences();
  const queryClient = useQueryClient();
  const setLocalTheme = useThemeStore((s) => s.setTheme);

  const [country, setCountry] = useState<string>('in');
  const [categories, setCategories] = useState<Category[]>(['general', 'technology']);
  const [theme, setTheme] = useState<ThemeName>('dark');

  useEffect(() => {
    if (prefs === undefined) return;
    setCountry(prefs.default_country);
    setCategories(prefs.default_categories);
    setTheme(prefs.theme);
  }, [prefs]);

  const mutation = useMutation({
    mutationFn: (payload: Partial<Preferences>) => updatePreferences(payload),
    onSuccess: (data) => {
      toast.success('Preferences saved.');
      queryClient.setQueryData(['preferences'], data);
      setLocalTheme(data.theme);
      void queryClient.invalidateQueries({ queryKey: ['news'] });
    },
    onError: (error) => toast.error(describeError(error, 'Could not save preferences.')),
  });

  const dirty =
    prefs !== undefined &&
    (country !== prefs.default_country ||
      theme !== prefs.theme ||
      categories.length !== prefs.default_categories.length ||
      categories.some((c) => !prefs.default_categories.includes(c)));

  const handleToggleCategory = (slug: Category): void => {
    setCategories((current) =>
      current.includes(slug)
        ? current.filter((c) => c !== slug)
        : [...current, slug],
    );
  };

  const handleSave = (): void => {
    if (categories.length === 0) {
      toast.error('Pick at least one category.');
      return;
    }
    mutation.mutate({
      default_country: country,
      default_categories: categories,
      theme,
    });
  };

  if (isLoading) {
    return (
      <Section title="Feed preferences" description="Loading…">
        <div className="h-32 rounded-md shimmer" />
      </Section>
    );
  }

  return (
    <Section
      title="Feed preferences"
      description="Control what NewsHub shows you on the home feed and which theme you see."
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pref-country">Default country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger id="pref-country">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label}{' '}
                    <span className="ml-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {c.code}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pref-theme">Theme</Label>
            <Select
              value={theme}
              onValueChange={(value) => setTheme(value as ThemeName)}
            >
              <SelectTrigger id="pref-theme">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark (default)</SelectItem>
                <SelectItem value="light">Light</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <Label>Default categories</Label>
            <span className="text-xs text-muted-foreground">
              {categories.length} of {CATEGORIES.length} selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ slug, label, Icon, tone }) => {
              const selected = categories.includes(slug);
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => handleToggleCategory(slug)}
                  aria-pressed={selected}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    selected
                      ? 'border-brand/40 bg-brand/10 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground',
                  )}
                >
                  <Icon className={cn('h-3 w-3', selected ? tone : '')} />
                  {label}
                  {selected ? <Check className="h-3 w-3 text-brand" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <span className="text-xs text-muted-foreground">
            {dirty ? 'You have unsaved changes.' : 'Everything is up to date.'}
          </span>
          <Button onClick={handleSave} disabled={!dirty || mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </div>
    </Section>
  );
}

/* -------------------------- Account -------------------------- */

function AccountPanel() {
  return (
    <Section
      title="Account"
      description="Sensitive actions for your NewsHub account."
    >
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Danger zone
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Deleting your account permanently removes your bookmarks, reading history, and
          preferences. This cannot be undone.
        </p>
        <Button variant="destructive" disabled>
          Delete account
        </Button>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Account deletion ships in a follow-up update.
        </p>
      </div>
    </Section>
  );
}

/* --------------------------- shared --------------------------- */

interface SectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
