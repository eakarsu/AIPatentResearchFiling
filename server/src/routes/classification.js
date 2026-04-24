import { createCrudRoutes } from './routeFactory.js';

export default createCrudRoutes('patent_classifications', {
  systemPrompt: 'You are an expert in patent classification systems including IPC (International Patent Classification) and CPC (Cooperative Patent Classification). Classify inventions accurately and suggest the most relevant classification codes.',
  defaultAction: 'Classify this patent/invention and provide recommended IPC and CPC codes with explanations for each classification.',
});
