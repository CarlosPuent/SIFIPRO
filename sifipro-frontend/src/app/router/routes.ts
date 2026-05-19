import type { NavigationItem } from '../../types/navigation';

export const appNavigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    description: 'Overview of tenant and program performance.',
  },
  {
    label: 'Customers',
    path: '/customers',
    description: 'Manage tenant customer records and account status.',
  },
  {
    label: 'Rewards',
    path: '/rewards',
    description: 'Manage reward catalog and program-level redemption options.',
  },
  {
    label: 'Transactions',
    path: '/transactions',
    description: 'Review loyalty transactions for the selected program.',
  },
  {
    label: 'Redemptions',
    path: '/redemptions',
    description: 'Track and validate reward redemptions by the selected program.',
  },
  {
    label: 'Reports',
    path: '/reports',
    description: 'Access tenant and selected-program reporting summaries.',
  },
  {
    label: 'Users',
    path: '/users',
    description: 'Admin-only management of internal tenant users.',
    roles: ['ADMIN'],
  },
  {
    label: 'Programs',
    path: '/program-config',
    description: 'Admin-only management of tenant loyalty programs.',
    roles: ['ADMIN'],
  },
];

export const defaultRoute = '/dashboard';
