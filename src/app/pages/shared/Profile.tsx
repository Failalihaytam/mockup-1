import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { UsersAPI } from '../../services/odataClient';
import { toast } from 'sonner';

export const ProfilePage: React.FC = () => {
  const { currentUser, switchUser } = useAuth();
  const [name, setName] = useState('');
  const [skills, setSkills] = useState('');
  const [certifications, setCertifications] = useState('');
  const [availabilityPercent, setAvailabilityPercent] = useState(100);

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name);
    setSkills(currentUser.skills.join(', '));
    setCertifications(currentUser.certifications.join(', '));
    setAvailabilityPercent(currentUser.availabilityPercent);
  }, [currentUser]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      await UsersAPI.update(currentUser.id, {
        name: name.trim(),
        skills: skills
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean),
        certifications: certifications
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean),
        availabilityPercent,
      });
      await switchUser(currentUser.id);
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="My Profile"
        subtitle="Update personal information and skill profile"
        breadcrumbs={[{ label: 'My Profile' }]}
      />

      <div className="p-6 max-w-3xl">
        <form onSubmit={saveProfile} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Email</label>
            <input
              value={currentUser?.email ?? ''}
              disabled
              className="w-full px-3 py-2 border border-border rounded bg-muted text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Skills (comma-separated)</label>
            <textarea
              rows={3}
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              Certifications (comma-separated)
            </label>
            <textarea
              rows={3}
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Availability (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={availabilityPercent}
              onChange={(e) => setAvailabilityPercent(Number(e.target.value || 0))}
              className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
};
