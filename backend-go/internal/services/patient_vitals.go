package services

import (
	"bytes"
	"fmt"
	"html"
	"sort"
	"strconv"
	"strings"
	"time"
)

// VitalSign represents a vital sign measurement definition
type VitalSign struct {
	Name        string
	Unit        string
	NormalRange string
	Category    string
}

// VitalReading represents an actual vital sign reading
type VitalReading struct {
	VitalSign
	Value     string
	Status    string // "normal", "high", "low", "critical"
	Timestamp string
}

// PatientVitalsRenderer renders comprehensive patient vital signs
func PatientVitalsRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	var result bytes.Buffer
	
	result.WriteString(`<div class="form-section">`)
	result.WriteString(`<div class="section-title">Patient Vital Signs</div>`)
	
	// Define standard vital signs
	vitalDefinitions := getVitalSignDefinitions()
	
	// Extract and process vital signs data
	vitalReadings := extractVitalReadings(metadata.ElementNames, context.Answers, vitalDefinitions)
	
	if len(vitalReadings) == 0 {
		result.WriteString(`<div style="text-align: center; padding: 30px; background-color: #f8f9fa; border: 1px dashed #dee2e6;">`)
		result.WriteString(`<p style="color: #6c757d; font-style: italic;">No vital signs data found</p>`)
		result.WriteString(`<p style="font-size: 11px; color: #999;">Fields checked: ` + strings.Join(metadata.ElementNames, ", ") + `</p>`)
		result.WriteString(`</div>`)
	} else {
		// Render vital signs by category
		result.WriteString(renderVitalSignsByCategory(vitalReadings))
		
		// Add alerts for abnormal values
		result.WriteString(renderVitalAlertsSection(vitalReadings))
		
		// Add vital signs summary
		result.WriteString(renderVitalsSummary(vitalReadings))
	}
	
	result.WriteString(`</div>`)
	
	return result.String(), nil
}

func getVitalSignDefinitions() map[string]VitalSign {
	return map[string]VitalSign{
		// Blood Pressure
		"blood_pressure_systolic":  {Name: "Blood Pressure (Systolic)", Unit: "mmHg", NormalRange: "90-140", Category: "Cardiovascular"},
		"blood_pressure_diastolic": {Name: "Blood Pressure (Diastolic)", Unit: "mmHg", NormalRange: "60-90", Category: "Cardiovascular"},
		"systolic_bp":              {Name: "Blood Pressure (Systolic)", Unit: "mmHg", NormalRange: "90-140", Category: "Cardiovascular"},
		"diastolic_bp":             {Name: "Blood Pressure (Diastolic)", Unit: "mmHg", NormalRange: "60-90", Category: "Cardiovascular"},
		"bp_systolic":              {Name: "Blood Pressure (Systolic)", Unit: "mmHg", NormalRange: "90-140", Category: "Cardiovascular"},
		"bp_diastolic":             {Name: "Blood Pressure (Diastolic)", Unit: "mmHg", NormalRange: "60-90", Category: "Cardiovascular"},
		
		// Heart Rate
		"heart_rate":    {Name: "Heart Rate", Unit: "bpm", NormalRange: "60-100", Category: "Cardiovascular"},
		"pulse":         {Name: "Heart Rate", Unit: "bpm", NormalRange: "60-100", Category: "Cardiovascular"},
		"pulse_rate":    {Name: "Heart Rate", Unit: "bpm", NormalRange: "60-100", Category: "Cardiovascular"},
		"hr":            {Name: "Heart Rate", Unit: "bpm", NormalRange: "60-100", Category: "Cardiovascular"},
		
		// Respiratory
		"respiratory_rate":    {Name: "Respiratory Rate", Unit: "breaths/min", NormalRange: "12-20", Category: "Respiratory"},
		"respiration_rate":    {Name: "Respiratory Rate", Unit: "breaths/min", NormalRange: "12-20", Category: "Respiratory"},
		"breathing_rate":      {Name: "Respiratory Rate", Unit: "breaths/min", NormalRange: "12-20", Category: "Respiratory"},
		"rr":                  {Name: "Respiratory Rate", Unit: "breaths/min", NormalRange: "12-20", Category: "Respiratory"},
		"oxygen_saturation":   {Name: "Oxygen Saturation", Unit: "%", NormalRange: "95-100", Category: "Respiratory"},
		"o2_sat":              {Name: "Oxygen Saturation", Unit: "%", NormalRange: "95-100", Category: "Respiratory"},
		"spo2":                {Name: "Oxygen Saturation", Unit: "%", NormalRange: "95-100", Category: "Respiratory"},
		
		// Temperature
		"temperature":      {Name: "Temperature", Unit: "°F", NormalRange: "97.8-99.1", Category: "General"},
		"temp":             {Name: "Temperature", Unit: "°F", NormalRange: "97.8-99.1", Category: "General"},
		"body_temperature": {Name: "Temperature", Unit: "°F", NormalRange: "97.8-99.1", Category: "General"},
		
		// Physical Measurements
		"weight":      {Name: "Weight", Unit: "lbs", NormalRange: "Variable", Category: "Physical"},
		"body_weight": {Name: "Weight", Unit: "lbs", NormalRange: "Variable", Category: "Physical"},
		"height":      {Name: "Height", Unit: "in", NormalRange: "Variable", Category: "Physical"},
		"bmi":         {Name: "BMI", Unit: "", NormalRange: "18.5-24.9", Category: "Physical"},
		"body_mass_index": {Name: "BMI", Unit: "", NormalRange: "18.5-24.9", Category: "Physical"},
		
		// Pain Scale
		"pain_level":  {Name: "Pain Level", Unit: "/10", NormalRange: "0-3", Category: "Assessment"},
		"pain_score":  {Name: "Pain Level", Unit: "/10", NormalRange: "0-3", Category: "Assessment"},
		"pain_rating": {Name: "Pain Level", Unit: "/10", NormalRange: "0-3", Category: "Assessment"},
	}
}

