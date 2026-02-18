import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  ArrowRight,
  Briefcase,
  FileSearch,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import inetumLogoDark from '@/assets/inetum-logo-dark.svg';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string } | null)?.from;

  const handleLogin = async (userEmail: string, userPass: string) => {
    setLoading(true);

    try {
      await login(userEmail, userPass);
      toast.success('Welcome back', { description: 'Session started successfully.' });
      navigate(fromPath || '/dashboard', { replace: true });
    } catch (error) {
      toast.error('Authentication failed', {
        description: 'Please verify your credentials and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleLogin(email, password);
  };

  const quickRoles = [
    {
      email: 'jean.dupont@company.com',
      role: 'Administrator',
      description: 'Control users, catalogs, and governance.',
      icon: ShieldCheck,
    },
    {
      email: 'marie.martin@company.com',
      role: 'Manager',
      description: 'Track KPIs, team execution, and delivery risk.',
      icon: Briefcase,
    },
    {
      email: 'pierre.dubois@company.com',
      role: 'Technical Consultant',
      description: 'Operate projects, tasks, and timesheets.',
      icon: Wrench,
    },
    {
      email: 'sophie.bernard@company.com',
      role: 'Functional Consultant',
      description: 'Validate deliverables and handle tickets.',
      icon: FileSearch,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border bg-card">
          <CardHeader className="space-y-4">
            <img src={inetumLogoDark} alt="Inetum" className="h-8 w-auto" />
            <div className="space-y-2">
              <CardTitle className="text-3xl leading-tight sm:text-4xl">
                Performance Management Dashboard
              </CardTitle>
              <CardDescription className="max-w-xl text-base text-muted-foreground">
                Minimal workspace for delivery visibility, KPI monitoring, and role-based execution.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              'Role-based workspaces',
              'KPI-first navigation',
              'Task and allocation visibility',
              'Collaboration and traceability',
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-border/70 bg-surface-2 px-4 py-3 text-sm font-medium text-foreground"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>Use your credentials to access your workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@company.com"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <Button className="w-full" size="lg" disabled={loading}>
                  {loading ? 'Signing in...' : 'Enter Platform'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Quick Access (Demo)
            </p>

            {quickRoles.map((role) => {
              const RoleIcon = role.icon;

              return (
                <button
                  key={role.email}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    if (loading) return;
                    setEmail(role.email);
                    setPassword('demo');
                    toast.info(`Logging as ${role.role}`);
                    void handleLogin(role.email, 'demo');
                  }}
                  className="group w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/20 disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/12 text-primary">
                      <RoleIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{role.role}</p>
                      <p className="truncate text-xs text-muted-foreground">{role.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
