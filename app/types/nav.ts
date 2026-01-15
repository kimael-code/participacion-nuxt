export interface NavLink {
  title: string;
  link: string;
  icon?: string;
  new?: boolean;
  permission?: string;
}

export interface NavGroup {
  title: string;
  icon?: string;
  children: NavLink[];
  new?: boolean;
  permission?: string;
}

export interface NavSectionTitle {
  heading: string;
  items: (NavLink | NavGroup)[];
}
