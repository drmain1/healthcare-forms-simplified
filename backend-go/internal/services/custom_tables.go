package services

import (
	"bytes"
	"fmt"
	"html/template"
	"log"
	"strings"
)

// PainAreaData holds the structured data for a single row in the pain assessment table.
// This structure is what the HTML template will receive.
type PainAreaData struct {
	Area            string
	Side            string // For extremities: "LT", "RT", or "LT RT"
	Severity        interface{}
	Frequency       interface{}
	FrequencyText   string // Human-readable frequency description
	FrequencyValue  float64 // Numeric frequency value for positioning
}

// RenderCustomTable acts as a router for different custom table types.
// It looks at the element's name and calls the appropriate rendering function.
func RenderCustomTable(element Element, answers map[string]interface{}) (template.HTML, error) {
	// The `name` of the element (e.g., "pain_assessment_panel") determines which transformer to use.
	switch element.Name {
	case "pain_assessment_panel":
		return renderPainAssessmentTable(element, answers)
	default:
		log.Printf("Warning: Unknown custom table type encountered: %s", element.Name)
		return "", fmt.Errorf("unknown custom table type: %s", element.Name)
	}
}

// RenderBodyDiagram renders a body diagram with pain points marked
func RenderBodyDiagram(painPoints interface{}) template.HTML {
	// Log the incoming data for debugging
	log.Printf("RenderBodyDiagram received data type: %T, value: %+v", painPoints, painPoints)
	
	// Default empty diagram
	if painPoints == nil {
		return template.HTML(`<div style="text-align: center; padding: 20px; border: 1px solid #ddd; background: #f9f9f9;">
			<p style="color: #666;">No pain areas marked</p>
		</div>`)
	}

	// Parse pain points array
	points, ok := painPoints.([]interface{})
	if !ok || len(points) == 0 {
		return template.HTML(`<div style="text-align: center; padding: 20px; border: 1px solid #ddd; background: #f9f9f9;">
			<p style="color: #666;">No pain areas marked</p>
		</div>`)
	}

	// For now, just display the raw data as a simple table
	var html strings.Builder
	html.WriteString(`<div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; background: #f9f9f9;">`)
	html.WriteString(`<h4 style="margin-bottom: 10px;">Pain Points Data (`)
	html.WriteString(fmt.Sprintf("%d points marked)", len(points)))
	html.WriteString(`</h4>`)
	html.WriteString(`<table style="width: 100%; border-collapse: collapse;">`)
	html.WriteString(`<thead><tr style="background: #e0e0e0;">`)
	html.WriteString(`<th style="padding: 8px; border: 1px solid #ccc;">#</th>`)
	html.WriteString(`<th style="padding: 8px; border: 1px solid #ccc;">X</th>`)
	html.WriteString(`<th style="padding: 8px; border: 1px solid #ccc;">Y</th>`)
	html.WriteString(`<th style="padding: 8px; border: 1px solid #ccc;">Intensity</th>`)
	html.WriteString(`<th style="padding: 8px; border: 1px solid #ccc;">Label</th>`)
	html.WriteString(`<th style="padding: 8px; border: 1px solid #ccc;">View</th>`)
	html.WriteString(`</tr></thead><tbody>`)
	
	for i, point := range points {
		if pointMap, ok := point.(map[string]interface{}); ok {
			log.Printf("Processing point %d: %+v", i, pointMap)
			
			x, _ := pointMap["x"].(float64)
			y, _ := pointMap["y"].(float64)
			
			// Handle intensity as either string or number
			var intensityText string
			if intensityNum, ok := pointMap["intensity"].(float64); ok {
				intensityText = getIntensityText(intensityNum)
			} else if intensityStr, ok := pointMap["intensity"].(string); ok {
				intensityText = intensityStr
			} else {
				intensityText = fmt.Sprintf("%v", pointMap["intensity"])
			}
			
			// Get other fields with defaults
			label, _ := pointMap["label"].(string)
			if label == "" {
				label = fmt.Sprintf("Point %d", i+1)
			}
			
			view, _ := pointMap["view"].(string)
			if view == "" {
				view = "unknown"
			}
			
			id, _ := pointMap["id"].(string)
			
			html.WriteString(`<tr>`)
			html.WriteString(fmt.Sprintf(`<td style="padding: 8px; border: 1px solid #ccc;">%d</td>`, i+1))
			html.WriteString(fmt.Sprintf(`<td style="padding: 8px; border: 1px solid #ccc;">%.1f</td>`, x))
			html.WriteString(fmt.Sprintf(`<td style="padding: 8px; border: 1px solid #ccc;">%.1f</td>`, y))
			html.WriteString(fmt.Sprintf(`<td style="padding: 8px; border: 1px solid #ccc;">%s</td>`, intensityText))
			html.WriteString(fmt.Sprintf(`<td style="padding: 8px; border: 1px solid #ccc;">%s</td>`, label))
			html.WriteString(fmt.Sprintf(`<td style="padding: 8px; border: 1px solid #ccc;">%s</td>`, id))
			html.WriteString(`</tr>`)
		}
	}
	
	html.WriteString(`</tbody></table>`)
	html.WriteString(`</div>`)
	
	return template.HTML(html.String())
}

