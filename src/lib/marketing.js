import {
  ConciergeBell, CalendarCheck, Grid3X3, LayoutDashboard, BedDouble, Users,
  Smartphone, Sparkles, Wrench, Package, Receipt, TrendingUp, BarChart3,
  Plug, Star, FileText, UserCog, Building2, Building, Home,
  Backpack, KeyRound, Hotel, DoorOpen, Warehouse, Briefcase, TreePalm
} from 'lucide-react';

export const MODULES = [
  { icon: LayoutDashboard, name: 'Dashboard', group: 'Core PMS', desc: 'Live KPIs, arrivals, departures, room status and revenue — everything at a glance.', features: ['Occupancy, ADR & RevPAR KPIs', 'Real-time room status overview', 'Revenue & occupancy charts', 'Smart alerts'] },
  { icon: ConciergeBell, name: 'Front Desk', group: 'Core PMS', desc: 'A fast, optimized workspace for arrivals, departures, in-house guests and walk-ins.', features: ['One-click check-in / check-out', 'Walk-in reservations', 'Guest & reservation search', 'Pending payment tracking'] },
  { icon: CalendarCheck, name: 'Reservations', group: 'Core PMS', desc: 'Individual, group, corporate, OTA and walk-in bookings with full lifecycle control.', features: ['Create, modify & cancel bookings', 'All sources: direct, OTA, corporate', 'Status workflow engine', 'Special requests & notes'] },
  { icon: Grid3X3, name: 'Room Rack', group: 'Core PMS', desc: 'The visual room timeline your front-desk team will love — rooms vertically, dates horizontally.', features: ['Color-coded reservation blocks', 'Week navigation & filters', 'Instant room visibility', 'Overbooking-safe design'] },
  { icon: BedDouble, name: 'Room Types', group: 'Core PMS', desc: 'Define room categories with pricing, capacity, bed types, amenities and views.', features: ['Base pricing per type', 'Capacity & bed configuration', 'Amenities & accessibility', 'Room inventory linking'] },
  { icon: Sparkles, name: 'Housekeeping', group: 'Operations', desc: 'Real-time room status board with task assignments, priorities and inspection workflow.', features: ['Room status board', 'Task assignment & priorities', 'Inspection workflow', 'Mobile-first for staff'] },
  { icon: Wrench, name: 'Maintenance', group: 'Operations', desc: 'Ticketing for repairs, preventive maintenance and asset tracking across your property.', features: ['Priority-based tickets', 'Technician assignment', 'Rooms auto-set to maintenance', 'Cost tracking'] },
  { icon: Package, name: 'Inventory', group: 'Operations', desc: 'Track housekeeping supplies, minibar stock and maintenance parts with low-stock alerts.', features: ['Category-based tracking', 'Low-stock alerts', 'Supplier management', 'Consumption history'] },
  { icon: UserCog, name: 'Team Access', group: 'Operations', desc: 'Invite staff and assign roles — admins get full control, staff get what they need.', features: ['Staff invitations', 'Role-based access', 'Admin & staff permissions', 'Team directory'] },
  { icon: Receipt, name: 'Finance & Billing', group: 'Revenue & Finance', desc: 'Guest folios, invoices and payment monitoring with multi-currency support.', features: ['Invoice generation', 'Payment tracking', 'Outstanding balance alerts', 'Tax-aware structure'] },
  { icon: TrendingUp, name: 'Revenue Management', group: 'Revenue & Finance', desc: 'Seasonal pricing rules, length-of-stay restrictions and automated rate adjustments.', features: ['Seasonal rate plans', 'Min/max stay restrictions', 'Closed to arrival/departure', 'Automated adjustments'] },
  { icon: BarChart3, name: 'Analytics', group: 'Revenue & Finance', desc: 'ADR, RevPAR and occupancy trends for genuinely data-driven decisions.', features: ['14-day trend reports', 'Revenue by booking source', 'Channel performance', 'Executive KPI cards'] },
  { icon: Plug, name: 'Channel Manager', group: 'Revenue & Finance', desc: 'Sync availability and rates across Booking.com, Expedia, Airbnb and more.', features: ['Two-way OTA sync', 'Connection health monitoring', 'Bookings & revenue per channel', 'Overbooking protection'] },
  { icon: Smartphone, name: 'Guest Portal', group: 'Guest Experience', desc: 'A mobile-first portal for guests: reservations, digital check-in preferences and receipts.', features: ['Upcoming stay details', 'Check-in preferences', 'Billing receipts', 'Mobile-first design'] },
  { icon: Star, name: 'Reputation', group: 'Guest Experience', desc: 'Aggregate guest ratings, respond to reviews and track satisfaction scores.', features: ['Review aggregation', 'Response management', 'Satisfaction scoring', 'Rating distribution'] },
  { icon: FileText, name: 'Document Templates', group: 'Guest Experience', desc: 'Templates for invoices, confirmations and registration cards — in 7 languages.', features: ['Invoice & confirmation templates', 'Registration cards', 'Placeholder variables', 'Multilingual (incl. RTL Arabic)'] },
  { icon: Users, name: 'Guest CRM', group: 'Guest Experience', desc: 'Unified guest profiles with stay history, preferences, VIP status and loyalty points.', features: ['Stay & spend history', 'VIP tiers & loyalty points', 'Preferences & consent', 'Tenant-scoped data'] },
  { icon: FileText, name: 'Activity Logs', group: 'Platform', desc: 'A complete audit trail of staff actions, logins and configuration changes.', features: ['Append-only audit trail', 'Severity classification', 'Search & filters', 'Security events'] },
  { icon: Building2, name: 'Property Settings', group: 'Platform', desc: 'Property information, check-in/out times, currency and timezone localization.', features: ['Property profile management', 'Operating preferences', 'Multi-currency', 'Timezone-aware operations'] },
];

