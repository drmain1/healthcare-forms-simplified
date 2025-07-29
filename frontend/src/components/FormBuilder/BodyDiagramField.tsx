import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup, IconButton, Chip } from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';
import { designTokens } from '../../styles/design-tokens';

interface PainPoint {
  id: string;
  x: number;
  y: number;
  bodyPart: string;
  intensity: number;
  view: 'front' | 'back';
}

interface BodyDiagramFieldProps {
  value?: PainPoint[];
  onChange?: (value: PainPoint[]) => void;
  readOnly?: boolean;
}

const intensityColors = {
  1: '#FFE082', // Light yellow - Mild
  2: designTokens.colors.pain.mild, // Moderate  
  3: designTokens.colors.pain.moderate, // Severe
  4: designTokens.colors.pain.severe, // Very severe
  5: '#B71C1C', // Dark red - Extreme
};

const intensityLabels = {
  1: 'Mild',
  2: 'Moderate',
  3: 'Severe',
  4: 'Very Severe',
  5: 'Extreme'
};

const bodyPartMap = {
  'head-front': 'Head',
  'head-back': 'Head (back)',
  'neck-front': 'Neck',
  'neck-back': 'Neck (back)',
  'torso-front': 'Chest/Abdomen',
  'torso-back': 'Back',
  'left-arm-front': 'Left Arm',
  'left-arm-back': 'Left Arm (back)',
  'right-arm-front': 'Right Arm',
  'right-arm-back': 'Right Arm (back)',
  'left-hand-front': 'Left Hand',
  'left-hand-back': 'Left Hand (back)',
  'right-hand-front': 'Right Hand',
  'right-hand-back': 'Right Hand (back)',
  'left-leg-front': 'Left Leg',
  'left-leg-back': 'Left Leg (back)',
  'right-leg-front': 'Right Leg',
  'right-leg-back': 'Right Leg (back)',
  'left-foot-front': 'Left Foot',
  'left-foot-back': 'Left Foot (back)',
  'right-foot-front': 'Right Foot',
  'right-foot-back': 'Right Foot (back)'
};

