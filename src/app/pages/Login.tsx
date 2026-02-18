// Login Page — Clean, Professional Design
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  Card,
  CardHeader,
  Input,
  Label,
  Button,
  Title,
  FlexBox,
  FlexBoxDirection,
  FlexBoxJustifyContent,
  FlexBoxAlignItems,
  Icon,
} from '@ui5/webcomponents-react';

import '@ui5/webcomponents-icons/dist/employee.js';
import '@ui5/webcomponents-icons/dist/locked.js';
import '@ui5/webcomponents-icons/dist/shield.js';
import '@ui5/webcomponents-icons/dist/business-card.js';
import '@ui5/webcomponents-icons/dist/settings.js';
import '@ui5/webcomponents-icons/dist/document.js';
import '@ui5/webcomponents-icons/dist/slim-arrow-right.js';

import inetumLogoDark from '@/assets/inetum-logo-dark.svg';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
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
      toast.success('Welcome back!', {
        description: 'Login successful',
      });
      navigate(fromPath || '/dashboard', { replace: true });
    } catch (error) {
      toast.error('Authentication failed', {
        description: 'Please check your credentials',
      });
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (userEmail: string, role: string) => {
    if (loading) return;
    setEmail(userEmail);
    setPassword('demo');
    toast.info(`Logging in as ${role}...`);
    handleLogin(userEmail, 'demo');
  };

  const roleCards = [
    {
      email: 'jean.dupont@company.com',
      role: 'Administrator',
      icon: 'shield',
      color: '#d32f2f',
      description: 'Full system access',
    },
    {
      email: 'marie.martin@company.com',
      role: 'Manager',
      icon: 'business-card',
      color: '#0854a0',
      description: 'Team & project management',
    },
    {
      email: 'pierre.dubois@company.com',
      role: 'Technical Consultant',
      icon: 'settings',
      color: '#2e7d32',
      description: 'Development & tasks',
    },
    {
      email: 'sophie.bernard@company.com',
      role: 'Functional Consultant',
      icon: 'document',
      color: '#ed6c02',
      description: 'Requirements & validation',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f6fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <FlexBox
        direction={FlexBoxDirection.Column}
        alignItems={FlexBoxAlignItems.Center}
        style={{
          width: '100%',
          maxWidth: '1100px',
        }}
        className="animate-fade-in"
      >
        {/* Logo & Title */}
        <FlexBox
          direction={FlexBoxDirection.Column}
          alignItems={FlexBoxAlignItems.Center}
          style={{ marginBottom: '2.5rem' }}
        >
          <img
            src={inetumLogoDark}
            alt="Inetum"
            style={{
              height: '36px',
              marginBottom: '1.25rem',
            }}
            className="animate-scale-in"
          />
          <Title
            level="H1"
            style={{
              color: '#1a1a1a',
              fontSize: '1.75rem',
              fontWeight: 600,
              marginBottom: '0.25rem',
            }}
          >
            Performance Management
          </Title>
          <Label
            style={{
              color: '#737373',
              fontSize: '0.975rem',
            }}
          >
            Enterprise Platform · SAP Fiori
          </Label>
        </FlexBox>

        {/* Main Content Grid */}
        <FlexBox
          style={{
            gap: '2rem',
            width: '100%',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {/* Login Form Card */}
          <Card
            header={
              <CardHeader
                titleText="Sign In"
                subtitleText="Enter your credentials to continue"
              />
            }
            style={{
              width: '100%',
              maxWidth: '420px',
              border: '1px solid #e5e5e5',
            }}
            className="animate-slide-in-left"
          >
            <div style={{ padding: '1.5rem 2rem 2rem' }}>
              <form onSubmit={handleSubmit}>
                <FlexBox direction={FlexBoxDirection.Column} style={{ gap: '1.25rem' }}>
                  <div>
                    <Label required style={{ marginBottom: '0.5rem', display: 'block' }}>
                      Email Address
                    </Label>
                    <Input
                      type="Email"
                      value={email}
                      onInput={(e: any) => setEmail(e.target.value)}
                      placeholder="your.email@company.com"
                      icon={<Icon name="employee" slot="icon" />}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <Label required style={{ marginBottom: '0.5rem', display: 'block' }}>
                      Password
                    </Label>
                    <Input
                      type="Password"
                      value={password}
                      onInput={(e: any) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      icon={<Icon name="locked" slot="icon" />}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>

                  <Button
                    design="Emphasized"
                    type="Submit"
                    disabled={loading}
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </FlexBox>
              </form>
            </div>
          </Card>

          {/* Quick Login Cards */}
          <FlexBox
            direction={FlexBoxDirection.Column}
            style={{ gap: '0.75rem', width: '100%', maxWidth: '420px' }}
          >
            <Label
              style={{
                color: '#525252',
                fontSize: '0.875rem',
                fontWeight: 600,
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Quick Access — Demo
            </Label>
            {roleCards.map((card) => (
              <Card
                key={card.email}
                style={{
                  cursor: 'pointer',
                  border: '1px solid #e5e5e5',
                  borderLeft: `3px solid ${card.color}`,
                }}
                className="hover-lift button-press stagger-item"
                onClick={() => quickLogin(card.email, card.role)}
              >
                <div style={{ padding: '1rem 1.25rem' }}>
                  <FlexBox alignItems={FlexBoxAlignItems.Center} style={{ gap: '0.875rem' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        background: `${card.color}0D`,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={card.icon} style={{ fontSize: '1.25rem', color: card.color }} />
                    </div>
                    <FlexBox direction={FlexBoxDirection.Column} style={{ flex: 1 }}>
                      <Title level="H5" style={{ marginBottom: '0.125rem', fontSize: '0.925rem' }}>
                        {card.role}
                      </Title>
                      <Label style={{ color: '#737373', fontSize: '0.8125rem' }}>
                        {card.description}
                      </Label>
                    </FlexBox>
                    <Icon
                      name="slim-arrow-right"
                      style={{ color: '#a3a3a3', fontSize: '1rem' }}
                    />
                  </FlexBox>
                </div>
              </Card>
            ))}
          </FlexBox>
        </FlexBox>

        {/* Footer */}
        <FlexBox
          justifyContent={FlexBoxJustifyContent.Center}
          style={{ marginTop: '2.5rem', gap: '1.5rem' }}
        >
          <Label style={{ color: '#a3a3a3', fontSize: '0.8125rem' }}>
            © 2026 Inetum
          </Label>
          <Label style={{ color: '#a3a3a3', fontSize: '0.8125rem' }}>
            SAP Fiori Design
          </Label>
          <Label style={{ color: '#a3a3a3', fontSize: '0.8125rem' }}>
            Enterprise Grade
          </Label>
        </FlexBox>
      </FlexBox>
    </div>
  );
};
