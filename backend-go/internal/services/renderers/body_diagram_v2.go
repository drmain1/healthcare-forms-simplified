package services

import (
	"bytes"
	"fmt"
	"html"
	"sort"
	"strings"
)

// Embedded SVG body diagram (minified from frontend/public/assets/body-diagram-pain.svg)
const bodySVG = `<svg width="100%" height="auto" viewBox="0 0 310 360" xmlns="http://www.w3.org/2000/svg">
<g transform="translate(3.1692)" fill="#fff" stroke="#000" stroke-miterlimit="2.5">
<path d="m230.23 50.585h-10.174c0.0383 4.5859-1.3849 8.2321-6.5382 11.407-7.5804 4.6708-9.7655 1.5888-16.504 5.3637-7.1799 4.0224-9.8386 16.322-12.894 25.271-2.7012 7.9136-3.1169 16.701-4.6417 24.653-0.96103 5.0114-3.7277 6.4291-4.6417 12.172-1.7566 11.036-3.522 24.117-4.5952 34.051-0.27661 2.5604-2.5916 3.4207-3.8745 4.5368-1.2186 1.0601-2.2195 1.8891-3.9986 3.6422-0.54323 0.53532-0.6719 1.6779-1.1926 2.7517-0.44354 0.91465-1.5193 1.5385-1.8071 2.3511-0.81641 2.3051-3.163 3.6622-2.5489 4.5482 0.57059 0.82329 2.962-0.16453 4.1095-0.98104 0.73525-0.52319 1.3618-1.3514 1.4568-2.2818 0.91637-0.33136 2.1079-2.7713 2.6956-2.6583 0.2556 0.0492 0.35815 4.4609-0.57415 7.5085-0.36349 1.1882-0.67013 1.7463-0.67471 2.5278-6e-3 1.0064-0.16012 3.3385-0.28049 4.41-0.17688 1.5746 0.3089 3.0319 1.2564 3.1043 0.2217 0.0169 1.3403-0.28271 1.3483-2.0176 3e-3 -0.6329 0.0793-1.1267 0.19558-1.9402 0.20135-1.4089 1.4945-4.1371 1.7256-5.3596 0.073-0.38605 0.3515-1.3762 0.61896-1.344 0.0826 0.01-0.40406 2.9015-0.68479 4.1135-0.31129 1.3439 0.1444 2.2688-3e-3 5.0324-0.12892 2.425 0.035 3.8104 1.2662 3.8576 0.38804 0.0149 1.5578 0.0126 1.5878-3.5364 9e-3 -1.045 0.36561-2.9089 0.63286-4.717 0.19628-1.328 0.21257-2.719 1.0351-4.2976-0.0453 1.6713-0.14439 1.8897-0.22861 3.5175-0.0517 0.9997-0.40445 6.6088-0.10479 4.2507 0.12642-0.99481-1.2494 4.0514 0.93922 4.1496 0.73189 0.0328 1.7038-0.88901 2.1277-7.1342 0.12408-1.8281 0.43591-4.2876 0.91977-5.6605 0.2785 1.1986 0.34294 1.7202 0.34104 2.3095-1e-3 0.41753 0.18169 1.7707-9e-3 3.1186-0.2748 1.9387-0.42344 3.2399 0.59083 3.3532 0.56222 0.0628 1.2424-0.68608 1.6571-2.0254 0.14497-0.4682 0.10129-1.1388 0.25401-1.6788 0.51646-1.826 0.18898-3.7333 0.36462-4.9573 0.23905-1.6659 0.53634-2.4919 0.76803-3.2137 0.23777-0.7407 0.55776-2.9404 0.58628-5.338 0.0285-2.3976-0.96797-2.4648-0.5835-8.9176s8.1542-18.314 9.7382-27.921c0.47262-2.8665 1.9201-5.4484 2.6611-8.237 1.2761-4.8019 1.5258-9.8628 3.0634-14.587 1.1382-3.4976 4.5216-10.065 4.5216-10.065s3.1819 11.689 3.8182 15.85c1.9844 12.977-3.5664 24.173-6.0413 38.02-1.97 11.022-4.0324 18.866-3.9032 33.362 0.15311 17.179 3.7934 32.78 4.0845 42.012 0.0368 1.1667-1.2632 5.7722-1.0497 10.691 0.21358 4.9187-0.91238 11.933-0.84669 18.338 0.154 15.018 4.941 26.356 6.8561 33.113 0.93943 3.315 2.0135 8.4987 2.0723 11.147 0.0776 3.4882-1.0545 3.8634-1.2902 5.849-0.17169 1.4466 1.4034 3.9802 1.4322 4.5296 0 0-1.0438 1.2389-1.2138 2-0.23875 1.0687 0.40999 2.0442-0.0647 2.7635-0.95041 1.44-0.88729 0.80009-1.3764 1.5759-0.50549 0.8018-3.6547 4.0599-4.223 5.2385-0.44783 0.92873-0.32767 1.6046-0.15165 2.6407 0.24437 1.4385 0.80996 2.8068 2.3579 2.3976 0.47824 0.32134 1.0649 1.0267 1.4852 0.33322 0.11699 0.79456 1.6844 0.86262 2.4438 0.51393 1.0893 0.99188 3.1024 0.85398 4.167-8e-3 1.4228 1.2236 5.6128 0.64265 5.9599-1.6887 1.3576-0.59255 1.7169-1.7586 1.4963-3.0556-0.36938-2.1718-0.33452-4.0602-0.71226-6.2306-0.29426-1.6908-0.15632-4.057 0.78349-5.4986 1.4851-2.2781 0.7763-6.1973 0.32284-6.9851s-0.21976-15.214 0.0775-23.764c0.27597-7.9383 2.6943-15.697 3.0634-23.632 0.15711-3.378-0.51187-6.7599-0.36469-10.138 0.19832-4.5522 1.2546-9.0294 1.6776-13.566 0.38891-4.1719 0.2632-8.3884 0.7898-12.545 1.8806-14.845 6.8935-16.859 8.4407-44.09m2.4e-4 0c1.5472 27.231 6.5601 29.245 8.4407 44.09 0.5266 4.1568 0.40089 8.3733 0.7898 12.545 0.42293 4.5369 1.4792 9.0141 1.6776 13.566 0.14718 3.3784-0.5218 6.7603-0.36469 10.138 0.36904 7.9345 2.7874 15.693 3.0634 23.632 0.29726 8.5507 0.53096 22.976 0.0775 23.764s-1.1623 4.707 0.32284 6.9851c0.93981 1.4416 1.0778 3.8079 0.78349 5.4986-0.37774 2.1704-0.34288 4.0588-0.71226 6.2306-0.2206 1.2971 0.13864 2.4631 1.4963 3.0556 0.34705 2.3313 4.5371 2.9123 5.9599 1.6887 1.0646 0.86198 3.0777 0.99988 4.167 8e-3 0.75931 0.34869 2.3268 0.28063 2.4438-0.51393 0.42024 0.69345 1.0069-0.0119 1.4852-0.33322 1.5479 0.40914 2.1135-0.95913 2.3579-2.3976 0.17602-1.0361 0.29618-1.7119-0.15165-2.6407-0.5683-1.1786-3.7176-4.4367-4.223-5.2385-0.48911-0.77583-0.42599-0.13593-1.3764-1.5759-0.47469-0.71923 0.17405-1.6948-0.0647-2.7635-0.17003-0.76107-1.2138-2-1.2138-2 0.0288-0.54935 1.6039-3.083 1.4322-4.5296-0.23568-1.9856-1.3678-2.3609-1.2902-5.849 0.0589-2.6479 1.1329-7.8317 2.0723-11.147 1.915-6.7575 6.7021-18.096 6.8561-33.113 0.0657-6.4056-1.0603-13.419-0.84669-18.338 0.21357-4.9187-1.0865-9.5242-1.0497-10.691 0.29104-9.2314 3.9314-24.833 4.0845-42.012 0.12921-14.497-1.9332-22.34-3.9032-33.362-2.4749-13.847-8.0257-25.043-6.0413-38.02 0.63636-4.1613 3.8182-15.85 3.8182-15.85s3.3834 6.5673 4.5216 10.065c1.5376 4.7246 1.7873 9.7856 3.0634 14.587 0.74105 2.7886 2.1885 5.3705 2.6611 8.237 1.584 9.607 9.3537 21.468 9.7382 27.921s-0.612 6.5199-0.5835 8.9176 0.34851 4.5973 0.58628 5.338c0.23169 0.72176 0.52898 1.5478 0.76803 3.2137 0.17564 1.224-0.15184 3.1313 0.36462 4.9573 0.15272 0.53996 0.10904 1.2106 0.25401 1.6788 0.41469 1.3393 1.0949 2.0882 1.6571 2.0254 1.0143-0.11329 0.86563-1.4145 0.59083-3.3532-0.19069-1.3479-8e-3 -2.7011-9e-3 -3.1186-2e-3 -0.58935 0.0625-1.111 0.34104-2.3095 0.48386 1.3728 0.79569 3.8324 0.91977 5.6605 0.42386 6.2452 1.3958 7.167 2.1277 7.1342 2.1886-0.0982 0.8128-5.1444 0.93922-4.1496 0.29966 2.3581-0.0531-3.251-0.10479-4.2507-0.0842-1.6278-0.18331-1.8462-0.22861-3.5175 0.82252 1.5787 0.83881 2.9697 1.0351 4.2976 0.26725 1.8082 0.62386 3.672 0.63286 4.717 0.03 3.549 1.1997 3.5512 1.5878 3.5364 1.2312-0.0472 1.3951-1.4326 1.2662-3.8576-0.1474-2.7636 0.30829-3.6885-3e-3 -5.0324-0.28073-1.212-0.76739-4.1035-0.68479-4.1135 0.26746-0.0322 0.54596 0.95795 0.61896 1.344 0.23116 1.2225 1.5243 3.9506 1.7256 5.3596 0.11628 0.81353 0.19258 1.3073 0.19558 1.9402 8e-3 1.7349 1.1266 2.0345 1.3483 2.0176 0.94755-0.0724 1.4333-1.5297 1.2564-3.1043-0.12037-1.0715-0.27449-3.4036-0.28049-4.41-5e-3 -0.78149-0.31122-1.3395-0.67471-2.5278-0.9323-3.0476-0.82975-7.4593-0.57415-7.5085 0.58769-0.11305 1.7793 2.3269 2.6956 2.6583 0.0951 0.9304 0.72158 1.7586 1.4568 2.2818 1.1475 0.81651 3.5389 1.8043 4.1095 0.98104 0.61409-0.88607-1.7325-2.2431-2.5489-4.5482-0.28781-0.81262-1.3636-1.4364-1.8071-2.3511-0.52068-1.0738-0.64935-2.2164-1.1926-2.7517-1.7791-1.7532-2.78-2.5821-3.9986-3.6422-1.2829-1.1161-3.5979-1.9764-3.8745-4.5368-1.0732-9.9335-2.8386-23.014-4.5952-34.051-0.91397-5.7424-3.6807-7.1602-4.6417-12.172-1.5248-7.9512-1.9404-16.739-4.6417-24.653-3.055-8.9498-5.7136-21.249-12.894-25.271-6.7382-3.775-8.9234-0.69292-16.504-5.3637-5.1533-3.1753-6.5765-6.8215-6.5382-11.407h-10.174"/>
<path d="m230.23 55.7c-3.9137 0-7.3233-2.6443-10.174-5.1153-0.86087-0.7462-1.1973-4.0335-1.9143-4.8656-0.7474 0.2234-2.4158-0.19574-2.946-1.32-0.73606-1.5608-2.2567-4.2932-2.1936-7.2658 0.0288-1.3549 0.96098-3.1117 2.9085-3.1043-0.28331-9.9132 5.8165-16.699 14.317-16.7 8.501 1.77e-4 14.601 6.7855 14.319 16.699 1.9475-0.0077 2.8799 1.749 2.9088 3.104 0.0634 2.9726-1.4569 5.7052-2.1928 7.266-0.53009 1.1243-2.1985 1.5436-2.9459 1.3203-0.71691 0.83223-1.053 4.1196-1.9138 4.8658-2.8505 2.4713-6.2598 5.1159-10.173 5.1163-3.9137-4.08e-4 -7.323-2.645-10.173-5.1163-0.86079-0.74629-1.1969-4.0336-1.9138-4.8658-0.74742 0.22332-2.4158-0.19599-2.9459-1.3203-0.7359-1.5609-2.2562-4.2935-2.1928-7.266 0.0289-1.3549 0.9613-3.1117 2.9088-3.104-0.28228-9.9132 5.8182-16.699 14.319-16.699 8.501 0.0011 14.601 6.7871 14.317 16.7 1.9475-0.0075 2.8797 1.7493 2.9085 3.1043 0.0631 2.9726-1.4575 5.705-2.1936 7.2658-0.53021 1.1243-2.1986 1.5434-2.946 1.32-0.717 0.83215-1.0534 4.1194-1.9143 4.8656-2.8507 2.471-6.2603 5.1153-10.174 5.1153"/>
</g>
</svg>`

