// src/features/superadmin/dashboard/SuperAdminDashboard.jsx
import { useSuperAdminDashboard } from './hooks/useSuperAdminDashboard';
import DashboardHeader from './components/DashboardHeader';
import KpiGrid from './components/KpiGrid';
import QuickActionGrid from './components/QuickActionGrid';
import RevenueGrowthAnalytics from './components/RevenueGrowthAnalytics';
import SubscriptionAnalytics from './components/SubscriptionAnalytics';
import ExpiringSubscriptionsPanel from './components/ExpiringSubscriptionsPanel';
import SystemHealthPanel from './components/SystemHealthPanel';
import TenantsTable from './components/TenantsTable';
import PaymentsTable from './components/PaymentsTable';
import ActivityTimeline from './components/ActivityTimeline';
import BroadcastModal from './components/BroadcastModal';
import SupportInboxModal from './components/SupportInboxModal';
import CustomizeWidgetsModal from './components/CustomizeWidgetsModal';
import TenantDetailDrawer from './components/TenantDetailDrawer';
import InvoiceDetailModal from './components/InvoiceDetailModal';

const SuperAdminDashboard = () => {
  const {
    loading,
    kpis,
    tenantsList,
    filteredTenants,
    paginatedTenants,
    paymentsList,
    auditLogs,
    tickets,
    securityAlerts,
    timeRange,
    setTimeRange,
    chartData,
    searchTerm,
    setSearchTerm,
    selectedPlanFilter,
    setSelectedPlanFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    expiryDaysFilter,
    setExpiryDaysFilter,
    expiringSubscriptions,
    widgetPrefs,
    showBroadcastModal,
    setShowBroadcastModal,
    showTicketsModal,
    setShowTicketsModal,
    showCustomizeModal,
    setShowCustomizeModal,
    selectedTenantForDrawer,
    setSelectedTenantForDrawer,
    selectedInvoiceForModal,
    setSelectedInvoiceForModal,
    loadDashboardData,
    handleSendBroadcast,
    handleResolveTicket,
    handleCreateTicket,
    handleDismissAlert,
    handleResolveAlert,
    handleRenewSubscription,
    handleSuspendTenant,
    handleImpersonateAdmin,
    handleExportTenantsCSV,
    handleExportPaymentsCSV,
    handleSaveWidgetPrefs,
    handleResetWidgetPrefs,
  } = useSuperAdminDashboard();

  const openTicketCount = tickets.filter((t) => t.status !== 'Resolved').length;

  return (
    <div
      className="animate-fadeIn"
      style={{
        paddingBottom: 40,
        backgroundColor: '#F8FAFC',
        minHeight: '100%',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* 1. HERO / PAGE CONTROL HEADER */}
      <DashboardHeader
        onOpenBroadcast={() => setShowBroadcastModal(true)}
        onOpenSupport={() => setShowTicketsModal(true)}
        onOpenCustomize={() => setShowCustomizeModal(true)}
        onRefresh={loadDashboardData}
        loading={loading}
        openTicketCount={openTicketCount}
      />

      {/* 2. 8-CARD COMPREHENSIVE PRIMARY KPI SYSTEM */}
      {widgetPrefs.kpis !== false && (
        <KpiGrid kpis={kpis} loading={loading} />
      )}

      {/* 3. PLATFORM QUICK ACTION COMMAND TILES (11 ACTIONS) */}
      {widgetPrefs.quickActions !== false && (
        <QuickActionGrid onOpenBroadcast={() => setShowBroadcastModal(true)} />
      )}

      {/* 4. REVENUE + GROWTH ANALYTICS (2-COLUMN) */}
      {widgetPrefs.revenueChart !== false && (
        <RevenueGrowthAnalytics
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          chartData={chartData}
          onExport={handleExportPaymentsCSV}
        />
      )}

      {/* 5. SUBSCRIPTION ANALYTICS & HEALTH MATRIX */}
      {widgetPrefs.subscriptionAnalytics !== false && (
        <SubscriptionAnalytics
          planCounts={kpis.planCounts}
          healthCounts={kpis.healthCounts}
          onSelectFilter={(plan) => setSelectedPlanFilter(plan)}
        />
      )}

      {/* 6. EXPIRING SUBSCRIPTIONS & SECURITY HUB ROW (2-COLUMN) */}
      {(widgetPrefs.expiringSubscriptions !== false || widgetPrefs.systemHealth !== false) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              widgetPrefs.expiringSubscriptions !== false && widgetPrefs.systemHealth !== false
                ? 'repeat(auto-fit, minmax(420px, 1fr))'
                : '1fr',
            gap: 20,
            marginBottom: 28,
          }}
        >
          {widgetPrefs.expiringSubscriptions !== false && (
            <ExpiringSubscriptionsPanel
              expiringSubscriptions={expiringSubscriptions}
              expiryDaysFilter={expiryDaysFilter}
              setExpiryDaysFilter={setExpiryDaysFilter}
              onRenew={handleRenewSubscription}
              onViewTenant={(t) => setSelectedTenantForDrawer(t)}
            />
          )}

          {widgetPrefs.systemHealth !== false && (
            <SystemHealthPanel
              securityAlerts={securityAlerts}
              onDismissAlert={handleDismissAlert}
              onResolveAlert={handleResolveAlert}
            />
          )}
        </div>
      )}

      {/* 7. RECENT INSTITUTIONAL TENANTS ROSTER TABLE */}
      {widgetPrefs.tenantsTable !== false && (
        <TenantsTable
          tenants={paginatedTenants}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedPlanFilter={selectedPlanFilter}
          setSelectedPlanFilter={setSelectedPlanFilter}
          selectedStatusFilter={selectedStatusFilter}
          setSelectedStatusFilter={setSelectedStatusFilter}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          totalCount={filteredTenants.length}
          pageSize={pageSize}
          onExportCSV={handleExportTenantsCSV}
          onViewTenant={(t) => setSelectedTenantForDrawer(t)}
          onImpersonate={handleImpersonateAdmin}
        />
      )}

      {/* 8. RECENT BILLING & LIVE AUDIT TRAIL ROW (2-COLUMN) */}
      {(widgetPrefs.paymentsTable !== false || widgetPrefs.activityFeed !== false) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              widgetPrefs.paymentsTable !== false && widgetPrefs.activityFeed !== false
                ? 'repeat(auto-fit, minmax(420px, 1fr))'
                : '1fr',
            gap: 20,
            marginBottom: 28,
          }}
        >
          {widgetPrefs.paymentsTable !== false && (
            <PaymentsTable
              payments={paymentsList}
              loading={loading}
              onViewInvoice={(p) => setSelectedInvoiceForModal(p)}
            />
          )}

          {widgetPrefs.activityFeed !== false && (
            <ActivityTimeline auditLogs={auditLogs} />
          )}
        </div>
      )}

      {/* MODALS & DRAWERS */}
      <BroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        onSendBroadcast={handleSendBroadcast}
        tenantsCount={tenantsList.length}
      />

      <SupportInboxModal
        isOpen={showTicketsModal}
        onClose={() => setShowTicketsModal(false)}
        tickets={tickets}
        onResolveTicket={handleResolveTicket}
        onCreateTicket={handleCreateTicket}
      />

      <CustomizeWidgetsModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        currentPrefs={widgetPrefs}
        onSavePrefs={handleSaveWidgetPrefs}
        onResetPrefs={handleResetWidgetPrefs}
      />

      <TenantDetailDrawer
        tenant={selectedTenantForDrawer}
        isOpen={Boolean(selectedTenantForDrawer)}
        onClose={() => setSelectedTenantForDrawer(null)}
        onImpersonate={handleImpersonateAdmin}
        onRenew={handleRenewSubscription}
        onSuspend={handleSuspendTenant}
      />

      <InvoiceDetailModal
        invoice={selectedInvoiceForModal}
        isOpen={Boolean(selectedInvoiceForModal)}
        onClose={() => setSelectedInvoiceForModal(null)}
      />
    </div>
  );
};

export default SuperAdminDashboard;
