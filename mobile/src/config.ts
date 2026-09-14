// Configuration for Mobile App connecting to Next.js Backend
// Primary Production Endpoint: https://www.venkatalaksmi.shop/api

export const PRODUCTION_HOST = 'https://www.venkatalaksmi.shop';
export const LOCAL_IP = '192.168.31.178';
export const PORT = '3000';

// Primary Server Endpoint for Standalone APK & Mobile App
export const API_BASE_URL = `${PRODUCTION_HOST}/api`;

// Fallback list of endpoints to attempt when network request fails
export const ENDPOINT_FALLBACKS = [
  API_BASE_URL,
  `http://${LOCAL_IP}:${PORT}/api`,
  `http://localhost:${PORT}/api`,
  `http://10.0.2.2:${PORT}/api`,
  `http://${LOCAL_IP}:3001/api`,
];