// PainPoint represents a pain point on the body diagram
type PainPoint struct {
	X         float64 `json:"x"`
	Y         float64 `json:"y"`
	Intensity int     `json:"intensity"`
	Area      string  `json:"area"`
	Side      string  `json:"side"`
}

// BodyDiagramV2Renderer renders body diagram with pain points
func BodyDiagramV2Renderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	var result bytes.Buffer
	
	result.WriteString(`<div class="form-section">`)
	result.WriteString(`<div class="section-title">Body Diagram - Pain Mapping</div>`)
	
	// Extract pain points from the diagram data
	painPoints := extractPainPoints(metadata.ElementNames, context.Answers)
	
	if len(painPoints) == 0 {
		result.WriteString(`<div style="text-align: center; padding: 30px; background-color: #f8f9fa; border: 1px dashed #dee2e6;">`)
		result.WriteString(`<p style="color: #6c757d; font-style: italic;">No pain areas were marked on the body diagram</p>`)
		result.WriteString(`</div>`)
	} else {
		// Render visual body diagram with pain markers
		result.WriteString(renderVisualBodyDiagram(painPoints))
		
		// Add pain points table as supplementary information
		result.WriteString(`<div style="margin-top: 30px;">`)
		result.WriteString(`<h4>Pain Location Details</h4>`)
		result.WriteString(renderPainPointsTable(painPoints))
		result.WriteString(`</div>`)
	}
	
	result.WriteString(`</div>`)
	
	return result.String(), nil
}