func extractVitalReadings(elementNames []string, answers map[string]interface{}, definitions map[string]VitalSign) map[string]VitalReading {
	readings := make(map[string]VitalReading)
	now := time.Now()
	hour := now.Hour()
	ampm := "AM"
	displayHour := hour
	if hour >= 12 {
		ampm = "PM"
	}
	if hour > 12 {
		displayHour = hour - 12
	}
	if hour == 0 {
		displayHour = 12
	}
	timestamp := fmt.Sprintf("%d/%d/%d %d:%02d %s",
		int(now.Month()), now.Day(), now.Year(),
		displayHour, now.Minute(), ampm)
	
	// Process known vital signs
	for _, elementName := range elementNames {
		if value, exists := answers[elementName]; exists && value != nil {
			if definition, isDefined := definitions[elementName]; isDefined {
				reading := VitalReading{
					VitalSign: definition,
					Value:     formatVitalValue(value, definition),
					Status:    assessVitalStatus(definition, value),
					Timestamp: timestamp,
				}
				readings[elementName] = reading
			}
		}
	}
	
	// Also check for pattern-based vital signs
	for key, value := range answers {
		if value == nil {
			continue
		}
		
		lowerKey := strings.ToLower(key)
		
		// Check if this looks like a vital sign we haven't captured
		if _, alreadyProcessed := readings[key]; alreadyProcessed {
			continue
		}
		
		// Try to match patterns
		if definition := matchVitalPattern(lowerKey, definitions); definition != nil {
			reading := VitalReading{
				VitalSign: *definition,
				Value:     formatVitalValue(value, *definition),
				Status:    assessVitalStatus(*definition, value),
				Timestamp: timestamp,
			}
			readings[key] = reading
		}
	}
	
	return readings
}

func matchVitalPattern(key string, definitions map[string]VitalSign) *VitalSign {
	// Check for partial matches
	for defKey, definition := range definitions {
		if strings.Contains(key, strings.ToLower(defKey)) ||
		   strings.Contains(strings.ToLower(defKey), key) {
			return &definition
		}
	}
	
	// Check for common variations
	if strings.Contains(key, "bp") || strings.Contains(key, "pressure") {
		if strings.Contains(key, "sys") {
			return &VitalSign{Name: "Blood Pressure (Systolic)", Unit: "mmHg", NormalRange: "90-140", Category: "Cardiovascular"}
		} else if strings.Contains(key, "dia") {
			return &VitalSign{Name: "Blood Pressure (Diastolic)", Unit: "mmHg", NormalRange: "60-90", Category: "Cardiovascular"}
		}
	}
	
	if strings.Contains(key, "vital") {
		return &VitalSign{Name: formatFieldLabel(key, ""), Unit: "", NormalRange: "Variable", Category: "General"}
	}
	
	return nil
}

