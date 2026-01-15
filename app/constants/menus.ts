import type { NavSectionTitle } from '../types/nav';

export const navMenu: NavSectionTitle[] = [
  {
    heading: 'General',
    items: [
      {
        title: 'Inicio',
        link: '/dashboard',
        icon: 'i-lucide-home',
      },
      {
        title: 'Participación',
        link: '/dashboard/participation/register',
        icon: 'i-lucide-pie-chart',
        permission: 'participation:register',
      },
      {
        title: 'Reportes',
        link: '/dashboard/reports',
        icon: 'i-lucide-file-text',
        permission: 'reports:read',
      },
    ],
  },
  {
    heading: 'Administración',
    items: [
      {
        title: 'Empleados',
        link: '/dashboard/employees',
        icon: 'i-lucide-users',
        permission: 'employees:read',
      },
      {
        title: 'Eventos',
        link: '#',
        icon: 'i-lucide-calendar',
        permission: 'events:read',
      },
      {
        title: 'Unidades',
        link: '#',
        icon: 'i-lucide-building-2',
        permission: 'units:read',
      },
    ],
  },
];

export const navMenuBottom: any[] = [
  {
    title: 'Configuración',
    link: '#',
    icon: 'i-lucide-settings',
  },
  {
    title: 'Ayuda',
    link: '#',
    icon: 'i-lucide-help-circle',
  },
];