export const BodyDiagramField: React.FC<BodyDiagramFieldProps> = ({ 
  value = [], 
  onChange,
  readOnly = false 
}) => {
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');
  const [selectedIntensity, setSelectedIntensity] = useState<number>(3);
  const [painPoints, setPainPoints] = useState<PainPoint[]>(value);
  const svgRef = useRef<SVGSVGElement>(null);

  // Utility function for cursor styles - eliminates repetitive inline styles
  const getCursorStyle = (type: 'default' | 'pointer' | 'crosshair' = 'pointer') => {
    if (readOnly) return { cursor: 'default' };
    return { cursor: type };
  };

  useEffect(() => {
    setPainPoints(value);
  }, [value]);

  const handleSvgClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly) return;

    const svg = svgRef.current;
    if (!svg) return;

    // Check which body part was clicked
    const clickedElement = event.target as SVGElement;
    const bodyPartId = clickedElement.id || '';
    const bodyPartName = bodyPartMap[bodyPartId as keyof typeof bodyPartMap] || 'Body';
    
    // Only add point if a valid body part was clicked (not the SVG background)
    if (bodyPartId && bodyPartId.includes(currentView)) {
      // Get the click coordinates relative to the SVG viewport
      const rect = svg.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Scale to SVG coordinates
      const viewBox = svg.viewBox.baseVal;
      const svgX = (x / rect.width) * viewBox.width;
      const svgY = (y / rect.height) * viewBox.height;

      const newPoint: PainPoint = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: svgX,
        y: svgY,
        bodyPart: bodyPartName,
        intensity: selectedIntensity,
        view: currentView
      };

      const updatedPoints = [...painPoints, newPoint];
      setPainPoints(updatedPoints);
      onChange?.(updatedPoints);
    }
  };

  const removePainPoint = (pointId: string) => {
    const updatedPoints = painPoints.filter(p => p.id !== pointId);
    setPainPoints(updatedPoints);
    onChange?.(updatedPoints);
  };

  const clearAll = () => {
    setPainPoints([]);
    onChange?.([]);
  };

  const viewPoints = painPoints.filter(p => p.view === currentView);

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Mark Pain Locations</Typography>
        {!readOnly && painPoints.length > 0 && (
          <IconButton onClick={clearAll} size="small" color="error">
            <ClearIcon />
          </IconButton>
        )}
      </Box>

      {!readOnly && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Select pain intensity level:
          </Typography>
          <ToggleButtonGroup
            value={selectedIntensity}
            exclusive
            onChange={(_, value) => value && setSelectedIntensity(value)}
            size="small"
          >
            {Object.entries(intensityLabels).map(([level, label]) => (
              <ToggleButton
                key={level}
                value={Number(level)}
                sx={{
                  backgroundColor: intensityColors[Number(level) as keyof typeof intensityColors],
                  '&.Mui-selected': {
                    backgroundColor: intensityColors[Number(level) as keyof typeof intensityColors],
                    filter: 'brightness(0.8)',
                  }
                }}
              >
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={currentView}
          exclusive
          onChange={(_, value) => value && setCurrentView(value)}
          size="small"
          fullWidth
        >
          <ToggleButton value="front">Front View</ToggleButton>
          <ToggleButton value="back">Back View</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ position: 'relative', border: '1px solid #ddd', borderRadius: 1, p: 2 }}>
        <svg
          ref={svgRef}
          viewBox="0 0 800 400"
          style={{ width: '100%', height: 'auto', ...getCursorStyle('crosshair') }}
          onClick={handleSvgClick}
        >
          {/* Body diagram paths */}
          <g id={`body-${currentView}`} transform="translate(300, 50)">
            {/* Head */}
            <ellipse 
              id={`head-${currentView}`} 
              cx="100" cy="40" rx="30" ry="35" 
              fill="none" 
              stroke="#333" 
              strokeWidth="2"
              style={getCursorStyle()}
            />
            
            {/* Neck */}
            <rect 
              id={`neck-${currentView}`} 
              x="85" y="70" width="30" height="20" 
              fill="none" 
              stroke="#333" 
              strokeWidth="2"
              style={getCursorStyle()}
            />
            
            {/* Torso */}
            <path 
              id={`torso-${currentView}`} 
              d="M 70 90 L 70 180 L 90 200 L 110 200 L 130 180 L 130 90 Z" 
              fill="none" 
              stroke="#333" 
              strokeWidth="2"
              style={getCursorStyle()}
            />
            
            {/* Arms */}
            <path 
              id={`left-arm-${currentView}`} 
              d="M 70 100 L 40 130 L 35 170 L 40 180" 
              fill="none" 
              stroke="#333" 
              strokeWidth="2"
              style={getCursorStyle()}
            />
            <path 
              id={`right-arm-${currentView}`} 
              d="M 130 100 L 160 130 L 165 170 L 160 180" 
              fill="none" 
              stroke="#333" 
              strokeWidth="2"
              style={getCursorStyle()}
            />
            
            {/* Hands */}
            <circle 
              id={`left-hand-${currentView}`} 
              cx="40" cy="185" r="8" 
              fill="none" 
              stroke="#333" 
              strokeWidth="2"
              style={getCursorStyle()}
            />
            <circle 
              id={`right-hand-${currentView}`} 
              cx="160" cy="185" r="8" 
              fill="none" 
              stroke="#333" 
              strokeWidth="2"
              style={getCursorStyle()}
            />
            
            {/* Legs */}
            <path 
              id={`left-leg-${currentView}`} 
              d="M 90 200 L 85 250 L 80 300" 
              fill="none" 
              stroke="#333" 
              strokeWidth="2"
              style={getCursorStyle()}
            />
            <path 
              id={`right-leg-${currentView}`} 
              d="M 110 200 L 115 250 L 120 300" 
              fill="none" 
              stroke="#333" 
              strokeWidth="2"
              style={getCursorStyle()}
            />
            
            {/* Feet */}
            <ellipse 
              id={`left-foot-${currentView}`} 
              cx="80" cy="310" rx="15" ry="8" 
              fill="none" 
              stroke="#333" 
              strokeWidth="2"
              style={getCursorStyle()}
            />
            <ellipse 
              id={`right-foot-${currentView}`} 
              cx="120" cy="310" rx="15" ry="8" 
              fill="none" 
              stroke="#333" 
              strokeWidth="2"
              style={getCursorStyle()}
            />
          </g>

          {/* Pain points */}
          {viewPoints.map(point => (
            <circle
              key={point.id}
              cx={point.x}
              cy={point.y}
              r="8"
              fill={intensityColors[point.intensity as keyof typeof intensityColors]}
              stroke="#333"
              strokeWidth="2"
              style={getCursorStyle()}
              onClick={(e) => {
                e.stopPropagation();
                if (!readOnly) removePainPoint(point.id);
              }}
            />
          ))}
        </svg>
      </Box>

      {painPoints.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Marked pain locations:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {painPoints.map(point => (
              <Chip
                key={point.id}
                label={`${point.bodyPart} - ${intensityLabels[point.intensity as keyof typeof intensityLabels]} (${point.view})`}
                onDelete={readOnly ? undefined : () => removePainPoint(point.id)}
                style={{ 
                  backgroundColor: intensityColors[point.intensity as keyof typeof intensityColors],
                  color: point.intensity >= 3 ? 'white' : 'black'
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};