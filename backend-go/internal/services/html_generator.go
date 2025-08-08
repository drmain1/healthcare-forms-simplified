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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body { 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #1a1a1a;
    line-height: 1.6;
    background: white;
  }
  
  .header { 
    {{if .ClinicInfo.PrimaryColor}}
    background: linear-gradient(135deg, {{.ClinicInfo.PrimaryColor}} 0%, {{.ClinicInfo.PrimaryColor}}dd 100%);
    {{else}}
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    {{end}}
    color: white;
    padding: 40px 40px 30px 40px;
    position: relative;
    overflow: hidden;
  }
  
  .header::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 40%;
    height: 200%;
    background: rgba(255, 255, 255, 0.03);
    transform: rotate(35deg);
  }
  
  .header-content {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 40px;
  }
  
  .clinic-branding {
    flex: 1;
  }
  
  .clinic-logo-name {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 16px;
  }
  
  {{if .ClinicInfo.LogoURL}}
  .clinic-logo {
    width: 60px;
    height: 60px;
    background: white;
    border-radius: 12px;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .clinic-logo img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  {{end}}
  
  .clinic-name {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 32px;
    font-weight: 400;
    letter-spacing: 0.5px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .clinic-tagline {
    font-size: 14px;
    font-weight: 300;
    opacity: 0.95;
    margin-left: {{if .ClinicInfo.LogoURL}}80px{{else}}0{{end}};
    margin-top: -8px;
    letter-spacing: 0.5px;
  }
  
  .clinic-contact {
    text-align: right;
    font-size: 13px;
    line-height: 1.8;
    opacity: 0.95;
    min-width: 280px;
  }
  
  .contact-group {
    margin-bottom: 12px;
  }
  
  .contact-address {
    font-weight: 500;
    line-height: 1.5;
  }
  
  .contact-divider {
    width: 30px;
    height: 2px;
    background: rgba(255, 255, 255, 0.3);
    margin: 8px 0 8px auto;
  }
  
  .contact-item {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    margin: 4px 0;
  }
  
  .contact-label {
    font-weight: 300;
    opacity: 0.8;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .professional-ids {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    font-size: 11px;
    opacity: 0.8;
  }
  
  .question { margin-bottom: 20px; }
  .question-title { font-weight: bold; }
</style>
</head>
<body>

{{if .ClinicInfo}}
<div class="header">
  <div class="header-content">
    <div class="clinic-branding">
      <div class="clinic-logo-name">
        {{if .ClinicInfo.LogoURL}}
        <div class="clinic-logo">
          <img src="{{.ClinicInfo.LogoURL}}" alt="{{.ClinicInfo.ClinicName}}">
        </div>
        {{end}}
        <div>
          <div class="clinic-name">{{.ClinicInfo.ClinicName}}</div>
        </div>
      </div>
      {{if .ClinicInfo.Website}}
      <div class="clinic-tagline">{{.ClinicInfo.Website}}</div>
      {{end}}
    </div>
    
    <div class="clinic-contact">
      <div class="contact-group">
        <div class="contact-address">
          {{.ClinicInfo.AddressLine1}}<br>
          {{if .ClinicInfo.AddressLine2}}{{.ClinicInfo.AddressLine2}}<br>{{end}}
          {{.ClinicInfo.City}}, {{.ClinicInfo.State}} {{.ClinicInfo.ZipCode}}
        </div>
      </div>
      
      <div class="contact-divider"></div>
      
      <div class="contact-group">
        <div class="contact-item">
          <span class="contact-label">Phone</span>
          <span>{{.ClinicInfo.Phone}}</span>
        </div>
        {{if .ClinicInfo.Fax}}
        <div class="contact-item">
          <span class="contact-label">Fax</span>
          <span>{{.ClinicInfo.Fax}}</span>
        </div>
        {{end}}
        <div class="contact-item">
          <span class="contact-label">Email</span>
          <span>{{.ClinicInfo.Email}}</span>
        </div>
      </div>
      
      {{if or .ClinicInfo.NPI .ClinicInfo.TaxID}}
      <div class="professional-ids">
        {{if .ClinicInfo.NPI}}
        <div class="contact-item">
          <span class="contact-label">NPI</span>
          <span>{{.ClinicInfo.NPI}}</span>
        </div>
        {{end}}
        {{if .ClinicInfo.TaxID}}
        <div class="contact-item">
          <span class="contact-label">Tax ID</span>
          <span>{{.ClinicInfo.TaxID}}</span>
        </div>
        {{end}}
      </div>
      {{end}}
    </div>
  </div>
</div>
{{end}}

{{range .Questions}}
<div class="question">
  <p class="question-title">{{.Title}}</p>
  <p>{{.Answer}}</p>
</div>
{{end}}

</body>
</html>
`
