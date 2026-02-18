import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { UsersAPI } from '../../services/odataClient';
import { toast } from 'sonner';
import {
  Card,
  CardHeader,
  Avatar,
  Input,
  TextArea,
  Label,
  Button,
  FlexBox,
  FlexBoxDirection,
  FlexBoxAlignItems,
  FlexBoxJustifyContent,
  Icon,
  ObjectStatus,
  Slider,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/employee.js';
import '@ui5/webcomponents-icons/dist/save.js';

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

      <div className="p-6 max-w-3xl space-y-6">
        {/* Profile Header Card */}
        <Card
          header={
            <CardHeader
              titleText={currentUser?.name ?? ''}
              subtitleText={currentUser?.email ?? ''}
              avatar={
                <Avatar>
                  <img
                    src={`https://ui-avatars.com/api/?name=${currentUser?.name}&background=random`}
                    alt="Avatar"
                  />
                </Avatar>
              }
              action={
                <ObjectStatus
                  state="Positive"
                  showDefaultIcon
                >
                  {currentUser?.role?.replace(/_/g, ' ')}
                </ObjectStatus>
              }
            />
          }
        />

        {/* Edit Form */}
        <Card
          header={
            <CardHeader
              titleText="Edit Profile"
              subtitleText="Update your personal details"
              avatar={<Icon name="employee" />}
            />
          }
        >
          <form onSubmit={saveProfile} className="p-4 space-y-5">
            <FlexBox direction={FlexBoxDirection.Column} style={{ gap: '0.5rem' }}>
              <Label required>Full Name</Label>
              <Input
                value={name}
                onInput={(e) => setName(e.target.value)}
                className="w-full"
              />
            </FlexBox>

            <FlexBox direction={FlexBoxDirection.Column} style={{ gap: '0.5rem' }}>
              <Label>Email</Label>
              <Input
                value={currentUser?.email ?? ''}
                disabled
                className="w-full"
              />
            </FlexBox>

            <FlexBox direction={FlexBoxDirection.Column} style={{ gap: '0.5rem' }}>
              <Label>Skills (comma-separated)</Label>
              <TextArea
                rows={3}
                value={skills}
                onInput={(e) => setSkills(e.target.value)}
                className="w-full"
                growing
              />
            </FlexBox>

            <FlexBox direction={FlexBoxDirection.Column} style={{ gap: '0.5rem' }}>
              <Label>Certifications (comma-separated)</Label>
              <TextArea
                rows={3}
                value={certifications}
                onInput={(e) => setCertifications(e.target.value)}
                className="w-full"
                growing
              />
            </FlexBox>

            <FlexBox direction={FlexBoxDirection.Column} style={{ gap: '0.5rem' }}>
              <FlexBox
                alignItems={FlexBoxAlignItems.Center}
                justifyContent={FlexBoxJustifyContent.SpaceBetween}
              >
                <Label>Availability</Label>
                <span className="text-sm font-semibold text-foreground">
                  {availabilityPercent}%
                </span>
              </FlexBox>
              <Slider
                min={0}
                max={100}
                value={availabilityPercent}
                onInput={(e) => setAvailabilityPercent(Number(e.target.value || 0))}
                showTooltip
                labelInterval={5}
              />
            </FlexBox>

            <Button design="Emphasized" type="Submit" icon="save">
              Save Profile
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
