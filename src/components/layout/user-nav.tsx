import type { ReactNode } from 'react';
import { AuthLinks } from '@/components/layout/auth-links';

type UserNavigation = {
  desktop: ReactNode;
  mobile: ReactNode;
};

export async function getUserNavigation(): Promise<UserNavigation> {
  return {
    desktop: <AuthLinks />,
    mobile: <AuthLinks layout="stacked" />,
  };
}

export async function UserNav() {
  const navigation = await getUserNavigation();
  return navigation.desktop;
}
