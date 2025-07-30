// Test script to verify API connection
const API_URL = 'https://healthcare-forms-backend-673381373352.us-central1.run.app';

async function testConnection() {
  console.log('Testing connection to Cloud Run backend...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_URL}/health/`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test API docs
    console.log('\n2. Testing API docs endpoint...');
    const docsResponse = await fetch(`${API_URL}/docs`);
    console.log('✅ API docs available:', docsResponse.status === 200);
    
    // Test forms endpoint (will fail without auth, but that's expected)
    console.log('\n3. Testing forms API endpoint...');
    const formsResponse = await fetch(`${API_URL}/api/v1/forms/`);
    console.log(`📋 Forms endpoint status: ${formsResponse.status} (401 expected without auth)`);
    
    console.log('\n✅ Backend is accessible from frontend!');
    console.log('\nYour frontend at http://localhost:3000 will now use the Cloud Run backend.');
    console.log('The API URL in .env.development has been updated to:', `${API_URL}/api/v1`);
    
  } catch (error) {
    console.error('❌ Error connecting to backend:', error.message);
  }
}

testConnection();