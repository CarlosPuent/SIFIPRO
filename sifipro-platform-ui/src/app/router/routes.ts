import type { NavigationItem } from '../../types/navigation';

export const appNavigation: NavigationItem[] = [
  {
    label: 'Tenants',
    path: '/tenants',
    description: 'Provision and manage platform tenants.',
  },
];

export const defaultRoute = '/tenants';
