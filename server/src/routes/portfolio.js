import { createCrudRoutes } from './routeFactory.js';

export default createCrudRoutes('patent_portfolios', {
  systemPrompt: 'You are an expert patent portfolio analyst. Analyze patent portfolios for strength, coverage gaps, strategic value, and optimization opportunities. Provide actionable insights for portfolio management.',
  defaultAction: 'Analyze this patent portfolio and provide insights on portfolio strength, technology coverage, and strategic recommendations.',
});
