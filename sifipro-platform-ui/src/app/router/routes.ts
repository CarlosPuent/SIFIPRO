import type { NavigationItem } from '../../types/navigation';

export const appNavigation: NavigationItem[] = [
  {
    label: 'Overview',
    path: '/overview',
    description: 'Platform-wide report: adoption and activity of every merchant.',
  },
  {
    label: 'Tenants',
    path: '/tenants',
    description: 'Provision and manage platform tenants.',
  },
];

export const defaultRoute = '/overview';
