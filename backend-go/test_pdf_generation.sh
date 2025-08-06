#!/bin/bash

# Test PDF Generation Fix
echo "Testing PDF generation after fixing field mappings..."
echo ""
echo "The fix changed:"
echo "  - 'form_id' -> 'form' (Firestore field name)"
echo "  - 'response_data' -> 'data' (Firestore field name)"
echo ""
echo "To test:"
echo "1. Create a new form response in the frontend"
echo "2. Try to generate a PDF for that response"
echo "3. Check if it returns a PDF (200) instead of Bad Request (400)"
echo ""
echo "Current service URL: https://healthcare-forms-backend-go-673381373352.us-central1.run.app"
echo "Revision: healthcare-forms-backend-go-00040-5jj"