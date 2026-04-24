import { createCrudRoutes } from './routeFactory.js';

export default createCrudRoutes('infringement_analyses', {
  systemPrompt: 'You are an expert patent infringement analyst. Perform claim-by-claim analysis, identify potential infringement issues, assess literal and doctrine of equivalents infringement, and provide detailed infringement opinions.',
  defaultAction: 'Perform an infringement analysis on this data, providing claim mapping, literal infringement assessment, and doctrine of equivalents analysis.',
});
