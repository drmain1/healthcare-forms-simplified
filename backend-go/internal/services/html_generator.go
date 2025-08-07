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
  body { font-family: sans-serif; }
  .header { background-color: #f2f2f2; padding: 20px; text-align: center; }
  .question { margin-bottom: 20px; }
  .question-title { font-weight: bold; }
</style>
</head>
<body>

{{if .ClinicInfo}}
<div class="header">
  <h1>{{.ClinicInfo.ClinicName}}</h1>
  <p>{{.ClinicInfo.AddressLine1}}, {{.ClinicInfo.City}}, {{.ClinicInfo.State}} {{.ClinicInfo.ZipCode}}</p>
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
