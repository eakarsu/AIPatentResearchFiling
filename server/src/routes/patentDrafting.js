import { createCrudRoutes } from './routeFactory.js';

export default createCrudRoutes('patent_drafts', {
  systemPrompt: 'You are an expert patent attorney and technical writer. Help draft patent applications with proper legal language, detailed technical descriptions, clear claims, and comprehensive specifications following USPTO guidelines.',
  defaultAction: 'Review this patent draft and provide suggestions for improvement, identify potential issues, and recommend claim strengthening strategies.',
});
