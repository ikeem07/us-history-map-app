import 'maplibre-gl/dist/maplibre-gl.css';
import 'antd/dist/reset.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import GA4React from 'ga-4-react';

const ga4react = new GA4React('G-FQ0K0BMW43' , {
  debug_mode: true
});

(async () => {
  try {
    await ga4react.initialize();
  } catch (error) {
    console.error('Error initializing GA4React:', error);
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})();
