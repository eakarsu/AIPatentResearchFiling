import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import AIHistory from './pages/AIHistory';
import AIPredictive from './pages/AIPredictive';
import Layout from './components/Layout';

// // === Batch 06 Gaps & Frontend Mounts ===
import CFAgenticPatentProsecutionPage from './pages/CFAgenticPatentProsecutionPage';
import CFNoveltyScoringEnginePage from './pages/CFNoveltyScoringEnginePage';
import CFCompetitorThreatIntelligencePage from './pages/CFCompetitorThreatIntelligencePage';
import CFInternationalFilingOptimizerPage from './pages/CFInternationalFilingOptimizerPage';
import CFClaimInfringementCheckerPage from './pages/CFClaimInfringementCheckerPage';
import GapClaimsWithoutClaimPage from './pages/GapClaimsWithoutClaimPage';
import GapLandscapeWithoutMarketPage from './pages/GapLandscapeWithoutMarketPage';
import GapFilingWithoutRejectionPage from './pages/GapFilingWithoutRejectionPage';
import GapCompetitorWithoutCompetitorPage from './pages/GapCompetitorWithoutCompetitorPage';
import GapInfringementWithoutInfringementPage from './pages/GapInfringementWithoutInfringementPage';
import GapNoUsptoIntegrationAutomatedFilingStatusTrackPage from './pages/GapNoUsptoIntegrationAutomatedFilingStatusTrackPage';
import GapNoForeignPatentCoordinationPctFilingCountryPage from './pages/GapNoForeignPatentCoordinationPctFilingCountryPage';
import GapNoIntegrationWithScientificLiteratureDatabasePage from './pages/GapNoIntegrationWithScientificLiteratureDatabasePage';
import GapLimitedInventorManagementNoInventorContributiPage from './pages/GapLimitedInventorManagementNoInventorContributiPage';
import GapNoLicensingMarketplacePage from './pages/GapNoLicensingMarketplacePage';
import GapLimitedFrontendOnly4PagesForA18Page from './pages/GapLimitedFrontendOnly4PagesForA18Page';
import GapNoWebhooksForUsptoDocketUpdatesPage from './pages/GapNoWebhooksForUsptoDocketUpdatesPage';
import GapNoNotificationsLayerForFilingDeadlinesPage from './pages/GapNoNotificationsLayerForFilingDeadlinesPage';
import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (loading) return null;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

        <Route path="/" element={<Dashboard />} />
        <Route path="/feature/:featureKey" element={<FeaturePage />} />
        <Route path="/ai-history" element={<AIHistory />} />
        <Route path="/ai-predictive" element={<AIPredictive />} />

        {/* === Batch 06 Custom Features === */}
        <Route path="/cf-agentic-patent-prosecution" element={<CFAgenticPatentProsecutionPage />} />
        <Route path="/cf-novelty-scoring-engine" element={<CFNoveltyScoringEnginePage />} />
        <Route path="/cf-competitor-threat-intelligence" element={<CFCompetitorThreatIntelligencePage />} />
        <Route path="/cf-international-filing-optimizer" element={<CFInternationalFilingOptimizerPage />} />
        <Route path="/cf-claim-infringement-checker" element={<CFClaimInfringementCheckerPage />} />

        {/* === Batch 06 Gap Features === */}
        <Route path="/gap-claims-without-claim" element={<GapClaimsWithoutClaimPage />} />
        <Route path="/gap-landscape-without-market" element={<GapLandscapeWithoutMarketPage />} />
        <Route path="/gap-filing-without-rejection" element={<GapFilingWithoutRejectionPage />} />
        <Route path="/gap-competitor-without-competitor" element={<GapCompetitorWithoutCompetitorPage />} />
        <Route path="/gap-infringement-without-infringement" element={<GapInfringementWithoutInfringementPage />} />
        <Route path="/gap-no-uspto-integration-automated-filing-status-track" element={<GapNoUsptoIntegrationAutomatedFilingStatusTrackPage />} />
        <Route path="/gap-no-foreign-patent-coordination-pct-filing-country" element={<GapNoForeignPatentCoordinationPctFilingCountryPage />} />
        <Route path="/gap-no-integration-with-scientific-literature-database" element={<GapNoIntegrationWithScientificLiteratureDatabasePage />} />
        <Route path="/gap-limited-inventor-management-no-inventor-contributi" element={<GapLimitedInventorManagementNoInventorContributiPage />} />
        <Route path="/gap-no-licensing-marketplace" element={<GapNoLicensingMarketplacePage />} />
        <Route path="/gap-limited-frontend-only-4-pages-for-a-18" element={<GapLimitedFrontendOnly4PagesForA18Page />} />
        <Route path="/gap-no-webhooks-for-uspto-docket-updates" element={<GapNoWebhooksForUsptoDocketUpdatesPage />} />
        <Route path="/gap-no-notifications-layer-for-filing-deadlines" element={<GapNoNotificationsLayerForFilingDeadlinesPage />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
