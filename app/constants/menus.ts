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
        link: '/dashboard/events',
        icon: 'i-lucide-calendar',
        permission: 'events:read',
      },
      {
        title: 'Unidades',
        link: '/dashboard/units',
        icon: 'i-lucide-building-2',
        permission: 'units:read',
      },
      {
        title: 'Ubicaciones',
        link: '/dashboard/locations',
        icon: 'i-lucide-map-pin',
        permission: 'locations:read',
      },
      {
        title: 'Reportes CSV',
        link: '/dashboard/listings',
        icon: 'i-lucide-file-spreadsheet',
        permission: 'reports:read',
      },
      {
        title: 'Carga Masiva',
        link: '/dashboard/bulk-import',
        icon: 'i-lucide-upload',
        permission: 'employees:manage',
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
