// Configuration for Mobile App connecting to Next.js Backend
// Local Wi-Fi IPv4 Address of your development computer: 192.168.31.178
// When using Expo Go on a physical phone, the phone connects via Wi-Fi IP to host machine.

export const LOCAL_IP = '192.168.31.178';
export const PORT = '3000';

export const API_BASE_URL = `http://${LOCAL_IP}:${PORT}/api`;
