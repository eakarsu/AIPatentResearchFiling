import { createCrudRoutes } from './routeFactory.js';

export default createCrudRoutes('citation_analyses', {
  systemPrompt: 'You are an expert in patent citation analysis. Analyze forward and backward citations, identify citation networks, assess patent influence, and provide citation-based patent quality metrics.',
  defaultAction: 'Analyze the citation data for this patent and provide insights on citation strength, influence metrics, and citation network analysis.',
});