export const MODULE_GROUPS = ['Core PMS', 'Operations', 'Revenue & Finance', 'Guest Experience', 'Platform'];

export const INDUSTRIES = [
  { icon: Hotel, name: 'Hotels', blurb: 'Full-service operations from front desk to finance.', points: ['Front desk & room rack', 'Housekeeping workflows', 'Revenue analytics'] },
  { icon: TreePalm, name: 'Resorts', blurb: 'Large properties with activities, F&B and high guest volume.', points: ['Multi-outlet billing', 'Activity management', 'Guest portal'] },
  { icon: Building, name: 'Boutique Hotels', blurb: 'Curated guest experiences with premium personalization.', points: ['Guest CRM & preferences', 'Reputation management', 'Document templates'] },
  { icon: BedDouble, name: 'B&Bs', blurb: 'Small teams that need simplicity without losing power.', points: ['Quick setup', 'Simple pricing plans', 'Owner-friendly'] },
  { icon: Building2, name: 'Guest Houses', blurb: 'Lightweight operations with professional standards.', points: ['Reservations & calendar', 'Payments', 'Guest profiles'] },
  { icon: KeyRound, name: 'Villas', blurb: 'Private properties with flexible date bookings.', points: ['Flexible stays', 'Channel distribution', 'Cleaning scheduling'] },
  { icon: DoorOpen, name: 'Apartments & Aparthotels', blurb: 'Self-catering units with hotel-grade management.', points: ['Extended-stay pricing', 'Maintenance tracking', 'Inventory control'] },
  { icon: Warehouse, name: 'Serviced Apartments', blurb: 'Corporate housing with monthly billing cycles.', points: ['Corporate accounts', 'Invoice templates', 'Length-of-stay rules'] },
  { icon: Backpack, name: 'Hostels', blurb: 'Shared and private rooms with high booking velocity.', points: ['Dorm & private rooms', 'OTA-heavy distribution', 'Walk-in friendly'] },
  { icon: Building2, name: 'Motels & Inns', blurb: 'Roadside properties needing speed above all.', points: ['Ultra-fast check-in', 'Walk-in focus', 'Simple rate plans'] },
  { icon: TreePalm, name: 'Lodges', blurb: 'Nature properties with seasonal demand curves.', points: ['Seasonal rate plans', 'Package add-ons', 'Maintenance for remote ops'] },
  { icon: Home, name: 'Vacation Properties', blurb: 'Holiday homes with owner-facing transparency.', points: ['Owner-ready reporting', 'Channel sync', 'Guest verification'] },
  { icon: Building2, name: 'Hotel Groups & Chains', blurb: 'Multi-property groups with centralized control.', points: ['Property switching', 'Consolidated reporting', 'Centralized users'] },
  { icon: Building, name: 'Management Companies', blurb: 'Operate portfolios on behalf of owners.', points: ['Multi-tenant isolation', 'Portfolio analytics', 'Role-based access'] },
  { icon: Hotel, name: 'Extended-Stay Properties', blurb: 'Long-stay guests with recurring billing.', points: ['Long-stay rate rules', 'Recurring charges', 'Maintenance programs'] },
  { icon: Briefcase, name: 'Corporate Operators', blurb: 'Housing programs for business travelers.', points: ['Corporate billing', 'Credit limits', 'Negotiated rates'] },
];

