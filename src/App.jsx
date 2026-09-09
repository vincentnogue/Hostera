import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
// Add page imports here
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import PlatformLayout from '@/components/platform/PlatformLayout';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { PropertyProvider } from '@/lib/PropertyContext';

// Pages are lazy-loaded (route-based code splitting) to keep the initial
// bundle small — see PageLoader fallback below.
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const FrontDesk = lazy(() => import('@/pages/FrontDesk'));
const Reservations = lazy(() => import('@/pages/Reservations'));
const RoomRack = lazy(() => import('@/pages/RoomRack'));
const Guests = lazy(() => import('@/pages/Guests'));
const Housekeeping = lazy(() => import('@/pages/Housekeeping'));
const Maintenance = lazy(() => import('@/pages/Maintenance'));
const Landing = lazy(() => import('@/pages/Landing'));
const Finance = lazy(() => import('@/pages/Finance'));
const PropertySettings = lazy(() => import('@/pages/PropertySettings'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const ChannelManager = lazy(() => import('@/pages/ChannelManager'));
const TeamAccess = lazy(() => import('@/pages/TeamAccess'));
const GuestPortal = lazy(() => import('@/pages/GuestPortal'));
const RevenueManagement = lazy(() => import('@/pages/RevenueManagement'));
const Inventory = lazy(() => import('@/pages/Inventory'));
const Reputation = lazy(() => import('@/pages/Reputation'));
const ActivityLogs = lazy(() => import('@/pages/ActivityLogs'));
const RoomTypes = lazy(() => import('@/pages/RoomTypes'));
const DocumentTemplates = lazy(() => import('@/pages/DocumentTemplates'));
const ReputationManagement = lazy(() => import('@/pages/ReputationManagement'));
const IntegrationHub = lazy(() => import('@/pages/IntegrationHub'));
const LoyaltyProgram = lazy(() => import('@/pages/LoyaltyProgram'));
const StaffDirectory = lazy(() => import('@/pages/StaffDirectory'));
const InventoryManagement = lazy(() => import('@/pages/InventoryManagement'));
const RateManager = lazy(() => import('@/pages/RateManager'));
const ActivityLog = lazy(() => import('@/pages/ActivityLog'));
const BookingEngine = lazy(() => import('@/pages/BookingEngine'));
const ShiftManagement = lazy(() => import('@/pages/ShiftManagement'));
const MarketingTools = lazy(() => import('@/pages/MarketingTools'));
const AuditLogs = lazy(() => import('@/pages/AuditLogs'));
const Expenses = lazy(() => import('@/pages/Expenses'));
const PlatformHR = lazy(() => import('@/pages/platform/PlatformHR'));
const PlatformAdmins = lazy(() => import('@/pages/platform/PlatformAdmins'));
const DocumentCenter = lazy(() => import('@/pages/DocumentCenter'));
const RatePlans = lazy(() => import('@/pages/RatePlans'));
const Subscription = lazy(() => import('@/pages/Subscription'));
const ShiftLogs = lazy(() => import('@/pages/ShiftLogs'));
const GuestPortalConfig = lazy(() => import('@/pages/GuestPortalConfig'));
const PropertyCalendar = lazy(() => import('@/pages/PropertyCalendar'));
const HouseRules = lazy(() => import('@/pages/HouseRules'));
const LostAndFound = lazy(() => import('@/pages/LostAndFound'));
const VendorDirectory = lazy(() => import('@/pages/VendorDirectory'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const PlatformOverview = lazy(() => import('@/pages/platform/PlatformOverview'));
const PlatformOrganizations = lazy(() => import('@/pages/platform/PlatformOrganizations'));
const PlatformSubscriptions = lazy(() => import('@/pages/platform/PlatformSubscriptions'));
const CommercialCodes = lazy(() => import('@/pages/platform/CommercialCodes'));
const PlatformSupport = lazy(() => import('@/pages/platform/PlatformSupport'));
const PlatformSecurity = lazy(() => import('@/pages/platform/PlatformSecurity'));
const PlatformSystemHealth = lazy(() => import('@/pages/platform/PlatformSystemHealth'));
const PlatformFeatureFlags = lazy(() => import('@/pages/platform/PlatformFeatureFlags'));
const PlatformAnnouncements = lazy(() => import('@/pages/platform/PlatformAnnouncements'));
const PlatformAudit = lazy(() => import('@/pages/platform/PlatformAudit'));
const Features = lazy(() => import('@/pages/marketing/Features'));
const Industries = lazy(() => import('@/pages/marketing/Industries'));
const Pricing = lazy(() => import('@/pages/marketing/Pricing'));
const Integrations = lazy(() => import('@/pages/marketing/Integrations'));
const AiPlatform = lazy(() => import('@/pages/marketing/AiPlatform'));
const Security = lazy(() => import('@/pages/marketing/Security'));
const About = lazy(() => import('@/pages/marketing/About'));
const Contact = lazy(() => import('@/pages/marketing/Contact'));
const FAQ = lazy(() => import('@/pages/marketing/FAQ'));
const Developers = lazy(() => import('@/pages/marketing/Developers'));
const StatusPage = lazy(() => import('@/pages/marketing/StatusPage'));
const Legal = lazy(() => import('@/pages/marketing/Legal'));
const GuestDashboard = lazy(() => import('@/pages/GuestDashboard'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/features" element={<Features />} />
          <Route path="/industries" element={<Industries />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/ai" element={<AiPlatform />} />
          <Route path="/security" element={<Security />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/developers" element={<Developers />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/legal/privacy" element={<Legal doc="privacy" />} />
          <Route path="/legal/terms" element={<Legal doc="terms" />} />
          <Route path="/legal/cookies" element={<Legal doc="cookies" />} />
          <Route path="/legal/data-processing" element={<Legal doc="data-processing" />} />
          <Route path="/legal/accessibility" element={<Legal doc="accessibility" />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/guest" element={<GuestDashboard />} />
          <Route element={<PropertyProvider><Layout /></PropertyProvider>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/front-desk" element={<FrontDesk />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/room-rack" element={<RoomRack />} />
            <Route path="/room-types" element={<RoomTypes />} />
            <Route path="/guests" element={<Guests />} />
            <Route path="/guest-portal" element={<GuestPortal />} />
            <Route path="/housekeeping" element={<Housekeeping />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/revenue-management" element={<RevenueManagement />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/channel-manager" element={<ChannelManager />} />
            <Route path="/reputation" element={<Reputation />} />
            <Route path="/team-access" element={<TeamAccess />} />
            <Route path="/activity-logs" element={<ActivityLogs />} />
            <Route path="/document-templates" element={<DocumentTemplates />} />
            <Route path="/booking-engine" element={<BookingEngine />} />
            <Route path="/loyalty-program" element={<LoyaltyProgram />} />
            <Route path="/reputation-management" element={<ReputationManagement />} />
            <Route path="/inventory-management" element={<InventoryManagement />} />
            <Route path="/staff-directory" element={<StaffDirectory />} />
            <Route path="/shift-management" element={<ShiftManagement />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/rate-manager" element={<RateManager />} />
            <Route path="/integration-hub" element={<IntegrationHub />} />
            <Route path="/marketing-tools" element={<MarketingTools />} />
            <Route path="/activity-log" element={<ActivityLog />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/document-center" element={<DocumentCenter />} />
            <Route path="/rate-plans" element={<RatePlans />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/shift-logs" element={<ShiftLogs />} />
            <Route path="/guest-portal-config" element={<GuestPortalConfig />} />
            <Route path="/property-calendar" element={<PropertyCalendar />} />
            <Route path="/house-rules" element={<HouseRules />} />
            <Route path="/lost-and-found" element={<LostAndFound />} />
            <Route path="/vendor-directory" element={<VendorDirectory />} />
            <Route path="/expense-manager" element={<Expenses />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/property-settings" element={<PropertySettings />} />
          </Route>
          <Route element={<PlatformLayout />}>
            <Route path="/platform" element={<PlatformOverview />} />
            <Route path="/platform/organizations" element={<PlatformOrganizations />} />
            <Route path="/platform/subscriptions" element={<PlatformSubscriptions />} />
            <Route path="/platform/commercial-codes" element={<CommercialCodes />} />
            <Route path="/platform/support" element={<PlatformSupport />} />
            <Route path="/platform/security" element={<PlatformSecurity />} />
            <Route path="/platform/system-health" element={<PlatformSystemHealth />} />
            <Route path="/platform/feature-flags" element={<PlatformFeatureFlags />} />
            <Route path="/platform/announcements" element={<PlatformAnnouncements />} />
            <Route path="/platform/audit" element={<PlatformAudit />} />
            <Route path="/platform/hr" element={<PlatformHR />} />
            <Route path="/platform/admins" element={<PlatformAdmins />} />
          </Route>
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
