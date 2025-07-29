import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Chip, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

interface PainMark {
  id: string;
  x: number;
  y: number;
  intensity: 'mild' | 'moderate' | 'severe';
  label?: string;
}

interface BodyPainDiagramProps {
  value?: PainMark[];
  onChange?: (marks: PainMark[]) => void;
  readOnly?: boolean;
}

const PainIntensityColors = {
  mild: '#FFC107',      // Yellow
  moderate: '#FF9800',  // Orange  
  severe: '#F44336'     // Red
};

const DiagramContainer = styled(Paper)(({ theme }) => ({
  position: 'relative',
  display: 'inline-block',
  padding: theme.spacing(2),
  backgroundColor: '#fafafa',
  border: '1px solid #e0e0e0',
  borderRadius: theme.spacing(1),
  maxWidth: '100%',
  overflow: 'auto'
}));

const SvgWrapper = styled('div')({
  position: 'relative',
  display: 'inline-block',
  cursor: 'crosshair',
  userSelect: 'none',
  '& svg': {
    maxWidth: '100%',
    height: 'auto',
    display: 'block'
  }
});

const PainMarker = styled('div')<{ intensity: string }>(({ intensity }) => ({
  position: 'absolute',
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: PainIntensityColors[intensity as keyof typeof PainIntensityColors],
  border: '2px solid #fff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  transform: 'translate(-50%, -50%)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontWeight: 'bold',
  fontSize: '14px',
  '&:hover': {
    transform: 'translate(-50%, -50%) scale(1.2)',
    transition: 'transform 0.2s ease'
  }
}));

const IntensitySelector = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'center'
}));

export const BodyPainDiagram: React.FC<BodyPainDiagramProps> = ({
  value = [],
  onChange,
  readOnly = false
}) => {
  const [painMarks, setPainMarks] = useState<PainMark[]>(value);
  const [selectedIntensity, setSelectedIntensity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const svgRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    // Load SVG content
    fetch('/assets/body-diagram-pain.svg')
      .then(response => response.text())
      .then(data => {
        // Clean up the SVG to ensure it scales properly
        const cleanedSvg = data
          .replace(/width="[^"]*"/, 'width="100%"')
          .replace(/height="[^"]*"/, 'height="auto"')
          .replace(/viewBox="[^"]*"/, 'viewBox="0 0 310 360"');
        setSvgContent(cleanedSvg);
      })
      .catch(error => {
        console.error('Error loading body diagram:', error);
        // Fallback to a simple rectangle if SVG fails to load
        setSvgContent(`
          <svg width="100%" height="auto" viewBox="0 0 310 360">
            <rect x="10" y="10" width="290" height="340" fill="#f0f0f0" stroke="#666" stroke-width="2"/>
            <text x="155" y="180" text-anchor="middle" font-size="20" fill="#666">Body Diagram</text>
          </svg>
        `);
      });
  }, []);

  useEffect(() => {
    setPainMarks(value);
  }, [value]);

  const handleSvgClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !svgRef.current) return;

    const svg = svgRef.current.querySelector('svg');
    if (!svg) return;

    // Get SVG dimensions
    const svgRect = svg.getBoundingClientRect();
    
    // Calculate relative position (0-100%)
    const x = ((event.clientX - svgRect.left) / svgRect.width) * 100;
    const y = ((event.clientY - svgRect.top) / svgRect.height) * 100;

    const newMark: PainMark = {
      id: `pain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x,
      y,
      intensity: selectedIntensity
    };

    const updatedMarks = [...painMarks, newMark];
    setPainMarks(updatedMarks);
    onChange?.(updatedMarks);
  };

  const handleRemoveMark = (markId: string) => {
    if (readOnly) return;
    
    const updatedMarks = painMarks.filter(mark => mark.id !== markId);
    setPainMarks(updatedMarks);
    onChange?.(updatedMarks);
  };

  const handleClearAll = () => {
    setPainMarks([]);
    onChange?.([]);
  };

  return (
    <DiagramContainer elevation={1}>
      <Typography variant="h6" gutterBottom>
        Mark Pain Areas
      </Typography>
      
      {!readOnly && (
        <>
          <IntensitySelector>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Select pain intensity:
            </Typography>
            {(['mild', 'moderate', 'severe'] as const).map((intensity) => (
              <Chip
                key={intensity}
                label={intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                onClick={() => setSelectedIntensity(intensity)}
                sx={{
                  backgroundColor: selectedIntensity === intensity 
                    ? PainIntensityColors[intensity] 
                    : '#e0e0e0',
                  color: selectedIntensity === intensity ? '#fff' : '#666',
                  '&:hover': {
                    backgroundColor: PainIntensityColors[intensity],
                    color: '#fff'
                  }
                }}
              />
            ))}
          </IntensitySelector>

          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Click on the body diagram to mark areas of pain
          </Typography>
        </>
      )}

      <SvgWrapper 
        ref={svgRef}
        onClick={handleSvgClick}
        style={{ cursor: readOnly ? 'default' : 'crosshair' }}
      >
        <div dangerouslySetInnerHTML={{ __html: svgContent }} />
        
        {/* Render pain markers inside the wrapper */}
        {painMarks.map((mark, index) => (
          <PainMarker
            key={mark.id}
            intensity={mark.intensity}
            style={{
              left: `${mark.x}%`,
              top: `${mark.y}%`
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!readOnly) {
                handleRemoveMark(mark.id);
              }
            }}
            title={readOnly ? `${mark.intensity} pain` : 'Click to remove'}
          >
            {index + 1}
          </PainMarker>
        ))}
      </SvgWrapper>

      {!readOnly && painMarks.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            {painMarks.length} area{painMarks.length !== 1 ? 's' : ''} marked
          </Typography>
          <Button 
            size="small" 
            onClick={handleClearAll}
            color="error"
          >
            Clear All
          </Button>
        </Box>
      )}

      {readOnly && painMarks.length === 0 && (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          No pain areas marked
        </Typography>
      )}
    </DiagramContainer>
  );
};

// Function to render the diagram for PDF export
export const renderBodyDiagramForPDF = (marks: PainMark[]): string => {
  // This returns an HTML string that can be rendered in PDF
  const marksHtml = marks.map((mark, index) => `
    <div style="
      position: absolute;
      left: ${mark.x}%;
      top: ${mark.y}%;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: ${PainIntensityColors[mark.intensity]};
      border: 2px solid #fff;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    ">
      ${index + 1}
    </div>
  `).join('');

  const legend = `
    <div style="margin-top: 10px; display: flex; gap: 15px;">
      <span><span style="display: inline-block; width: 12px; height: 12px; background: ${PainIntensityColors.mild}; border-radius: 50%; margin-right: 5px;"></span>Mild</span>
      <span><span style="display: inline-block; width: 12px; height: 12px; background: ${PainIntensityColors.moderate}; border-radius: 50%; margin-right: 5px;"></span>Moderate</span>
      <span><span style="display: inline-block; width: 12px; height: 12px; background: ${PainIntensityColors.severe}; border-radius: 50%; margin-right: 5px;"></span>Severe</span>
    </div>
  `;

  return `
    <div style="position: relative; display: inline-block;">
      <img src="/assets/body-diagram-pain.svg" style="max-width: 100%; height: auto;" />
      ${marksHtml}
      ${marks.length > 0 ? legend : '<p>No pain areas marked</p>'}
    </div>
  `;
};