export const PLANS = [
  {
    name: 'Starter', price: 49, desc: 'For small properties getting started',
    accessNote: 'Up to 10 rooms · 1 property',
    features: ['Up to 10 rooms', 'Core PMS modules', 'Guest CRM', 'Email support'],
    modules: ['Dashboard', 'Front Desk', 'Reservations', 'Room Rack', 'Room Types', 'Guest CRM', 'Housekeeping', 'Maintenance'],
    popular: false,
  },
  {
    name: 'Professional', price: 129, desc: 'For growing hotels',
    accessNote: 'Up to 69 rooms · 1 property',
    features: ['Up to 69 rooms', 'Channel Manager', 'Revenue Management', 'Priority support'],
    modules: ['Everything in Starter', 'Channel Manager', 'Revenue Management', 'Analytics', 'Booking Engine', 'Loyalty Program', 'Reputation Management', 'Guest Portal'],
    popular: true,
  },
  {
    name: 'Business', price: 299, desc: 'For serious operations',
    accessNote: 'Up to 199 rooms · 1 property',
    features: ['Up to 199 rooms', 'API access', 'Integration Hub', 'Hostera AI'],
    modules: ['Everything in Professional', 'Integration Hub', 'Inventory Management', 'Expenses', 'Marketing Tools', 'Document Templates', 'API & Webhooks', 'Hostera AI'],
    popular: false,
  },
  {
    name: 'Enterprise', price: 499, desc: 'For multi-property groups',
    accessNote: 'Unlimited rooms · unlimited properties',
    features: ['Unlimited rooms', 'Consolidated reporting', 'Dedicated support', 'Custom onboarding'],
    modules: ['Everything in Business', 'Unlimited properties', 'Consolidated reporting', 'Staff & Shift Management', 'Custom onboarding'],
    popular: false,
  },
];

export const INTEGRATION_CATEGORIES = [
  {
    name: 'Distribution & OTA',
    items: [
      { name: 'Booking.com', status: 'Available' },
      { name: 'Expedia', status: 'Available' },
      { name: 'Airbnb', status: 'Available' },
      { name: 'Agoda', status: 'Connector ready' },
      { name: 'Google Hotel', status: 'Available' },
      { name: 'Trip.com', status: 'Connector ready' },
      { name: 'GDS Networks', status: 'On roadmap' },
      { name: 'Metasearch', status: 'On roadmap' },
    ],
  },
  {
    name: 'Payments',
    items: [
      { name: 'Stripe', status: 'Connector ready' },
      { name: 'Adyen', status: 'On roadmap' },
      { name: 'PayPal', status: 'On roadmap' },
      { name: 'Checkout.com', status: 'On roadmap' },
    ],
  },
  {
    name: 'F&B & POS',
    items: [
      { name: 'Nutro', status: 'Strategic partner', featured: true, desc: 'Restaurant orders charged directly to guest folios — the Liafrik F&B platform.' },
    ],
  },
  {
    name: 'Accounting',
    items: [
      { name: 'LiBooks', status: 'Strategic partner', featured: true, desc: 'Invoices, payments and tax data synced to the Liafrik accounting platform.' },
    ],
  },
  {
    name: 'AI & Intelligence',
    items: [
      { name: 'OpenAI', status: 'Available' },
      { name: 'Claude', status: 'Available' },
      { name: 'Gemini', status: 'Available' },
      { name: 'Perplexity', status: 'Connector ready' },
      { name: 'ElevenLabs', status: 'Connector ready' },
      { name: 'DeepL', status: 'Connector ready' },
      { name: 'Mistral AI', status: 'On roadmap' },
      { name: 'Hugging Face', status: 'On roadmap' },
      { name: 'Midjourney', status: 'On roadmap' },
      { name: 'Meta AI', status: 'On roadmap' },
    ],
  },
  {
    name: 'Communication',
    items: [
      { name: 'Email', status: 'Available' },
      { name: 'SMS', status: 'Connector ready' },
      { name: 'WhatsApp', status: 'On roadmap' },
    ],
  },
  {
    name: 'Property Hardware',
    items: [
      { name: 'Smart Locks', status: 'On roadmap' },
      { name: 'Keycard Systems', status: 'On roadmap' },
      { name: 'ID Scanners', status: 'On roadmap' },
      { name: 'Kiosks', status: 'On roadmap' },
    ],
  },
];

