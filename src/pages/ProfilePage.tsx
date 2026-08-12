import React from 'react';
import { UserProfile } from '../components/UserProfile';
import { User } from '../types';

interface ProfilePageProps {
  user: User | null;
  onUserUpdated: (user: User) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUserUpdated }) => {
  return <UserProfile user={user} onUserUpdated={onUserUpdated} />;
};
