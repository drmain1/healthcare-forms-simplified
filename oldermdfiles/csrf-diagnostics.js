// CSRF Diagnostics Script - Run this in browser console at form.easydocforms.com
// This script will help identify where the CSRF token flow is breaking

(async function csrfDiagnostics() {
    console.log('=== CSRF DIAGNOSTICS STARTING ===');
    console.log('Time:', new Date().toISOString());
    console.log('URL:', window.location.href);
    console.log('');

    // 1. Check sessionStorage
    console.log('1. SESSION STORAGE CHECK:');
    console.log('----------------------------');
    const csrfToken = sessionStorage.getItem('csrfToken');
    console.log('CSRF Token in sessionStorage:', csrfToken ? `Present (${csrfToken.substring(0, 8)}...)` : 'NOT FOUND');
    console.log('All sessionStorage keys:', Object.keys(sessionStorage));
    console.log('');

    // 2. Check cookies
    console.log('2. COOKIES CHECK:');
    console.log('----------------------------');
    const cookies = document.cookie.split(';').map(c => c.trim());
    console.log('All cookies:', cookies.map(c => c.split('=')[0]));
    const sessionCookie = cookies.find(c => c.startsWith('session='));
    console.log('Session cookie:', sessionCookie ? 'Present' : 'NOT FOUND');
    console.log('');

    // 3. Check Redux state (if available)
    console.log('3. REDUX STATE CHECK:');
    console.log('----------------------------');
    try {
        // Try to access Redux DevTools extension
        const reduxState = window.__REDUX_DEVTOOLS_EXTENSION__ ? 
            window.__REDUX_DEVTOOLS_EXTENSION__.getState() : null;
        if (reduxState) {
            console.log('Redux state available');
            console.log('Auth state:', reduxState.auth);
        } else {
            console.log('Redux DevTools not available');
        }
    } catch (e) {
        console.log('Could not access Redux state:', e.message);
    }
    console.log('');

    // 4. Test authentication status
    console.log('4. AUTHENTICATION TEST:');
    console.log('----------------------------');
    try {
        const authResponse = await fetch('/api/forms', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        console.log('GET /api/forms status:', authResponse.status);
        console.log('Response headers:');
        for (let [key, value] of authResponse.headers.entries()) {
            if (key.toLowerCase().includes('csrf') || key.toLowerCase().includes('cookie')) {
                console.log(`  ${key}: ${value}`);
            }
        }
        if (authResponse.status === 401) {
            console.log('❌ Not authenticated');
        } else if (authResponse.status === 200) {
            console.log('✅ Authenticated successfully');
        }
    } catch (e) {
        console.log('Auth test failed:', e.message);
    }
    console.log('');

    // 5. Test CSRF token on POST request
    console.log('5. CSRF POST TEST:');
    console.log('----------------------------');
    console.log('Testing with CSRF token:', csrfToken ? 'Present' : 'Missing');
    
    const testFormData = {
        title: 'CSRF Test Form ' + Date.now(),
        description: 'Testing CSRF validation',
        category: 'Test',
        organization_id: 'test-org',
        json_schema: JSON.stringify({
            title: 'Test',
            pages: [{
                name: 'page1',
                elements: [{
                    type: 'text',
                    name: 'test',
                    title: 'Test Question'
                }]
            }]
        })
    };

    try {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
            console.log('Adding X-CSRF-Token header');
        } else {
            console.log('⚠️ No CSRF token to add to headers');
        }

        console.log('Request headers:', headers);
        
        const createResponse = await fetch('/api/forms', {
            method: 'POST',
            credentials: 'include',
            headers: headers,
            body: JSON.stringify(testFormData)
        });
        
        console.log('POST /api/forms status:', createResponse.status);
        
        if (createResponse.status === 403) {
            const errorText = await createResponse.text();
            console.log('❌ CSRF validation failed:', errorText);
            
            // Check if migration token was generated
            const generatedToken = createResponse.headers.get('X-CSRF-Token-Generated');
            if (generatedToken) {
                console.log('🔄 Migration token generated:', generatedToken.substring(0, 8) + '...');
                console.log('Storing migration token in sessionStorage...');
                sessionStorage.setItem('csrfToken', generatedToken);
            }
        } else if (createResponse.status === 201 || createResponse.status === 200) {
            console.log('✅ CSRF validation passed! Form created successfully');
            const data = await createResponse.json();
            console.log('Created form ID:', data.id);
            // Clean up test form
            if (data.id) {
                await fetch(`/api/forms/${data.id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: csrfToken ? {'X-CSRF-Token': csrfToken} : {}
                });
                console.log('Test form cleaned up');
            }
        } else {
            const errorText = await createResponse.text();
            console.log('Unexpected status:', createResponse.status, errorText);
        }
    } catch (e) {
        console.log('CSRF test failed:', e.message);
    }
    console.log('');

    // 6. Check if token needs refresh
    console.log('6. TOKEN REFRESH CHECK:');
    console.log('----------------------------');
    if (!csrfToken) {
        console.log('Attempting to fetch CSRF token from /api/auth/csrf-token...');
        try {
            const tokenResponse = await fetch('/api/auth/csrf-token', {
                credentials: 'include'
            });
            if (tokenResponse.ok) {
                const data = await tokenResponse.json();
                console.log('Token endpoint response:', data);
                if (data.csrfToken) {
                    sessionStorage.setItem('csrfToken', data.csrfToken);
                    console.log('✅ New token stored in sessionStorage');
                }
            } else {
                console.log('Token endpoint returned:', tokenResponse.status);
            }
        } catch (e) {
            console.log('Token fetch failed:', e.message);
        }
    }
    console.log('');

    // 7. Summary and recommendations
    console.log('=== DIAGNOSTICS SUMMARY ===');
    console.log('Session Storage Token:', csrfToken ? '✅' : '❌');
    console.log('Session Cookie:', sessionCookie ? '✅' : '❌');
    console.log('');
    
    if (!csrfToken && sessionCookie) {
        console.log('🔍 ISSUE IDENTIFIED: You are authenticated but missing CSRF token');
        console.log('RECOMMENDED ACTION: The sessionStorage was likely cleared.');
        console.log('Try refreshing the page or logging out and back in.');
    } else if (!sessionCookie) {
        console.log('🔍 ISSUE IDENTIFIED: No session cookie found');
        console.log('RECOMMENDED ACTION: You need to log in first.');
    } else if (csrfToken && sessionCookie) {
        console.log('✅ Both session and CSRF token present. Issue may be token mismatch.');
        console.log('Check the server logs for CSRF validation details.');
    }
    
    console.log('');
    console.log('=== END DIAGNOSTICS ===');
})();