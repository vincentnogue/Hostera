import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import FrontDesk from '@/pages/FrontDesk';
import Reservations from '@/pages/Reservations';
import RoomRack from '@/pages/RoomRack';
import Guests from '@/pages/Guests';
import Housekeeping from '@/pages/Housekeeping';
import Maintenance from '@/pages/Maintenance';
import Landing from '@/pages/Landing';
import Finance from '@/pages/Finance';
import PropertySettings from '@/pages/PropertySettings';
import Analytics from '@/pages/Analytics';
import ChannelManager from '@/pages/ChannelManager';
import TeamAccess from '@/pages/TeamAccess';
import GuestPortal from '@/pages/GuestPortal';
import RevenueManagement from '@/pages/RevenueManagement';
import Inventory from '@/pages/Inventory';
import Reputation from '@/pages/Reputation';
import ActivityLogs from '@/pages/ActivityLogs';
import RoomTypes from '@/pages/RoomTypes';
import DocumentTemplates from '@/pages/DocumentTemplates';
import ReputationManagement from '@/pages/ReputationManagement';
import IntegrationHub from '@/pages/IntegrationHub';
import LoyaltyProgram from '@/pages/LoyaltyProgram';
import StaffDirectory from '@/pages/StaffDirectory';
import InventoryManagement from '@/pages/InventoryManagement';
import RateManager from '@/pages/RateManager';
import ActivityLog from '@/pages/ActivityLog';
import BookingEngine from '@/pages/BookingEngine';
import ShiftManagement from '@/pages/ShiftManagement';
import MarketingTools from '@/pages/MarketingTools';
import AuditLogs from '@/pages/AuditLogs';
import Expenses from '@/pages/Expenses';
import PlatformHR from '@/pages/platform/PlatformHR';
import PlatformAdmins from '@/pages/platform/PlatformAdmins';
import DocumentCenter from '@/pages/DocumentCenter';
import RatePlans from '@/pages/RatePlans';
import Subscription from '@/pages/Subscription';
import ShiftLogs from '@/pages/ShiftLogs';
import GuestPortalConfig from '@/pages/GuestPortalConfig';
import PropertyCalendar from '@/pages/PropertyCalendar';
import HouseRules from '@/pages/HouseRules';
import LostAndFound from '@/pages/LostAndFound';
import VendorDirectory from '@/pages/VendorDirectory';
import Onboarding from '@/pages/Onboarding';
import PlatformLayout from '@/components/platform/PlatformLayout';
import PlatformOverview from '@/pages/platform/PlatformOverview';
import PlatformOrganizations from '@/pages/platform/PlatformOrganizations';
import PlatformSubscriptions from '@/pages/platform/PlatformSubscriptions';
import CommercialCodes from '@/pages/platform/CommercialCodes';
import PlatformSupport from '@/pages/platform/PlatformSupport';
import PlatformSecurity from '@/pages/platform/PlatformSecurity';
import PlatformSystemHealth from '@/pages/platform/PlatformSystemHealth';
import PlatformFeatureFlags from '@/pages/platform/PlatformFeatureFlags';
import PlatformAnnouncements from '@/pages/platform/PlatformAnnouncements';
import PlatformAudit from '@/pages/platform/PlatformAudit';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import Features from '@/pages/marketing/Features';
import Industries from '@/pages/marketing/Industries';
import Pricing from '@/pages/marketing/Pricing';
import Integrations from '@/pages/marketing/Integrations';
import AiPlatform from '@/pages/marketing/AiPlatform';
import Security from '@/pages/marketing/Security';
import About from '@/pages/marketing/About';
import Contact from '@/pages/marketing/Contact';
import FAQ from '@/pages/marketing/FAQ';
import Developers from '@/pages/marketing/Developers';
import StatusPage from '@/pages/marketing/StatusPage';
import Legal from '@/pages/marketing/Legal';
import GuestDashboard from '@/pages/GuestDashboard';

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
        <Route element={<Layout />}>
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
  );
};

function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App