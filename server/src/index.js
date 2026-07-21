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
import governedPatentMatters from './governance/index.cjs';

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;
if ((process.env.JWT_SECRET || '').length < 32 || !process.env.GOVERNANCE_TENANT_ID) {
  throw new Error('JWT_SECRET (32+ characters) and GOVERNANCE_TENANT_ID are required');
}

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
app.use('/api/governed-patent-matters', governedPatentMatters);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


if (process.env.ENABLE_GENERATED_ROUTES === 'true' && process.env.NODE_ENV !== 'production') {
  const customRoutes = [
    ['/api/cf-agentic-patent-prosecution', './routes/customFeat01_AgenticPatentProsecution.js'],
    ['/api/cf-novelty-scoring-engine', './routes/customFeat02_NoveltyScoringEngine.js'],
    ['/api/cf-competitor-threat-intelligence', './routes/customFeat03_CompetitorThreatIntelligence.js'],
    ['/api/cf-international-filing-optimizer', './routes/customFeat04_InternationalFilingOptimizer.js'],
    ['/api/cf-claim-infringement-checker', './routes/customFeat05_ClaimInfringementChecker.js']
  ];
  for (const [mountPath, modulePath] of customRoutes) {
    const module = await import(modulePath);
    app.use(mountPath, module.default);
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