// BodyPainDiagramV2Renderer renders body pain diagram
func BodyPainDiagramV2Renderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	var result bytes.Buffer
	
	result.WriteString(`<div class="form-section">`)
	result.WriteString(`<div class="section-title">Body Pain Diagram</div>`)
	
	// Extract pain points from the diagram data
	painPoints := extractPainPoints(metadata.ElementNames, context.Answers)
	
	if len(painPoints) == 0 {
		result.WriteString(`<div style="text-align: center; padding: 30px; background-color: #f8f9fa; border: 1px dashed #dee2e6;">`)
		result.WriteString(`<p style="color: #6c757d; font-style: italic;">No pain areas were marked on the body pain diagram</p>`)
		result.WriteString(`</div>`)
	} else {
		// Render visual body diagram with pain markers
		result.WriteString(renderVisualBodyDiagram(painPoints))
		
		// Add pain points table as supplementary information
		result.WriteString(`<div style="margin-top: 30px;">`)
		result.WriteString(`<h4>Pain Location Details</h4>`)
		result.WriteString(renderPainPointsTable(painPoints))
		result.WriteString(`</div>`)
	}
	
	result.WriteString(`</div>`)
	
	return result.String(), nil
}

func extractPainPoints(elementNames []string, answers map[string]interface{}) []PainPoint {
	var allPoints []PainPoint
	
	for _, elementName := range elementNames {
		if data, exists := answers[elementName]; exists {
			points := processPainData(data)
			allPoints = append(allPoints, points...)
		}
	}
	
	return allPoints
}