func renderVitalSignsByCategory(readings map[string]VitalReading) string {
	var result bytes.Buffer
	
	// Group readings by category
	categories := make(map[string][]VitalReading)
	for _, reading := range readings {
		category := reading.Category
		if category == "" {
			category = "General"
		}
		categories[category] = append(categories[category], reading)
	}
	
	// Sort categories
	var categoryNames []string
	for category := range categories {
		categoryNames = append(categoryNames, category)
	}
	sort.Strings(categoryNames)
	
	// Render each category
	for _, category := range categoryNames {
		readings := categories[category]
		
		result.WriteString(`<div style="margin-bottom: 25px;">`)
		result.WriteString(`<h4 style="color: #2c5282; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">` + html.EscapeString(category) + ` Vitals</h4>`)
		
		result.WriteString(`<table class="data-table">`)
		result.WriteString(`<thead>`)
		result.WriteString(`<tr>`)
		result.WriteString(`<th>Vital Sign</th>`)
		result.WriteString(`<th>Value</th>`)
		result.WriteString(`<th>Normal Range</th>`)
		result.WriteString(`<th>Status</th>`)
		result.WriteString(`</tr>`)
		result.WriteString(`</thead>`)
		result.WriteString(`<tbody>`)
		
		// Sort readings by name within category
		sort.Slice(readings, func(i, j int) bool {
			return readings[i].Name < readings[j].Name
		})
		
		for _, reading := range readings {
			statusColor := getVitalStatusColor(reading.Status)
			statusIcon := getVitalStatusIcon(reading.Status)
			
			result.WriteString(`<tr>`)
			result.WriteString(`<td><strong>` + html.EscapeString(reading.Name) + `</strong></td>`)
			result.WriteString(`<td>` + html.EscapeString(reading.Value) + ` ` + html.EscapeString(reading.Unit) + `</td>`)
			result.WriteString(`<td>` + html.EscapeString(reading.NormalRange) + ` ` + html.EscapeString(reading.Unit) + `</td>`)
			result.WriteString(`<td style="color: ` + statusColor + `;">` + statusIcon + ` ` + html.EscapeString(strings.Title(reading.Status)) + `</td>`)
			result.WriteString(`</tr>`)
		}
		
		result.WriteString(`</tbody>`)
		result.WriteString(`</table>`)
		result.WriteString(`</div>`)
	}
	
	return result.String()
}

func renderVitalAlertsSection(readings map[string]VitalReading) string {
	var alerts []VitalReading
	
	// Collect abnormal readings
	for _, reading := range readings {
		if reading.Status != "normal" && reading.Status != "" {
			alerts = append(alerts, reading)
		}
	}
	
	if len(alerts) == 0 {
		return ""
	}
	
	var result bytes.Buffer
	
	// Sort alerts by severity (critical first)
	sort.Slice(alerts, func(i, j int) bool {
		severityOrder := map[string]int{
			"critical": 0,
			"high":     1,
			"low":      2,
		}
		return severityOrder[alerts[i].Status] < severityOrder[alerts[j].Status]
	})
	
	result.WriteString(`<div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">`)
	result.WriteString(`<h4>⚠️ Vital Signs Alerts</h4>`)
	
	for _, alert := range alerts {
		alertColor := getVitalStatusColor(alert.Status)
		alertIcon := getVitalStatusIcon(alert.Status)
		
		result.WriteString(`<div style="margin: 8px 0; padding: 8px; background-color: rgba(255,255,255,0.7); border-radius: 4px;">`)
		result.WriteString(`<span style="color: ` + alertColor + `;"><strong>` + alertIcon + ` ` + html.EscapeString(alert.Name) + `:</strong></span> `)
		result.WriteString(html.EscapeString(alert.Value) + ` ` + html.EscapeString(alert.Unit))
		result.WriteString(` (Normal: ` + html.EscapeString(alert.NormalRange) + ` ` + html.EscapeString(alert.Unit) + `)`)
		result.WriteString(`</div>`)
	}
	
	result.WriteString(`</div>`)
	
	return result.String()
}

func renderVitalsSummary(readings map[string]VitalReading) string {
	var result bytes.Buffer
	
	totalReadings := len(readings)
	normalCount := 0
	abnormalCount := 0
	
	for _, reading := range readings {
		if reading.Status == "normal" || reading.Status == "" {
			normalCount++
		} else {
			abnormalCount++
		}
	}
	
	result.WriteString(`<div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #6c757d;">`)
	result.WriteString(`<h4>Vital Signs Summary</h4>`)
	result.WriteString(`<p><strong>Total Measurements:</strong> ` + fmt.Sprintf("%d", totalReadings) + `</p>`)
	result.WriteString(`<p><strong>Normal Values:</strong> ` + fmt.Sprintf("%d", normalCount) + `</p>`)
	
	if abnormalCount > 0 {
		result.WriteString(`<p><strong>Abnormal Values:</strong> ` + fmt.Sprintf("%d", abnormalCount) + `</p>`)
	}
	
	result.WriteString(`<p><strong>Assessment Time:</strong> ` + getCurrentTimestamp() + `</p>`)
	result.WriteString(`</div>`)
	
	return result.String()
}

