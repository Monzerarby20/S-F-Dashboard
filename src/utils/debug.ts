// Debug utility to log API configuration
export const logAPIConfig = () => {
  console.log('🔧 API Configuration Debug:');
  console.log('- VITE_APP_API_BASE_URL:', import.meta.env.VITE_APP_API_BASE_URL);
  console.log('- Current location:', window.location.href);
  console.log('- All env vars:', import.meta.env);
  
  // Test if ngrok URL is accessible
  if (import.meta.env.VITE_APP_API_BASE_URL) {
    fetch(import.meta.env.VITE_APP_API_BASE_URL + '/status', {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })
    .then(response => {
      console.log('✅ Ngrok URL accessible:', response.status);
    })
    .catch(error => {
      console.log('❌ Ngrok URL not accessible:', error);
    });
  }
};