func processPainData(data interface{}) []PainPoint {
	var points []PainPoint
	
	// Handle array of pain points
	if pointsArray, ok := data.([]interface{}); ok {
		for _, point := range pointsArray {
			if pointData, ok := point.(map[string]interface{}); ok {
				pp := PainPoint{
					X:         GetFloat64(pointData, "x"),
					Y:         GetFloat64(pointData, "y"),
					Area:      GetString(pointData, "area"),
					Side:      GetString(pointData, "side"),
				}
				
				// Handle intensity as either int or string
				if intVal := GetInt(pointData, "intensity"); intVal > 0 {
					pp.Intensity = intVal
				} else if strVal := GetString(pointData, "intensity"); strVal != "" {
					// Convert string intensity to numeric value
					switch strings.ToLower(strVal) {
					case "mild":
						pp.Intensity = 3
					case "moderate":
						pp.Intensity = 6
					case "severe":
						pp.Intensity = 9
					default:
						pp.Intensity = 5 // Default to moderate
					}
				}
				
				// Validate pain point data
				if pp.X > 0 || pp.Y > 0 || pp.Intensity > 0 {
					points = append(points, pp)
				}
			}
		}
	}
	
	return points
}

// renderVisualBodyDiagram creates an HTML representation with SVG and overlaid pain markers
func renderVisualBodyDiagram(painPoints []PainPoint) string {
	var result bytes.Buffer
	
	// Container for the diagram
	result.WriteString(`<div style="position: relative; display: inline-block; width: 100%; max-width: 500px; margin: 0 auto;">`)
	
	// Add the SVG body diagram
	result.WriteString(`<div style="width: 100%;">`)
	result.WriteString(bodySVG)
	result.WriteString(`</div>`)
	
	// Add pain markers as absolutely positioned elements
	for i, point := range painPoints {
		color := getIntensityColor(point.Intensity)
		
		// Create marker positioned absolutely over the SVG
		result.WriteString(fmt.Sprintf(
			`<div style="position: absolute; left: %.1f%%; top: %.1f%%; width: 24px; height: 24px; `+
			`border-radius: 50%%; background-color: %s; border: 2px solid #fff; `+
			`transform: translate(-50%%, -50%%); display: flex; align-items: center; `+
			`justify-content: center; color: #fff; font-weight: bold; font-size: 14px; `+
			`box-shadow: 0 2px 4px rgba(0,0,0,0.2);">%d</div>`,
			point.X, point.Y, color, i+1))
	}
	
	result.WriteString(`</div>`)
	
	// Add legend
	result.WriteString(`<div style="margin-top: 20px; display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">`)
	result.WriteString(`<span><span style="display: inline-block; width: 12px; height: 12px; background: #FFC107; border-radius: 50%; margin-right: 5px;"></span>Mild (1-3)</span>`)
	result.WriteString(`<span><span style="display: inline-block; width: 12px; height: 12px; background: #FF9800; border-radius: 50%; margin-right: 5px;"></span>Moderate (4-6)</span>`)
	result.WriteString(`<span><span style="display: inline-block; width: 12px; height: 12px; background: #F44336; border-radius: 50%; margin-right: 5px;"></span>Severe (7-10)</span>`)
	result.WriteString(`</div>`)
	
	// Add summary
	result.WriteString(`<div style="margin-top: 15px; text-align: center;">`)
	result.WriteString(fmt.Sprintf(`<strong>Total Pain Areas Marked:</strong> %d`, len(painPoints)))
	result.WriteString(`</div>`)
	
	return result.String()
}

