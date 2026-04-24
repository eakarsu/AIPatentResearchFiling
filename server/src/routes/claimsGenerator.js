import { createCrudRoutes } from './routeFactory.js';

export default createCrudRoutes('patent_claims', {
  systemPrompt: 'You are an expert patent claims drafter. Generate independent and dependent patent claims with proper claim structure, broadest reasonable interpretation, and strategic claim hierarchy. Follow USPTO claim drafting best practices.',
  defaultAction: 'Analyze these patent claims and suggest improvements for broader protection, better claim hierarchy, and stronger dependent claims.',
});
