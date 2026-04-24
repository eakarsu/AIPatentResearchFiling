import { createCrudRoutes } from './routeFactory.js';

export default createCrudRoutes('patent_valuations', {
  systemPrompt: 'You are an expert in patent valuation and IP economics. Estimate patent values using cost, market, and income approaches. Consider factors like technology lifecycle, market size, claim breadth, and competitive landscape.',
  defaultAction: 'Provide a comprehensive patent valuation analysis including estimated value range, methodology used, and key value drivers.',
});