func renderPainPointsTable(painPoints []PainPoint) string {
	var result bytes.Buffer
	
	// Sort pain points by intensity (highest first)
	sortedPoints := make([]PainPoint, len(painPoints))
	copy(sortedPoints, painPoints)
	sort.Slice(sortedPoints, func(i, j int) bool {
		return sortedPoints[i].Intensity > sortedPoints[j].Intensity
	})
	
	result.WriteString(`<table class="data-table">`)
	result.WriteString(`<thead>`)
	result.WriteString(`<tr>`)
	result.WriteString(`<th>Marker #</th>`)
	result.WriteString(`<th>Body Area</th>`)
	result.WriteString(`<th>Side</th>`)
	result.WriteString(`<th>Pain Intensity</th>`)
	result.WriteString(`<th>Position (X,Y)</th>`)
	result.WriteString(`</tr>`)
	result.WriteString(`</thead>`)
	result.WriteString(`<tbody>`)
	
	for i, point := range sortedPoints {
		result.WriteString(`<tr>`)
		
		// Marker number
		result.WriteString(fmt.Sprintf(`<td>%d</td>`, i+1))
		
		// Body area
		area := point.Area
		if area == "" {
			area = "-"
		}
		result.WriteString(`<td>` + html.EscapeString(area) + `</td>`)
		
		// Side
		side := point.Side
		if side == "" {
			side = "-"
		}
		result.WriteString(`<td>` + html.EscapeString(side) + `</td>`)
		
		// Intensity with color coding
		intensityColor := getIntensityColor(point.Intensity)
		intensityLabel := getIntensityLabel(point.Intensity)
		result.WriteString(`<td>`)
		result.WriteString(`<span style="background-color: ` + intensityColor + `; color: white; padding: 2px 6px; border-radius: 3px;">`)
		result.WriteString(fmt.Sprintf("%s (%d/10)", intensityLabel, point.Intensity))
		result.WriteString(`</span>`)
		result.WriteString(`</td>`)
		
		// Position
		result.WriteString(`<td>` + fmt.Sprintf("(%.1f, %.1f)", point.X, point.Y) + `</td>`)
		
		result.WriteString(`</tr>`)
	}
	
	result.WriteString(`</tbody>`)
	result.WriteString(`</table>`)
	
	return result.String()
}

// Helper functions

func getIntensityColor(intensity int) string {
	// Match frontend colors: mild (1-3) = yellow, moderate (4-6) = orange, severe (7-10) = red
	if intensity <= 3 {
		return "#FFC107" // Yellow for mild
	} else if intensity <= 6 {
		return "#FF9800" // Orange for moderate
	} else {
		return "#F44336" // Red for severe
	}
}

func getIntensityLabel(intensity int) string {
	if intensity <= 3 {
		return "Mild"
	} else if intensity <= 6 {
		return "Moderate"
	} else {
		return "Severe"
	}
}