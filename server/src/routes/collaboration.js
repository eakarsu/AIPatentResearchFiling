import { createCrudRoutes } from './routeFactory.js';

export default createCrudRoutes('collaboration_items', {
  systemPrompt: 'You are an expert in patent team collaboration and project management. Help coordinate patent work between inventors, attorneys, and stakeholders. Provide task prioritization, workflow optimization, and collaboration insights.',
  defaultAction: 'Review this collaboration item and provide suggestions for improving team coordination, task prioritization, and workflow efficiency.',
});
