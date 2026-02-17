// Login page using UI5 Web Components

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import inetumLogoWhite from '@/assets/inetum-logo.svg';
import inetumLogoDark from '@/assets/inetum-logo-dark.svg';
import { useTheme } from '../context/ThemeContext';
import {
  Card,
  Input,
  Label,
  Button,
  Title,
  Text,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/employee.js';
import '@ui5/webcomponents-icons/dist/locked.js';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: string } | null)?.from;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  const handleLogin = async (userEmail: string, userPass: string) => {
    setLoading(true);
    try {
      await login(userEmail, userPass);
      toast.success('Login successful');
      navigate(fromPath || '/dashboard', { replace: true });
    } catch (error) {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (userEmail: string) => {
    if (loading) return;
    setEmail(userEmail);
    setPassword('demo');
    handleLogin(userEmail, 'demo');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <img
              src={theme === 'dark' ? inetumLogoWhite : inetumLogoDark}
              alt="Inetum"
              className="h-16"
            />
          </div>
          <Title level="H2" className="mb-2">Inetum Performance Portal</Title>
          <Text className="text-gray-500">
            Plateforme de Suivi & Gestion des Performances
          </Text>
        </div>

        {/* Login Form */}
        <Card className="p-4 shadow-lg">
          <div className="p-4 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label required>Email</Label>
                <Input
                  type="Email"
                  value={email}
                  onInput={(e) => setEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  icon={<div slot="icon" className="ui5-icon-employee" />}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label required>Password</Label>
                <Input
                  type="Password"
                  value={password}
                  onInput={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  icon={<div slot="icon" className="ui5-icon-locked" />}
                  required
                />
              </div>

              <Button
                design="Emphasized"
                type="Submit"
                className="w-full mt-4"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </Button>
            </form>

            {/* Quick Login Demo Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Text className="text-sm text-gray-500 mb-3 block">Quick Login (Demo):</Text>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  design="Negative"
                  disabled={loading}
                  onClick={() => quickLogin('jean.dupont@company.com')}
                >
                  Admin
                </Button>
                <Button
                  design="Default"
                  disabled={loading}
                  onClick={() => quickLogin('marie.martin@company.com')}
                >
                  Manager
                </Button>
                <Button
                  design="Positive"
                  disabled={loading}
                  onClick={() => quickLogin('pierre.dubois@company.com')}
                >
                  Tech Consultant
                </Button>
                <Button
                  design="Attention"
                  disabled={loading}
                  onClick={() => quickLogin('sophie.bernard@company.com')}
                >
                  Func Consultant
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center mt-6">
          <Text className="text-sm text-gray-500">
            SAP Fiori-style enterprise application
          </Text>
        </div>
      </div>
    </div>
  );
};
