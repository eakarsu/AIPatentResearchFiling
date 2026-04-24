import { createCrudRoutes } from './routeFactory.js';

export default createCrudRoutes('patent_searches', {
  systemPrompt: 'You are an expert patent search analyst. Help users find relevant patents, analyze search results, and identify key patent documents. Provide detailed, structured analysis with patent numbers, titles, relevance scores, and key findings.',
  defaultAction: 'Analyze this patent search and provide insights on the results, key patents found, and recommendations for further investigation.',
});
