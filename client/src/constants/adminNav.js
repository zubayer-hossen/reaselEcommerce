import { Mail,
  LayoutDashboard, ShoppingBag, Package, LifeBuoy, Users, Truck, CreditCard, Star,
  Megaphone, Image, Bot, FileText, Settings, ShieldCheck, ScrollText, FolderTree, Boxes, HelpCircle,
} from 'lucide-react';

// `perm` = permission needed to see the item. `primary` = shown in the mobile bottom bar.
export const ADMIN_NAV = [
  { key: 'dashboard', path: '/admin', icon: LayoutDashboard, perm: 'dashboard:view', primary: true },
  { key: 'orders', path: '/admin/orders', icon: ShoppingBag, perm: 'orders:read', primary: true },
  { key: 'products', path: '/admin/products', icon: Package, perm: 'products:read', primary: true },
  { key: 'categories', path: '/admin/categories', icon: FolderTree, perm: 'categories:write' },
  { key: 'inventory', path: '/admin/inventory', icon: Boxes, perm: 'products:read' },
  { key: 'support', path: '/admin/support', icon: LifeBuoy, perm: 'support:manage', primary: true },
  { key: 'customers', path: '/admin/customers', icon: Users, perm: 'customers:read' },
  { key: 'tracking', path: '/admin/tracking', icon: Truck, perm: 'tracking:write' },
  { key: 'payments', path: '/admin/payments', icon: CreditCard, perm: 'payments:update' },
  { key: 'reviews', path: '/admin/reviews', icon: Star, perm: 'reviews:moderate' },
  { key: 'subscribers', path: '/admin/subscribers', perm: 'marketing:manage', icon: Mail, primary: false },
  { key: 'campaigns', path: '/admin/campaigns', perm: 'marketing:manage', icon: Megaphone, primary: false },
  { key: 'marketing', path: '/admin/marketing', icon: Megaphone, perm: 'marketing:manage' },
  { key: 'ads', path: '/admin/ads', icon: Image, perm: 'ads:manage' },
  { key: 'chatbot', path: '/admin/chatbot', icon: Bot, perm: 'chatbot:manage' },
  { key: 'content', path: '/admin/content', icon: FileText, perm: 'content:manage' },
  { key: 'homepage', path: '/admin/homepage', icon: LayoutDashboard, perm: 'content:manage' },
  { key: 'faq', path: '/admin/faq', icon: HelpCircle, perm: 'content:manage' },
  { key: 'settings', path: '/admin/settings', icon: Settings, perm: 'settings:read' },
  { key: 'admins', path: '/admin/admins', icon: ShieldCheck, perm: 'admins:manage' },
  { key: 'audit', path: '/admin/audit', icon: ScrollText, perm: 'audit:read' },
];
