import { createCrudRoutes } from './routeFactory.js';

export default createCrudRoutes('patent_translations', {
  systemPrompt: 'You are an expert patent translator with deep knowledge of patent terminology in multiple languages. Translate patent documents accurately while maintaining legal precision and technical accuracy.',
  defaultAction: 'Translate this patent content and ensure accuracy of technical terms, legal language, and claim structure.',
});