// getIntensityColor returns the color for a given pain intensity
func getIntensityColor(intensity float64) string {
	switch int(intensity) {
	case 1:
		return "#FFE082" // Mild - yellow
	case 2:
		return "#FF9800" // Moderate - orange
	case 3:
		return "#F44336" // Severe - red
	case 4:
		return "#B71C1C" // Very severe - dark red
	case 5:
		return "#880000" // Extreme - very dark red
	default:
		return "#F44336" // Default to red
	}
}

// getIntensityText returns the text description for a given pain intensity
func getIntensityText(intensity float64) string {
	switch int(intensity) {
	case 1:
		return "Mild"
	case 2:
		return "Moderate"
	case 3:
		return "Severe"
	case 4:
		return "Very Severe"
	case 5:
		return "Extreme"
	default:
		return "Unknown"
	}
}

// PainAssessmentTableTemplate is the embedded HTML template for the pain assessment table
const PainAssessmentTableTemplate = `<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .pain-table-container {
    padding: 15px;
    margin-bottom: 20px;
  }

  .section-header {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 10px;
  }
  
  .section-description {
    font-size: 11px;
    margin-bottom: 15px;
    line-height: 1.4;
  }

  .pain-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }

  .pain-table th,
  .pain-table td {
    border: 1px solid #000;
    padding: 4px 6px;
    text-align: center;
    vertical-align: middle;
  }

  .pain-table thead th {
    background-color: #ffffff;
    font-weight: 600;
    border-bottom: 2px solid #000;
  }
  
  .pain-table th.area-col {
    text-align: left;
    width: 12%;
  }
  
  .pain-table td.area-col {
    text-align: left;
    font-weight: 500;
  }
  
  .pain-table td.side-col {
    font-size: 10px;
    padding: 2px 4px;
    width: 8%;
  }

  .intensity-header {
    border-bottom: 1px solid #000;
  }
  
  .intensity-subheader th {
    font-weight: normal;
    font-style: italic;
    padding: 2px 4px;
    font-size: 10px;
  }

  .intensity-cell {
    width: 3%;
    padding: 3px;
    font-size: 10px;
    position: relative;
  }
  
  .intensity-cell.selected {
    font-weight: bold;
  }
  
  .intensity-cell.selected::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 18px;
    height: 18px;
    border: 2px solid #000;
    border-radius: 50%;
    z-index: -1;
  }

  .frequency-header {
    width: 35%;
  }
  
  .frequency-subheader th {
    font-weight: normal;
    font-size: 9px;
    padding: 2px 3px;
    border-left: 1px solid #000;
  }
  
  .frequency-cell {
    font-size: 9px;
    text-align: left;
    padding: 2px 4px;
    letter-spacing: -0.5px;
  }
  
  .freq-scale {
    display: inline-block;
    width: 100%;
    white-space: nowrap;
  }
</style>

<div class="pain-table-container">
  <div class="section-header">Section 1 - Pain Intensity</div>
  <p class="section-description">Please circle the appropriate # that describes your present pain levels, with 0 being no pain and 10 being the worst pain you can imagine and indicate how frequent the pain is.</p>
  
  <table class="pain-table">
    <thead>
      <tr>
        <th rowspan="3" class="area-col">Area of pain</th>
        <th rowspan="3" style="width: 8%;"></th>
        <th colspan="11" rowspan="2" class="intensity-header">Pain Intensity (0-10 Scale)</th>
        <th colspan="5" class="frequency-header">How frequent is your pain?</th>
      </tr>
      <tr class="frequency-subheader">
        <th>None</th>
        <th>Occasional</th>
        <th>Intermittent</th>
        <th>Frequent</th>
        <th>Constant</th>
      </tr>
      <tr class="intensity-subheader">
        <th colspan="1" style="border-left: none;">Normal</th>
        <th colspan="2">Mild</th>
        <th colspan="3">Moderate</th>
        <th colspan="4">Severe</th>
        <th>Worst</th>
        <th colspan="5" style="font-size: 9px; font-weight: normal;">0------25%--------50%-------75%------100%</th>
      </tr>
    </thead>
    <tbody>
      {{range .}}
      <tr>
        <td class="area-col">{{.Area}}</td>
        <td class="side-col">{{.Side}}</td>
        <!-- Intensity Cells (0-10) with value display -->
        <td class="intensity-cell{{if eq .Severity 0.0}} selected{{end}}">0</td>
        <td class="intensity-cell{{if eq .Severity 1.0}} selected{{end}}">1</td>
        <td class="intensity-cell{{if eq .Severity 2.0}} selected{{end}}">2</td>
        <td class="intensity-cell{{if eq .Severity 3.0}} selected{{end}}">3</td>
        <td class="intensity-cell{{if eq .Severity 4.0}} selected{{end}}">4</td>
        <td class="intensity-cell{{if eq .Severity 5.0}} selected{{end}}">5</td>
        <td class="intensity-cell{{if eq .Severity 6.0}} selected{{end}}">6</td>
        <td class="intensity-cell{{if eq .Severity 7.0}} selected{{end}}">7</td>
        <td class="intensity-cell{{if eq .Severity 8.0}} selected{{end}}">8</td>
        <td class="intensity-cell{{if eq .Severity 9.0}} selected{{end}}">9</td>
        <td class="intensity-cell{{if eq .Severity 10.0}} selected{{end}}">10</td>
        <!-- Frequency Cell with visual scale -->
        <td class="frequency-cell" colspan="5">
          {{if .Frequency}}
            {{if le .FrequencyValue 12.5}}
              <span class="freq-scale">0<b>---●--</b>25%--------50%-------75%------100%</span>
            {{else if le .FrequencyValue 37.5}}
              <span class="freq-scale">0------25%<b>---●----</b>50%-------75%------100%</span>
            {{else if le .FrequencyValue 62.5}}
              <span class="freq-scale">0------25%--------50%<b>---●---</b>75%------100%</span>
            {{else if le .FrequencyValue 87.5}}
              <span class="freq-scale">0------25%--------50%-------75%<b>---●--</b>100%</span>
            {{else}}
              <span class="freq-scale">0------25%--------50%-------75%-----<b>●</b>100%</span>
            {{end}}
          {{else}}
            <span class="freq-scale">0------25%--------50%-------75%------100%</span>
          {{end}}
        </td>
      </tr>
      {{end}}
    </tbody>
  </table>
</div>`

