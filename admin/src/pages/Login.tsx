// Username + password + 6-digit code, one form, shadcn card (PRD §9.1). One message for every failure.
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, Field } from '@/components/common';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/labels';

/** Persian/Arabic digits from a Persian keyboard become ASCII, everything else is dropped. */
function toAsciiDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\D/g, '')
    .slice(0, 6);
}

export function Login() {
  const { admin, checking, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/reviews';
  if (!checking && admin) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setError('کد تأیید باید ۶ رقم باشد.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      await login({ username: username.trim(), password, code });
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setCode('');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-sm gap-5">
        <CardHeader className="gap-2">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
            <KeyRound className="size-5" aria-hidden="true" />
          </span>
          <CardTitle className="text-xl font-bold text-ink">ورود به پنل پیج‌سنج</CardTitle>
          <CardDescription className="leading-6 text-ink-3">
            کد ۶ رقمی را از ورودی «Pagesanj» در برنامهٔ احراز هویت خود وارد کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {error && <Alert>{error}</Alert>}
            <Field label="نام کاربری" htmlFor="username">
              <Input
                id="username"
                name="username"
                dir="ltr"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Field>
            <Field label="رمز عبور" htmlFor="password">
              <Input
                id="password"
                name="password"
                type="password"
                dir="ltr"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="کد تأیید" htmlFor="code">
              <Input
                id="code"
                name="code"
                dir="ltr"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                placeholder="000000"
                className="text-center font-mono text-lg tracking-[0.4em]"
                value={code}
                onChange={(e) => setCode(toAsciiDigits(e.target.value))}
              />
            </Field>
            <Button type="submit" className="mt-1 w-full" disabled={pending || !username || !password}>
              {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
              {pending ? 'در حال ورود…' : 'ورود'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
