import express from 'express';
import cors from 'cors';
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

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