// renderPainAssessmentTable handles the specific logic for the pain assessment table.
func renderPainAssessmentTable(element Element, answers map[string]interface{}) (template.HTML, error) {
	// 1. Transform the raw answers into a structured format.
	painData, err := transformPainData(element.Elements, answers)
	if err != nil {
		return "", err
	}

	// 2. Parse the embedded template.
	tmpl, err := template.New("pain_assessment").Parse(PainAssessmentTableTemplate)
	if err != nil {
		return "", fmt.Errorf("failed to parse pain assessment template: %w", err)
	}

	// 3. Execute the template with the structured data.
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, painData); err != nil {
		return "", fmt.Errorf("failed to execute pain assessment template: %w", err)
	}

	return template.HTML(buf.String()), nil
}

// transformPainData converts the flat map of answers into a structured slice of PainAreaData.
func transformPainData(elements []Element, answers map[string]interface{}) ([]PainAreaData, error) {
	var allPainData []PainAreaData

	// Iterate through the panels for each body area (e.g., neck_panel, shoulder_panel).
	for _, areaPanel := range elements {
		if areaPanel.Type != "panel" || len(areaPanel.Elements) == 0 {
			continue
		}

		// Skip the other_area_panel if no area was specified
		if areaPanel.Name == "other_area_panel" {
			if otherArea, ok := answers["other_area_specify"].(string); ok && otherArea != "" {
				// Check if "Yes" was selected for other area pain (we check intensity directly)
				if intensity, ok := answers["other_intensity"]; ok {
					data := PainAreaData{Area: otherArea}
					
					// Check for side selection for other area
					if sides, ok := answers["other_side"]; ok {
						data.Side = formatSides(sides)
					}
					
					data.Severity = intensity
					if freq, ok := answers["other_frequency"]; ok {
						data.Frequency = freq
						data.FrequencyText = convertFrequencyToText(freq)
						data.FrequencyValue = getFrequencyNumericValue(freq)
					}
					// Check if pain is present (intensity > 0)
					if fVal, isFloat := intensity.(float64); isFloat && fVal > 0 {
						allPainData = append(allPainData, data)
					} else if iVal, isInt := intensity.(int); isInt && iVal > 0 {
						allPainData = append(allPainData, data)
					}
				}
			}
			continue
		}

		// Extract the base name of the panel (e.g., "neck" from "neck_panel")
		baseName := strings.TrimSuffix(areaPanel.Name, "_panel")
		
		// Build the field names based on the naming pattern
		hasPainField := "has_" + baseName + "_pain"
		intensityField := baseName + "_intensity"
		frequencyField := baseName + "_frequency"
		
		// Special cases for naming inconsistencies
		if baseName == "headaches" {
			hasPainField = "has_headaches"
			intensityField = "headaches_intensity"
			frequencyField = "headaches_frequency"
		} else if baseName == "neck" {
			// Neck has different naming pattern with "_pain" in the middle
			intensityField = "neck_pain_intensity"
			frequencyField = "neck_pain_frequency"
		}

		// Check if "Yes" was selected for this pain area
		if hasPainAnswer, ok := answers[hasPainField]; ok {
			if hasPainAnswer == "Yes" {
				// Get the area name from the first element (radiogroup) title
				areaName := ""
				for _, elem := range areaPanel.Elements {
					if elem.Type == "radiogroup" && elem.Name == hasPainField {
						areaName = elem.Title
						break
					}
				}
				
				if areaName == "" {
					continue
				}
				
				data := PainAreaData{Area: areaName}
				
				// Check for side selection (for extremities)
				sideField := baseName + "_side"
				if sides, ok := answers[sideField]; ok {
					data.Side = formatSides(sides)
				}
				
				// Get intensity value
				if intensity, ok := answers[intensityField]; ok {
					data.Severity = intensity
				}
				
				// Get frequency value and convert to human-readable text
				if frequency, ok := answers[frequencyField]; ok {
					data.Frequency = frequency
					data.FrequencyText = convertFrequencyToText(frequency)
					data.FrequencyValue = getFrequencyNumericValue(frequency)
				}
				
				allPainData = append(allPainData, data)
			}
		}
	}

	return allPainData, nil
}

