package services

import (
	"bytes"
	"encoding/json"
	"html/template"

	"github.com/gemini/forms-api/internal/data"
)

// Form represents the entire structure of the JSON form.
type Form struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Pages       []Page `json:"pages"`
}

// Page corresponds to a page in the JSON form.
type Page struct {
	Name     string    `json:"name"`
	Title    string    `json:"title"`
	Elements []Element `json:"elements"`
}

// Element can be a panel or a direct question.
type Element struct {
	Type          string    `json:"type"`
	Name          string    `json:"name"`
	Title         string    `json:"title"`
	HTML          string    `json:"html"` // For raw HTML content
	Elements      []Element `json:"elements"`      // For panels
	LayoutColumns int       `json:"layoutColumns"` // For multi-column layouts
	ColSpan       int       `json:"colSpan"`       // For elements spanning multiple columns

	// RenderedHTML holds the pre-rendered HTML for custom elements
	RenderedHTML template.HTML `json:"-"`
}

// GenerateDynamicHTML generates a professional PDF from a JSON form structure.
func GenerateDynamicHTML(formJSON string, answers map[string]interface{}, clinicInfo *data.ClinicInfo) (string, error) {
	var form Form
	if err := json.Unmarshal([]byte(formJSON), &form); err != nil {
		return "", err
	}

	// Pre-process the form to render custom elements
	for i, page := range form.Pages {
		for j, element := range page.Elements {
			// Detect the special panel by its unique name
			if element.Name == "pain_assessment_panel" {
				html, err := RenderCustomTable(element, answers)
				if err != nil {
					return "", err
				}
				form.Pages[i].Elements[j].RenderedHTML = html
				// Clear sub-elements to prevent default rendering
				form.Pages[i].Elements[j].Elements = nil
			}
		}
	}

	funcMap := template.FuncMap{
		"getAnswer": func(name string) interface{} {
			if val, ok := answers[name]; ok {
				return val
			}
			return ""
		},
		"safeHTML": func(s string) template.HTML {
			return template.HTML(s)
		},
		"safeURL": func(s string) template.URL {
			return template.URL(s)
		},
	}

	tmpl, err := template.New("pdf").Funcs(funcMap).Parse(pdfTemplate)
	if err != nil {
		return "", err
	}

	templateData := struct {
		Form       Form
		ClinicInfo *data.ClinicInfo
	}{
		Form:       form,
		ClinicInfo: clinicInfo,
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, &templateData); err != nil {
		return "", err
	}

	return buf.String(), nil
}

// This is a placeholder for the old function signature to avoid breaking changes elsewhere instantly.
// It should be updated or removed once the new dynamic flow is fully integrated.
func GenerateHTMLFromTemplate(questions []VisibleQuestion, clinicInfo *data.ClinicInfo) (string, error) {
	// For now, this can return an empty string or an error, as it's being replaced.
	return "This function is deprecated. Use GenerateDynamicHTML.", nil
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
  
  .section-bar {
    height: 56px;
    background: #000000 !important;
    display: flex;
    align-items: center;
    padding: 0 24px;
    margin: 48px 0 0 0;
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
  
  .content-area {
    padding: 32px;
    margin-bottom: 36px;
    border: 1px solid #e0e0e0;
    border-top: none;
  }

  .grid-container-2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 16px; /* tighter spacing */
    align-items: end;
  }

  .grid-container-3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px 16px; /* tighter spacing */
    align-items: end;
  }

  .field-row {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-end;
    gap: 16px;
    margin-bottom: 8px;
  }

  .colspan-2 { grid-column: span 2 / auto; }
  .colspan-3 { grid-column: span 3 / auto; }
  
  .form-field {
    padding-top: 8px;
    padding-bottom: 8px;
    page-break-inside: avoid;
    border-bottom: 1px solid #eee;
  }

  .form-field:last-child {
    border-bottom: none;
  }

  .grid-container-2 .form-field, .grid-container-3 .form-field {
    padding: 0;
    border-bottom: none;
  }

  .form-field.inline {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    flex: 1;
    min-width: 0;
  }
  
  .field-label {
    font-size: 12px;
    font-weight: 600;
    color: #333;
    margin-right: 12px;
    flex: 0 0 200px; /* Give label a fixed width */
  }
  
  .field-value {
    font-size: 14px;
    font-weight: 400;
    color: #000;
    flex: 1;
    border-bottom: 1px solid #999;
    padding-bottom: 2px;
  }
  
  .field-value:empty:before {
    content: '\000a0';
  }

  .signature-field {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #ccc;
  }

  .signature-field img {
    max-width: 250px;
    max-height: 100px;
    display: block;
  }

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

{{range $pageIndex, $page := .Form.Pages}}
  <div class="section-bar {{if eq $pageIndex 0}}first{{end}}">
    <div class="section-title">{{$page.Title}}</div>
  </div>
  <div class="content-area">
    {{range .Elements}} <!-- Panels -->
      {{if .Title}}{{end}}
      
      {{if .RenderedHTML}}
        {{.RenderedHTML}}
      {{else if eq .Type "html"}}
        <div class="form-html" style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; overflow: visible; page-break-inside: auto; white-space: normal; word-wrap: break-word;">
          {{.HTML | safeHTML}}
        </div>
      {{else if gt .LayoutColumns 0}}
        <div class="grid-container-{{.LayoutColumns}}">
          {{range .Elements}} <!-- Questions in a grid -->
            {{if eq .Type "html"}}
              <div class="form-html {{if gt .ColSpan 1}}colspan-{{.ColSpan}}{{end}}" style="font-size: 14px; line-height: 1.6; overflow: visible; page-break-inside: auto; white-space: normal; word-wrap: break-word;">
                {{.HTML | safeHTML}}
              </div>
            {{else if eq .Type "signaturepad"}}
              <!-- Signatures should not be in a grid, so this block is intentionally left empty -->
            {{else}}
              {{if getAnswer .Name}}
              <div class="form-field {{if gt .ColSpan 1}}colspan-{{.ColSpan}}{{end}} inline">
                <div class="field-label">{{.Title}}</div>
                <span class="field-value">{{getAnswer .Name}}&nbsp;</span>
              </div>
              {{end}}
            {{end}}
          {{end}}
        </div>
        <!-- Render signatures outside of the grid -->
        {{range .Elements}}
          {{if eq .Type "signaturepad"}}
            <div class="form-field">
              <div class="field-label">{{.Title}}</div>
              <div class="signature-field">
                <img src="{{getAnswer .Name | safeURL}}" alt="Signature" />
              </div>
            </div>
          {{end}}
        {{end}}
      {{else}}
        {{range .Elements}} <!-- Questions or HTML in a single column -->
          {{if eq .Type "html"}}
            <div class="form-html" style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; overflow: visible; page-break-inside: auto; white-space: normal; word-wrap: break-word;">
              {{.HTML | safeHTML}}
            </div>
          {{else if eq .Type "signaturepad"}}
            <div class="form-field">
              <div class="field-label">{{.Title}}</div>
              <div class="signature-field">
                <img src="{{getAnswer .Name | safeURL}}" alt="Signature" />
              </div>
            </div>
          {{else}}
            {{if getAnswer .Name}}
            <div class="form-field inline">
              <div class="field-label">{{.Title}}</div>
              <span class="field-value">{{getAnswer .Name}}&nbsp;</span>
            </div>
            {{end}}
          {{end}}
        {{end}}
      {{end}}
    {{end}}
  </div>
{{end}}

</body>
</html>
`