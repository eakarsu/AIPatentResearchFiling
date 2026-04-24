import { createCrudRoutes } from './routeFactory.js';

export default createCrudRoutes('patent_renewals', {
  systemPrompt: 'You are an expert in patent renewal management and maintenance. Track renewal deadlines, calculate fees, assess cost-benefit of renewals, and recommend renewal strategies to optimize patent portfolio costs.',
  defaultAction: 'Analyze this patent renewal data and provide recommendations on renewal priority, cost optimization, and deadline management.',
});
