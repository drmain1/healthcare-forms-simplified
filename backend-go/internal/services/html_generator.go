package services

import (
	"bytes"
	"html/template"
	"log"

	"github.com/gemini/forms-api/internal/data"
)

// GenerateHTMLFromTemplate generates an HTML document from a template and data.
func GenerateHTMLFromTemplate(questions []VisibleQuestion, clinicInfo *data.ClinicInfo) (string, error) {
	// Debug logging
	if clinicInfo != nil {
		log.Printf("DEBUG: ClinicInfo passed to template: %+v", *clinicInfo)
	} else {
		log.Printf("DEBUG: ClinicInfo is nil")
	}
	
	tmpl, err := template.New("pdf").Parse(pdfTemplate)
	if err != nil {
		return "", err
	}

	data := struct {
		Questions  []VisibleQuestion
		ClinicInfo *data.ClinicInfo
	}{
		Questions:  questions,
		ClinicInfo: clinicInfo,
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}

const pdfTemplate = `
<!DOCTYPE html>
<html>
<head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #000000;
    background: #ffffff;
    margin: 0;
    padding: 48px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 24px;
    margin-bottom: 36px;
    border-bottom: 2px solid #000000;
  }
  
  .clinic-details {
    flex: 1;
  }
  
  .clinic-name {
    font-size: 24px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: -0.02em;
    margin-bottom: 14px;
    color: #000000;
  }
  
  .clinic-address {
    font-size: 14px;
    font-weight: 400;
    line-height: 1.6;
    color: #3a3a3a;
  }
  
  .contact-info {
    text-align: right;
    font-size: 14px;
    font-weight: 400;
    color: #3a3a3a;
    padding-top: 4px;
  }
  
  .contact-info div {
    margin-bottom: 4px;
  }
  
  /* Distinctive thick bar section header */
  .section-bar {
    height: 56px;
    background: #000000 !important;
    display: flex;
    align-items: center;
    padding: 0 24px;
    margin: 48px 0 36px 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  .section-bar.first {
    margin-top: 0;
  }
  
  .section-title {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #ffffff !important;
  }
  
  /* Content area with subtle background */
  .content-area {
    background: #fafafa !important;
    padding: 32px;
    margin-bottom: 36px;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  .question {
    padding: 20px 0;
    border-bottom: 1px solid #e0e0e0;
    page-break-inside: avoid;
  }
  
  .question:first-child {
    padding-top: 0;
  }
  
  .question:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  
  .question-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6a6a6a;
    margin-bottom: 8px;
  }
  
  .question-answer {
    font-size: 15px;
    font-weight: 400;
    color: #000000;
    line-height: 1.5;
  }
  
  .question-answer:empty:before {
    content: '\00a0';
  }
  
  /* Print optimizations */
  @media print {
    body {
      padding: 30px;
      background: white !important;
    }
    
    .section-bar {
      background: #000000 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .section-title {
      color: #ffffff !important;
    }
    
    .content-area {
      background: #fafafa !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .section-bar {
      border: 2px solid #000000;
    }
    
    .content-area {
      border: 1px solid #000000;
    }
  }
  
  /* Patient Demographics Form Styles */
  .demographics-form {
    padding: 0;
    margin: 0;
  }
  
  .form-row {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;
    align-items: flex-end;
  }
  
  .form-field {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  
  .form-field.full-width {
    flex: 1;
    width: 100%;
  }
  
  .field-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #000000;
    margin-bottom: 4px;
  }
  
  .field-value {
    font-size: 15px;
    font-weight: 400;
    color: #000000;
    min-height: 24px;
    padding: 2px 0;
  }
  
  .field-value.underline {
    border-bottom: 1px solid #000000;
    padding-bottom: 4px;
    min-width: 120px;
  }
  
  .field-value:empty:before {
    content: '\00a0';
  }
  
  .checkbox-group {
    display: flex;
    gap: 16px;
    font-size: 14px;
    padding: 4px 0;
  }
  
  .checkbox {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  /* Secondary section styling */
  .section-bar.secondary {
    height: 48px;
    background: #4a4a4a !important;
  }
  
  .section-bar.secondary .section-title {
    font-size: 13px;
  }
  
  .other-questions {
    padding-top: 16px;
  }
</style>
</head>
<body>

{{if .ClinicInfo}}
<div class="header">
  <div class="clinic-details">
    <div class="clinic-name">{{.ClinicInfo.ClinicName}}</div>
    <div class="clinic-address">
      {{.ClinicInfo.AddressLine1}}<br>
      {{if .ClinicInfo.AddressLine2}}{{.ClinicInfo.AddressLine2}}<br>{{end}}
      {{.ClinicInfo.City}}, {{.ClinicInfo.State}} {{.ClinicInfo.ZipCode}}
    </div>
  </div>
  <div class="contact-info">
    <div>{{.ClinicInfo.Phone}}</div>
    <div>{{.ClinicInfo.Email}}</div>
    {{if .ClinicInfo.Website}}<div>{{.ClinicInfo.Website}}</div>{{end}}
  </div>
</div>
{{end}}

<div class="section-bar first">
  <div class="section-title">Patient Information</div>
</div>

<div class="content-area">
  <!-- Formatted patient demographics section -->
  <div class="demographics-form">
    <!-- Today's Date row -->
    <div class="form-row">
      <div class="form-field">
        <span class="field-label">Today's Date</span>
        <span class="field-value">{{range .Questions}}{{if eq .Title "Today's Date"}}{{.Answer}}{{end}}{{end}}</span>
      </div>
    </div>
    
    <!-- First Name and Last Name row -->
    <div class="form-row">
      <div class="form-field" style="flex: 1;">
        <span class="field-label">First Name</span>
        <span class="field-value underline">{{range .Questions}}{{if eq .Title "First Name"}}{{.Answer}}{{end}}{{end}}</span>
      </div>
      <div class="form-field" style="flex: 1;">
        <span class="field-label">Last Name</span>
        <span class="field-value underline">{{range .Questions}}{{if eq .Title "Last Name"}}{{.Answer}}{{end}}{{end}}</span>
      </div>
    </div>
    
    <!-- Gender, Date of Birth row -->
    <div class="form-row">
      <div class="form-field" style="width: 150px;">
        <span class="field-label">Gender</span>
        <span class="checkbox-group">
          {{range .Questions}}{{if eq .Title "Sex Assigned at Birth"}}
            <span class="checkbox">{{if eq .Answer "male"}}☑{{else}}☐{{end}} M</span>
            <span class="checkbox">{{if eq .Answer "female"}}☑{{else}}☐{{end}} F</span>
          {{end}}{{end}}
        </span>
      </div>
      <div class="form-field" style="flex: 1;">
        <span class="field-label">Date of Birth</span>
        <span class="field-value underline">{{range .Questions}}{{if eq .Title "Date of Birth"}}{{.Answer}}{{end}}{{end}}</span>
      </div>
    </div>
    
    <!-- Street Address -->
    <div class="form-row">
      <div class="form-field full-width">
        <span class="field-label">Street Address</span>
        <span class="field-value underline">{{range .Questions}}{{if eq .Title "Street Address"}}{{.Answer}}{{end}}{{end}}</span>
      </div>
    </div>
    
    <!-- City, State, Zip Code row -->
    <div class="form-row">
      <div class="form-field" style="flex: 2;">
        <span class="field-label">City</span>
        <span class="field-value underline">{{range .Questions}}{{if eq .Title "City"}}{{.Answer}}{{end}}{{end}}</span>
      </div>
      <div class="form-field" style="flex: 1;">
        <span class="field-label">State</span>
        <span class="field-value underline">{{range .Questions}}{{if eq .Title "State"}}{{.Answer}}{{end}}{{end}}</span>
      </div>
      <div class="form-field" style="flex: 1;">
        <span class="field-label">Zip Code</span>
        <span class="field-value underline">{{range .Questions}}{{if eq .Title "ZIP Code"}}{{.Answer}}{{end}}{{end}}</span>
      </div>
    </div>
    
    <!-- Phone and Email -->
    <div class="form-row">
      <div class="form-field" style="flex: 1;">
        <span class="field-label">Phone</span>
        <span class="field-value underline">{{range .Questions}}{{if eq .Title "Primary Phone Number"}}{{.Answer}}{{end}}{{end}}</span>
      </div>
      <div class="form-field" style="flex: 1;">
        <span class="field-label">Email</span>
        <span class="field-value underline">{{range .Questions}}{{if eq .Title "Email Address"}}{{.Answer}}{{end}}{{end}}</span>
      </div>
    </div>
    
    <!-- Secondary Phone (Optional) -->
    {{range .Questions}}
    {{if eq .Title "Secondary Phone Number"}}
    <div class="form-row">
      <div class="form-field" style="flex: 1;">
        <span class="field-label">Secondary Phone Number</span>
        <span class="field-value underline">{{.Answer}}</span>
        <span class="checkbox-group" style="margin-left: 10px;">
          <span class="checkbox">☐ W</span>
          <span class="checkbox">☐ H</span>
          <span class="checkbox">☐ C</span>
        </span>
      </div>
    </div>
    {{end}}
    {{end}}
  </div>
  
  <!-- Other questions that are not demographics -->
  {{$hasOtherQuestions := false}}
  {{range .Questions}}
    {{if and (ne .Title "First Name") (ne .Title "Last Name") (ne .Title "Today's Date") (ne .Title "Street Address") (ne .Title "Date of Birth") (ne .Title "Sex Assigned at Birth") (ne .Title "City") (ne .Title "State") (ne .Title "ZIP Code") (ne .Title "Primary Phone Number") (ne .Title "Secondary Phone Number") (ne .Title "Email Address")}}
      {{$hasOtherQuestions = true}}
    {{end}}
  {{end}}
  
  {{if $hasOtherQuestions}}
  <div class="section-bar secondary" style="margin-top: 40px;">
    <div class="section-title">Clinical Information</div>
  </div>
  <div class="other-questions">
    {{range .Questions}}
      {{if and (ne .Title "First Name") (ne .Title "Last Name") (ne .Title "Today's Date") (ne .Title "Street Address") (ne .Title "Date of Birth") (ne .Title "Sex Assigned at Birth") (ne .Title "City") (ne .Title "State") (ne .Title "ZIP Code") (ne .Title "Primary Phone Number") (ne .Title "Secondary Phone Number") (ne .Title "Email Address")}}
      <div class="question">
        <div class="question-title">{{.Title}}</div>
        <div class="question-answer">{{if .Answer}}{{.Answer}}{{else}}&nbsp;{{end}}</div>
      </div>
      {{end}}
    {{end}}
  </div>
  {{end}}
</div>

</body>
</html>
`
