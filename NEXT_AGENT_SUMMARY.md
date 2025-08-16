# Summary for Next AI Agent - Body Diagram Coordinate Alignment

## Current Status
The PDF generation system is fully operational with all 11 form types rendering correctly. The body diagram functions have been successfully differentiated into two distinct types:
1. **Pain Areas** - Shows pain intensity with numeric values
2. **Sensation Areas** - Shows sensation types (numbness, aching, burning, pins & needles, stabbing)

## Remaining Issue: Coordinate Misalignment
The body diagram markers are rendering but with slight coordinate misalignment between the form input and PDF output.

### Technical Context
- **Frontend**: Uses `BodyDiagram2.tsx` with an SVG that has `transform: scale(1.22)`
- **Backend**: `body_diagram_v2.go` attempts to compensate for this scaling
- **Current Formula**: 
  ```go
  scale := 1.22
  emptySpace := (100.0 - (100.0 / scale)) / 2.0
  adjustedX := emptySpace + (point.X / scale)
  adjustedY := emptySpace + (point.Y / scale)
  ```

### The Problem
The coordinate transformation isn't perfectly mapping the frontend click positions to the PDF render positions. The markers appear shifted from their intended locations on the body diagram.

## Recommended Solution Approach

### Option 1: Debug the Coordinate Math
1. Add logging to capture raw X/Y values from frontend
2. Compare with adjusted values in PDF renderer
3. Analyze the pattern of misalignment (is it consistent? proportional?)
4. Refine the transformation formula

### Option 2: Simplify the Approach
1. Remove the SVG scaling transform from both frontend and backend
2. Use raw 1:1 coordinate mapping
3. Adjust the SVG viewBox if needed for sizing

### Option 3: Use Absolute Positioning
1. Calculate exact pixel positions instead of percentages
2. Use fixed dimensions for the SVG container
3. Map coordinates to fixed pixel positions

## Files to Review
- `/backend-go/internal/services/body_diagram_v2.go` (lines 169-187, 386-413)
- `/frontend/src/components/FormBuilder/BodyDiagram2.tsx` (lines 111-151)
- The coordinate calculation logic in both files

## Testing Approach
1. Create a test form with markers at known positions (corners, center)
2. Generate PDF and measure the offset
3. Adjust formula based on observed pattern
4. Repeat until alignment is correct

## Additional Notes
- Both body diagram types use the same SVG and coordinate system
- The issue affects both pain and sensation diagrams equally
- The rest of the PDF generation system is working correctly
- Consider that Gotenberg (HTML to PDF converter) might also affect positioning

## Success Criteria
Markers placed on the frontend body diagram should appear in the exact same anatomical location on the PDF output.