// formatSides formats the side selection for display
func formatSides(sides interface{}) string {
	switch v := sides.(type) {
	case []interface{}:
		// Handle array of selections
		var sideList []string
		for _, s := range v {
			if str, ok := s.(string); ok {
				if str == "Left" {
					sideList = append(sideList, "LT")
				} else if str == "Right" {
					sideList = append(sideList, "RT")
				}
			}
		}
		if len(sideList) == 2 {
			return "LT RT"
		} else if len(sideList) == 1 {
			return sideList[0]
		}
	case string:
		// Handle single selection
		if v == "Left" {
			return "LT"
		} else if v == "Right" {
			return "RT"
		}
	}
	return ""
}

// getFrequencyNumericValue returns the numeric percentage value
func getFrequencyNumericValue(frequency interface{}) float64 {
	switch v := frequency.(type) {
	case float64:
		// Handle old 0-3 scale - convert to percentage
		if v <= 3 {
			return v * 33.33 // Map 0-3 to 0-100%
		}
		// Already a percentage
		return v
	case int:
		return getFrequencyNumericValue(float64(v))
	default:
		return 0
	}
}

// convertFrequencyToText converts frequency values to human-readable descriptions
func convertFrequencyToText(frequency interface{}) string {
	switch v := frequency.(type) {
	case float64:
		// Handle old 0-3 scale
		if v <= 3 {
			switch int(v) {
			case 0:
				return "Occasional (0-25%)"
			case 1:
				return "Intermittent (25-50%)"
			case 2:
				return "Frequent (50-75%)"
			case 3:
				return "Constant (75-100%)"
			default:
				return fmt.Sprintf("%.0f", v)
			}
		}
		// Handle percentage values (0-100)
		if v <= 100 {
			if v < 10 {
				return "Rarely"
			} else if v <= 25 {
				return "Occasional"
			} else if v <= 50 {
				return "Intermittent"
			} else if v <= 75 {
				return "Frequent"
			} else {
				return "Constant"
			}
		}
		return fmt.Sprintf("%.0f%%", v)
	case int:
		// Handle integer values
		return convertFrequencyToText(float64(v))
	case string:
		// If it's already a string description, return as-is
		return v
	default:
		return "-"
	}
}