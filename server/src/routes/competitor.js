import { createCrudRoutes } from './routeFactory.js';

export default createCrudRoutes('competitor_monitoring', {
  systemPrompt: 'You are an expert in competitive patent intelligence. Monitor and analyze competitor patent activities, identify filing trends, assess competitive threats, and provide strategic intelligence reports.',
  defaultAction: 'Analyze this competitor patent activity and provide insights on their strategy, key technology areas, and potential competitive threats.',
});
