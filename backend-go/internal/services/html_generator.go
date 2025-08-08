package services

import (
	"bytes"
	"html/template"

	"github.com/gemini/forms-api/internal/data"
)

// GenerateHTMLFromTemplate generates an HTML document from a template and data.
func GenerateHTMLFromTemplate(questions []VisibleQuestion, clinicInfo *data.ClinicInfo) (string, error) {
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
    color: #000000;
  }
  
  .contact-info {
    text-align: right;
    font-size: 14px;
    font-weight: 400;
    color: #000000;
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
  
  /* Content area - no background */
  .content-area {
    padding: 32px;
    margin-bottom: 36px;
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
    color: #000000;
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
  
  /* Signature styles */
  .signature-image {
    max-width: 300px;
    max-height: 150px;
    border: 1px solid #e0e0e0;
    padding: 8px;
    background: white;
    display: inline-block;
  }
  
  .signature-wrapper {
    margin: 12px 0;
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
      <div class="form-field" style="width: 200px;">
        <span class="field-label">Sex Assigned at Birth</span>
        <span class="checkbox-group">
          {{range .Questions}}{{if eq .Title "Sex Assigned at Birth"}}
            <span class="checkbox">{{if eq .Answer "male"}}☑{{else}}☐{{end}} Male</span>
            <span class="checkbox">{{if eq .Answer "female"}}☑{{else}}☐{{end}} Female</span>
            <span class="checkbox">{{if eq .Answer "other"}}☑{{else}}☐{{end}} Other</span>
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
        <span class="field-label">Primary Phone Number</span>
        <span class="field-value underline">{{range .Questions}}{{if eq .Title "Primary Phone Number"}}{{.Answer}}{{end}}{{end}}</span>
      </div>
      <div class="form-field" style="flex: 1;">
        <span class="field-label">Email Address</span>
        <span class="field-value underline">{{range .Questions}}{{if eq .Title "Email Address"}}{{.Answer}}{{end}}{{end}}</span>
      </div>
    </div>
    
    <!-- Secondary Phone (Optional) -->
    {{range .Questions}}
    {{if eq .Title "Secondary Phone Number (Optional)"}}
    <div class="form-row">
      <div class="form-field full-width">
        <span class="field-label">Secondary Phone Number (Optional)</span>
        <span class="field-value underline">{{.Answer}}</span>
      </div>
    </div>
    {{end}}
    {{end}}
    
    <!-- Communication Preference -->
    {{range .Questions}}
    {{if eq .Title "Preferred method of communication"}}
    <div class="form-row">
      <div class="form-field full-width">
        <span class="field-label">Preferred method of communication</span>
        <span class="checkbox-group">
          <span class="checkbox">{{if eq .Answer "Cell Phone"}}☑{{else}}☐{{end}} Cell Phone</span>
          <span class="checkbox">{{if eq .Answer "Home Phone"}}☑{{else}}☐{{end}} Home Phone</span>
          <span class="checkbox">{{if eq .Answer "E-mail"}}☑{{else}}☐{{end}} E-mail</span>
          <span class="checkbox">{{if eq .Answer "Other"}}☑{{else}}☐{{end}} Other</span>
        </span>
      </div>
    </div>
    {{end}}
    {{end}}
    
    <!-- Marital Status -->
    {{range .Questions}}
    {{if eq .Title "Marital Status"}}
    <div class="form-row">
      <div class="form-field">
        <span class="field-label">Marital Status</span>
        <span class="checkbox-group">
          <span class="checkbox">{{if eq .Answer "M"}}☑{{else}}☐{{end}} M</span>
          <span class="checkbox">{{if eq .Answer "S"}}☑{{else}}☐{{end}} S</span>
          <span class="checkbox">{{if eq .Answer "W"}}☑{{else}}☐{{end}} W</span>
          <span class="checkbox">{{if eq .Answer "D"}}☑{{else}}☐{{end}} D</span>
        </span>
      </div>
      {{range $.Questions}}
      {{if eq .Title "Name of Spouse/Significant Other"}}
      <div class="form-field" style="flex: 1; margin-left: 20px;">
        <span class="field-label">Name of Spouse/Significant Other</span>
        <span class="field-value underline">{{.Answer}}</span>
      </div>
      {{end}}
      {{end}}
    </div>
    {{end}}
    {{end}}
    
    <!-- Emergency Contact -->
    <div class="form-row">
      <div class="form-field" style="flex: 2;">
        <span class="field-label">Emergency Contact Name</span>
        <span class="field-value underline">{{range .Questions}}{{if eq .Title "Emergency Contact Name"}}{{.Answer}}{{end}}{{end}}</span>
      </div>
      <div class="form-field" style="flex: 1;">
        <span class="field-label">Relationship</span>
        <span class="field-value underline">{{range .Questions}}{{if eq .Title "Relationship"}}{{.Answer}}{{end}}{{end}}</span>
      </div>
      <div class="form-field" style="flex: 1;">
        <span class="field-label">Phone</span>
        <span class="field-value underline">{{range .Questions}}{{if eq .Title "Phone"}}{{.Answer}}{{end}}{{end}}</span>
      </div>
    </div>
    
    <!-- How did you hear about us -->
    <div class="form-row" style="margin-bottom: 0;">
      <div class="form-field full-width">
        <span class="field-label">How did you hear about us?</span>
        <span class="field-value underline">{{range .Questions}}{{if eq .Title "How did you hear about us?"}}{{.Answer}}{{end}}{{end}}</span>
      </div>
    </div>
  </div>
  
  <!-- Check for Consent & Policies section -->
  {{$hasConsent := false}}
  {{$hasOtherQuestions := false}}
  {{range .Questions}}
    {{if or (eq .Title "CONSENT TO CHIROPRACTIC EXAMINATION AND TREATMENT") (eq .Title "Consent to Treatment") (eq .Title "I consent to treatment")}}
      {{$hasConsent = true}}
    {{else if and (ne .Title "First Name") (ne .Title "Last Name") (ne .Title "Today's Date") (ne .Title "Street Address") (ne .Title "Date of Birth") (ne .Title "Sex Assigned at Birth") (ne .Title "City") (ne .Title "State") (ne .Title "ZIP Code") (ne .Title "Primary Phone Number") (ne .Title "Secondary Phone Number (Optional)") (ne .Title "Email Address") (ne .Title "Preferred method of communication") (ne .Title "Marital Status") (ne .Title "Name of Spouse/Significant Other") (ne .Title "Emergency Contact Name") (ne .Title "Relationship") (ne .Title "Phone") (ne .Title "How did you hear about us?")}}
      {{$hasOtherQuestions = true}}
    {{end}}
  {{end}}
  
  <!-- Consent & Policies Section -->
  {{if $hasConsent}}
  <div class="section-bar" style="margin-top: 40px;">
    <div class="section-title">Consent & Policies</div>
  </div>
  <div class="content-area">
    {{range .Questions}}
      {{if or (eq .Title "CONSENT TO CHIROPRACTIC EXAMINATION AND TREATMENT") (eq .Title "Consent to Treatment") (eq .Title "I consent to treatment") (eq .Title "HIPAA Acknowledgment") (eq .Title "Financial Policy Acknowledgment") (eq .Title "Cancellation Policy Acknowledgment")}}
      <div class="question">
        <div class="question-title">{{.Title}}</div>
        <div class="question-answer">
          {{if .SignatureData}}
            <img src="{{.SignatureData}}" class="signature-image" alt="Signature" />
          {{else}}
            {{if .Answer}}{{.Answer}}{{else}}&nbsp;{{end}}
          {{end}}
        </div>
      </div>
      {{end}}
    {{end}}
  </div>
  {{end}}
  
  <!-- Clinical History Section -->
  {{if $hasOtherQuestions}}
  <div class="section-bar" style="margin-top: 40px;">
    <div class="section-title">Clinical History</div>
  </div>
  <div class="content-area">
    {{range .Questions}}
      {{if and (ne .Title "First Name") (ne .Title "Last Name") (ne .Title "Today's Date") (ne .Title "Street Address") (ne .Title "Date of Birth") (ne .Title "Sex Assigned at Birth") (ne .Title "City") (ne .Title "State") (ne .Title "ZIP Code") (ne .Title "Primary Phone Number") (ne .Title "Secondary Phone Number (Optional)") (ne .Title "Email Address") (ne .Title "Preferred method of communication") (ne .Title "Marital Status") (ne .Title "Name of Spouse/Significant Other") (ne .Title "Emergency Contact Name") (ne .Title "Relationship") (ne .Title "Phone") (ne .Title "How did you hear about us?") (ne .Title "CONSENT TO CHIROPRACTIC EXAMINATION AND TREATMENT") (ne .Title "Consent to Treatment") (ne .Title "I consent to treatment") (ne .Title "HIPAA Acknowledgment") (ne .Title "Financial Policy Acknowledgment") (ne .Title "Cancellation Policy Acknowledgment")}}
      <div class="question">
        <div class="question-title">{{.Title}}</div>
        <div class="question-answer">
          {{if .SignatureData}}
            <img src="{{.SignatureData}}" class="signature-image" alt="Signature" />
          {{else}}
            {{if .Answer}}{{.Answer}}{{else}}&nbsp;{{end}}
          {{end}}
        </div>
      </div>
      {{end}}
    {{end}}
  </div>
  {{end}}
</div>

</body>
</html>
`