// Helper functions

func formatVitalValue(value interface{}, definition VitalSign) string {
	if value == nil {
		return ""
	}
	
	valueStr := fmt.Sprintf("%v", value)
	
	// Handle special formatting for different vital types
	switch strings.ToLower(definition.Name) {
	case "temperature":
		if val, err := strconv.ParseFloat(valueStr, 64); err == nil {
			return fmt.Sprintf("%.1f", val)
		}
	case "bmi", "body mass index":
		if val, err := strconv.ParseFloat(valueStr, 64); err == nil {
			return fmt.Sprintf("%.1f", val)
		}
	}
	
	return valueStr
}

func assessVitalStatus(definition VitalSign, value interface{}) string {
	if value == nil {
		return ""
	}
	
	// Parse numeric value
	valueStr := fmt.Sprintf("%v", value)
	val, err := strconv.ParseFloat(valueStr, 64)
	if err != nil {
		return ""
	}
	
	// Assess based on vital sign type
	switch strings.ToLower(definition.Name) {
	case "blood pressure (systolic)":
		return assessBloodPressureStatus(val, true)
	case "blood pressure (diastolic)":
		return assessBloodPressureStatus(val, false)
	case "heart rate":
		return assessHeartRateStatus(val)
	case "respiratory rate":
		return assessRespiratoryRateStatus(val)
	case "temperature":
		return assessTemperatureStatus(val)
	case "oxygen saturation":
		return assessOxygenSaturationStatus(val)
	case "bmi":
		return assessBMIStatus(val)
	case "pain level":
		return assessPainLevelStatus(val)
	}
	
	return "normal"
}

func assessBloodPressureStatus(value float64, isSystolic bool) string {
	if isSystolic {
		switch {
		case value < 90:
			return "low"
		case value >= 90 && value <= 140:
			return "normal"
		case value > 140 && value <= 180:
			return "high"
		case value > 180:
			return "critical"
		}
	} else {
		switch {
		case value < 60:
			return "low"
		case value >= 60 && value <= 90:
			return "normal"
		case value > 90 && value <= 110:
			return "high"
		case value > 110:
			return "critical"
		}
	}
	return "normal"
}

func assessHeartRateStatus(value float64) string {
	switch {
	case value < 50:
		return "critical"
	case value >= 50 && value < 60:
		return "low"
	case value >= 60 && value <= 100:
		return "normal"
	case value > 100 && value <= 120:
		return "high"
	case value > 120:
		return "critical"
	}
	return "normal"
}

func assessRespiratoryRateStatus(value float64) string {
	switch {
	case value < 10:
		return "critical"
	case value >= 10 && value < 12:
		return "low"
	case value >= 12 && value <= 20:
		return "normal"
	case value > 20 && value <= 25:
		return "high"
	case value > 25:
		return "critical"
	}
	return "normal"
}

func assessTemperatureStatus(value float64) string {
	switch {
	case value < 96.0:
		return "critical"
	case value >= 96.0 && value < 97.8:
		return "low"
	case value >= 97.8 && value <= 99.1:
		return "normal"
	case value > 99.1 && value <= 102.0:
		return "high"
	case value > 102.0:
		return "critical"
	}
	return "normal"
}

func assessOxygenSaturationStatus(value float64) string {
	switch {
	case value < 90:
		return "critical"
	case value >= 90 && value < 95:
		return "low"
	case value >= 95:
		return "normal"
	}
	return "normal"
}

func assessBMIStatus(value float64) string {
	switch {
	case value < 18.5:
		return "low"
	case value >= 18.5 && value <= 24.9:
		return "normal"
	case value > 24.9 && value <= 29.9:
		return "high"
	case value >= 30:
		return "critical"
	}
	return "normal"
}

func assessPainLevelStatus(value float64) string {
	switch {
	case value >= 0 && value <= 3:
		return "normal"
	case value > 3 && value <= 6:
		return "high"
	case value > 6:
		return "critical"
	}
	return "normal"
}

func getVitalStatusColor(status string) string {
	switch status {
	case "normal":
		return "#4CAF50"
	case "low":
		return "#FF9800"
	case "high":
		return "#FF5722"
	case "critical":
		return "#F44336"
	default:
		return "#757575"
	}
}

func getVitalStatusIcon(status string) string {
	switch status {
	case "normal":
		return "✅"
	case "low":
		return "⬇️"
	case "high":
		return "⬆️"
	case "critical":
		return "🚨"
	default:
		return "ℹ️"
	}
}