// Theme: Archway — Token file; NavItem type colocated here for monorepo import clarity

export type NavItem = {
  title: string
  href: string
}

export const navItems: NavItem[] = [
  { title: 'Home',            href: '/'                },
  { title: 'Products',        href: '/products'        },
  { title: 'Shops',           href: '/shops'           },
  { title: 'Offers',          href: '/offers'          },
  { title: 'Become a seller', href: '/become-a-seller' },
]