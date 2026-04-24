import { createCrudRoutes } from './routeFactory.js';

export default createCrudRoutes('prior_art_analyses', {
  systemPrompt: 'You are an expert prior art analyst for patent applications. Analyze inventions, identify relevant prior art references, assess novelty and non-obviousness, and provide detailed patentability opinions.',
  defaultAction: 'Analyze this invention for prior art and provide a detailed patentability assessment including novelty analysis and relevant references.',
});
