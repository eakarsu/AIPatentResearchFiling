import { createCrudRoutes } from './routeFactory.js';

export default createCrudRoutes('patent_filings', {
  systemPrompt: 'You are an expert patent filing manager. Assist with filing strategies, jurisdiction selection, timeline planning, cost estimation, and compliance requirements for patent applications worldwide.',
  defaultAction: 'Review this patent filing and provide recommendations for filing strategy, jurisdiction priority, and timeline optimization.',
});