export const FAQS = [
  {
    category: 'Product',
    items: [
      { q: 'What is Hostera?', a: 'Hostera is a global hospitality operating system — a complete platform combining PMS, front desk, reservations, housekeeping, maintenance, billing, revenue management, channel distribution, guest experience and analytics in one product.' },
      { q: 'Is Hostera suitable for small properties?', a: 'Yes. The Starter plan covers small properties with up to 20 rooms, and every module is designed to be easy to learn for small teams while scaling to enterprise hotel groups.' },
      { q: 'Can guests use Hostera without an account?', a: 'Yes. Guests can browse and book through the guest-facing experience without creating an account. Guests never pay any Hostera subscription — hotels pay for the platform.' },
      { q: 'Which property types does Hostera support?', a: 'Hotels, resorts, motels, hostels, B&Bs, guest houses, villas, apartments, serviced apartments, aparthotels, lodges, inns, boutique hotels, extended-stay properties and multi-property groups.' },
    ],
  },
  {
    category: 'Pricing & Billing',
    items: [
      { q: 'How much does Hostera cost?', a: 'Plans start at $49/month (Starter), with Professional at $129, Business at $299 and Enterprise at $499 per month. Annual billing gives you two months free. No hidden service fees.' },
      { q: 'Do guests pay any fees to Hostera?', a: 'Never. Hostera is a B2B SaaS — hotels and property groups pay the subscription. Guest-facing experiences are free for guests.' },
      { q: 'Can I change plans later?', a: 'Yes, you can upgrade or downgrade at any time from within the platform. Changes are applied to your next billing cycle.' },
      { q: 'Is there a free trial?', a: 'Yes — every new organization starts on a full-featured trial so your team can test every module before committing.' },
    ],
  },
  {
    category: 'Security & Privacy',
    items: [
      { q: 'How is my data isolated from other hotels?', a: 'Hostera is a strict multi-tenant platform. Every record is scoped to your organization and property, with tenant isolation enforced server-side — never just in the interface.' },
      { q: 'Does Hostera support GDPR and regional privacy rules?', a: 'Hostera is built with consent management, data retention, export and deletion controls designed for international privacy frameworks. Country-specific compliance is configurable per property.' },
      { q: 'Who can see my guest data?', a: 'Only users you invite with the roles you assign. All staff actions are recorded in an append-only audit log, and guest data never crosses unrelated hotels.' },
    ],
  },
  {
    category: 'Support & Onboarding',
    items: [
      { q: 'How long does onboarding take?', a: 'Most properties are live within a day: create your organization, add your property, configure rooms and rates, invite staff — and start operating.' },
      { q: 'What support do I get?', a: 'Every plan includes support, with priority support on Professional and a dedicated channel for Enterprise customers. In-app support tickets are tenant-aware and fully traceable.' },
      { q: 'Can I migrate from another PMS?', a: 'Yes. Our data import architecture supports bringing over rooms, room types, rate plans and guest profiles. Contact us to plan your migration.' },
    ],
  },
];