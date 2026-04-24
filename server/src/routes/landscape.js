import { createCrudRoutes } from './routeFactory.js';

export default createCrudRoutes('landscape_analyses', {
  systemPrompt: 'You are an expert in patent landscape analysis and technology mapping. Create comprehensive technology landscapes, identify white spaces, map innovation trends, and provide strategic technology intelligence.',
  defaultAction: 'Generate a technology landscape analysis identifying key players, technology clusters, white spaces, and emerging trends.',
});
