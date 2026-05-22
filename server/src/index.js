import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import authRoutes from './routes/auth.js';
import patentSearchRoutes from './routes/patentSearch.js';
import priorArtRoutes from './routes/priorArt.js';
import patentDraftingRoutes from './routes/patentDrafting.js';
import claimsGeneratorRoutes from './routes/claimsGenerator.js';
import classificationRoutes from './routes/classification.js';
import infringementRoutes from './routes/infringement.js';
import valuationRoutes from './routes/valuation.js';
import portfolioRoutes from './routes/portfolio.js';
import competitorRoutes from './routes/competitor.js';
import filingRoutes from './routes/filing.js';
import citationRoutes from './routes/citation.js';
import translationRoutes from './routes/translation.js';
import landscapeRoutes from './routes/landscape.js';
import renewalRoutes from './routes/renewal.js';
import collaborationRoutes from './routes/collaboration.js';
import aiRoutes from './routes/ai.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patent-search', patentSearchRoutes);
app.use('/api/prior-art', priorArtRoutes);
app.use('/api/patent-drafting', patentDraftingRoutes);
app.use('/api/claims-generator', claimsGeneratorRoutes);
app.use('/api/classification', classificationRoutes);
app.use('/api/infringement', infringementRoutes);
app.use('/api/valuation', valuationRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/competitor', competitorRoutes);
app.use('/api/filing', filingRoutes);
app.use('/api/citation', citationRoutes);
app.use('/api/translation', translationRoutes);
app.use('/api/landscape', landscapeRoutes);
app.use('/api/renewal', renewalRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// === Custom Feature Mounts (batch_06) ===
import('./routes/customFeat01_AgenticPatentProsecution.js').then(m => app.use('/api/cf-agentic-patent-prosecution', m.default));
import('./routes/customFeat02_NoveltyScoringEngine.js').then(m => app.use('/api/cf-novelty-scoring-engine', m.default));
import('./routes/customFeat03_CompetitorThreatIntelligence.js').then(m => app.use('/api/cf-competitor-threat-intelligence', m.default));
import('./routes/customFeat04_InternationalFilingOptimizer.js').then(m => app.use('/api/cf-international-filing-optimizer', m.default));
import('./routes/customFeat05_ClaimInfringementChecker.js').then(m => app.use('/api/cf-claim-infringement-checker', m.default));


// === Batch 06 Gaps & Frontend Mounts ===
// Gap routes are CommonJS scaffolds; skip if they fail to load under ESM.
const _gapMounts = [
  ['/api/gap-claims-without-claim', './routes/gapFeat_claims_without_claim.js'],
  ['/api/gap-landscape-without-market', './routes/gapFeat_landscape_without_market.js'],
  ['/api/gap-filing-without-rejection', './routes/gapFeat_filing_without_rejection.js'],
  ['/api/gap-competitor-without-competitor', './routes/gapFeat_competitor_without_competitor.js'],
  ['/api/gap-infringement-without-infringement', './routes/gapFeat_infringement_without_infringement.js'],
  ['/api/gap-no-uspto-integration-automated-filing-status-track', './routes/gapFeat_no_uspto_integration_automated_filing_status_track.js'],
  ['/api/gap-no-foreign-patent-coordination-pct-filing-country', './routes/gapFeat_no_foreign_patent_coordination_pct_filing_country.js'],
  ['/api/gap-no-integration-with-scientific-literature-database', './routes/gapFeat_no_integration_with_scientific_literature_database.js'],
  ['/api/gap-limited-inventor-management-no-inventor-contributi', './routes/gapFeat_limited_inventor_management_no_inventor_contributi.js'],
  ['/api/gap-no-licensing-marketplace', './routes/gapFeat_no_licensing_marketplace.js'],
  ['/api/gap-limited-frontend-only-4-pages-for-a-18', './routes/gapFeat_limited_frontend_only_4_pages_for_a_18.js'],
  ['/api/gap-no-webhooks-for-uspto-docket-updates', './routes/gapFeat_no_webhooks_for_uspto_docket_updates.js'],
  ['/api/gap-no-notifications-layer-for-filing-deadlines', './routes/gapFeat_no_notifications_layer_for_filing_deadlines.js'],
];
for (const [mountPath, modPath] of _gapMounts) {
  import(modPath).then(m => app.use(mountPath, m.default || m)).catch(() => {});
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
