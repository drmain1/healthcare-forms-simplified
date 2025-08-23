import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Chip, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import DOMPurify from 'dompurify';

interface SensationMark {
  id: string;
  x: number;
  y: number;
  sensation: 'numbness' | 'aching' | 'burning' | 'pins_and_needles' | 'stabbing';
  label?: string;
}

interface BodyDiagram2Props {
  value?: SensationMark[];
  onChange?: (marks: SensationMark[]) => void;
  readOnly?: boolean;
}

const SensationColors = {
  numbness: '#9E9E9E',         // Gray
  aching: '#FF9800',           // Orange
  burning: '#F44336',          // Red
  pins_and_needles: '#9C27B0', // Purple
  stabbing: '#FF5722'          // Deep Orange/Red
};

const SensationLabels = {
  numbness: 'Numbness',
  aching: 'Aching',
  burning: 'Burning',
  pins_and_needles: 'Pins & Needles',
  stabbing: 'Stabbing'
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

const SensationMarker = styled('div')<{ sensation: string }>(({ sensation }) => ({
  position: 'absolute',
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: SensationColors[sensation as keyof typeof SensationColors],
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

const SensationSelector = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  alignItems: 'center'
}));

// Embedded SVG content from your JoLp9f01 (1).svg
const BODY_SVG_CONTENT = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" version="1.0" viewBox="0 0 300 300" style="max-width: 100%; height: auto;">
  <path d="M227 19c-6 3-8 15-4 23l2 8c0 3-1 4-12 10s-12 7-14 10l-2 12a210 210 0 0 1-8 45c-3 14-4 17-6 20-6 5-10 15-6 14l2-2-1-1h-1l2-1c2 0 2 1 0 7v7h2c0-2 3-3 3-1h-1l-1 1c0 2 1 2 2 2l3-1 1-2h3c2-4 3-11 4-18l4-14 8-28c1-10 2-11 2-9 4 11 3 23-1 40-2 6-1 28 2 41 2 12 3 18 1 27-1 7 0 11 5 26 2 9 3 10 2 34v5l4 3c6 3 8 3 8-1l1-4v-6c-1-5-1-10 1-10 1 0 2 3 2 9l1 10c1 4 3 6 5 4l5-3 2-3-1-15c-2-17-2-15 2-33 2-7 2-14 1-22v-14c7-34 7-34 6-49l-3-22c0-10 2-21 3-17l2 8c0 9 2 14 6 24a127 127 0 0 1 9 31c1 4 3 5 3 2 0-2 1-2 4-2l5 1-4 1h-4c0 2 1 4 3 4v-1l2-2c2 0 2 0 1 1l-1 2c2 2 3 1 3-1s0-2 1-1h3l-2-2v-1c2 0 2-1 1-3-1-5-1-6 2-5l2-1c0-2-4-8-5-8l-4-3c-3-3-3-5-7-24l-3-11c-2-3-2-9-3-32-1-6-1-9-3-11l-12-8c-11-6-11-6-12-9l2-8c2-4 3-12 1-18s-10-9-18-5zm15 2c2 3 2 4 2 11l-1 7-6 2 3 1h2c-2 2-1 11 0 12l12 7 11 7c1 0 2 4 2 9l3 33c2 2 3 7 5 19 2 13 3 15 8 19 5 3 6 6 2 4l-1 4c1 5 0 6-2 3v1c0 3-2 4-3 1l-1-2v2c0 3-1 2-3 0l-1-1-1 2-3-14-5-14c-5-11-6-14-7-24l-2-12c-1-5-1-7 2-15l-1-2-1 2a777 777 0 0 0-7 25c-2 0-2 0-1 1 2 1 2 3 3 8v6l-3-1c-4 0-10 3-10 5 0 1 1 1 3-1s7-3 9-1a100 100 0 0 1 1 48 457 457 0 0 0-6 22h-1l-3 1c-3 0-4 0-4 3-1 3-3 4-3 1v-24l-1-22 3 2 6 2c3 0 9-3 9-4h-3c-3 3-9 2-12 0s-3-3-3-9v-7l-1 7c0 7 0 7-3 9-4 2-9 3-13 1l-3-1c0 2 6 4 9 4l6-2 4-2-2 12-2 22c1 13 0 17-3 11l-1-6-1-3c-1 0-1 3 1 6 0 2 0 2-3 1l-4-2-1-1-1 2v1l-2-8-2-11-2-16c-1-13-1-14 1-22l2-11c0-2 2-4 6-5 2 0 3 0 6 3l3 2c0-2-5-6-7-6h-5c-2 1-2 1-2-5l1-7 1 2c0 2 1 1 5-2l2-3-3 2c-2 2-5 2-3 0l-1-1c-2 0-3-1-4-8l-3-12-1-5v4c1 6 0 11-1 19l-2 7c0-2-4-3-4-1l2 1 1 2-2 4 1-1c3-4 2-1 0 7a578 578 0 0 0-15 37v-2l-1 1c-1 3-3 2-2 0 0-2 0-2-1 0-2 3-3 2-2-2 1-5 1-7-1-5h-2l4-5c5-5 6-10 8-23 1-5 2-11 4-13l2-13 4-31 7-5 15-9 4-2v-6l-1-7 4 1 4-1-2-1c-5 0-9-1-8-2v-2l-1-6c0-3 0-4 3-7 3-4 4-4 9-4 4 0 6 1 8 3zm-10 161 1 20v9l-1 12 2 24c-2 9-5-2-4-14l-1-25v-6l1-16c0-13 1-22 2-21v17zm14 16 2 9c1 9 1 12-3 26-2 8-2 11-2 21 1 7 1 7-3-2v-6l-1-2-1 2-1 2c-2 1-2 1-1-2v-10l-1-8c-2-1 0-21 3-28 0-2 4-3 6-2h2zm-22 2c4 4 7 24 4 28l-1 3 1 9-1 9-1-1-1-3-1 2c1 2 0 5-1 8l-2 6h-1v-3c2-5-1-17-6-33-2-6-2-8-1-16l1-10 10 1zm7 51c1 2-1 6-3 7l-1 1 2 2 1 7v5h-4l-6-2c-2-1-2-2-2-5l2-3 4-7c0-4 5-7 6-5zm9 5 4 6 1 1v4c1 3-1 6-6 6-4 1-5-1-4-6l1-6c-1-1 0-2 1-2l1-1-2-1c-2 0-3-2-3-5 0-2 1-2 3-2s3 1 4 6z" fill="#666"/>
  <path d="M221 66v3c-2 1-2 1-7-1-4-2-6-3-6-1 0 1 10 5 13 5l1 2-1 12c0 2-3 2-5 0l-2-1 1 2c3 3 6 4 7 1l2-9c1-9 0-15-3-15v1zm22 1c-3 6 0 23 3 23 2 0 7-5 6-6l-3 2c-1 2-4 3-4 0l-1-16v2h3l9-7-5 3c-4 2-5 2-6 0-1-1 0-2 1-3v-1l-3 3zm-8 38 8 7-4-4c-2-3-4-4-4-3zm-9 4-5 3-1 1c0 2 3 1 7-3 3-3 4-5 3-5l-4 4zm18 1 4 2-5-5 1 3zm16 2c0 3 2 8 3 8v-3c-2-3-2-4 0-4l2-1-2-1-2-1c-1-1-1 0-1 2zm-31 18 4 1 4-1-4-1c-3 0-5 0-4 1zm-3 3c0 2 3 6 4 6v-2l-2-3-1-2-1 1zm10 2c-2 4-2 6 1 3l1-6-2 3zm-14 133c0 1 3 2 5 1s1-2-2-2l-3 1zm15 0 3 1 3-1-3-1c-3 0-4 0-3 1zM148 20c-2 2-3 8-1 9 2 2 1 6-1 9l-2 6-2 6c-3 6-4 10-5 22l-1 15c-1 1 0 3 1 4 2 2 6 2 6-2 0-1 0-2 1-1 1 0 2 0 2-2l1-1 1 9v9l-1 8c-2 7-2 9-1 14v16c-2 3 0 4 8 4s12-1 12-3l-2-1-5-2c-4-1-4-2-4-5l5-33c2-7 2-12 2-31V48l-3-5c-3-5-3-7 0-8 3 0 2-2-1-2-2 0-3 0-2 1v3c-2 2-4 2-4 0l-2-1 1 3 3 2c2-1 3 0 4 4l2 5v1c2 0 1 8-1 11-1 2-2 2-6 2-6-1-6-2-3-9 3-5 3-5 6-3 2 2 3 2 3 1l-7-4-3 6-4 5c-2 0-2 1-1 3l-1 9v8c2 2-1 7-3 8-2 0-3-3-2-8l1-10 1-7 1-3c-1-2 0-6 3-9l1-6 2-6 2-5c0-2 1-2 2-2 4 0 4-2 1-2-4-1-6-3-4-7 0-2 1-3 5-3 3 0 5 0 6 2 1 1 1 1-2 4l-3 2h4c3-1 3-1 2 1l1 3v-8c0-5-10-8-13-4zm0 47-2 8-2 5 1-6 1-13 2 6zm12 12a174 174 0 0 1-4 37 490 490 0 0 1-2 21l4 3c4 2 3 3-5 3l-6-1 3-1c2 0 2 0 1-1l-1-2v-2l-1 2c-1 1-1 0-1-2v-24c1-4 2-5 3-3h2c1-1 1-1-1-1-2-1-3-7-3-17l-1-7c-2-2-2-5-1-10l4-3c3 0 7 2 7 5 1 2 1 2 1 0 0-3-4-7-8-7l-2-2 4-1 6-2 1-1v16zM65 21c-7 2-11 6-10 13v4l1 6 3 9 1 3 1-2h2c2 3 8 3 10 0 2-1 2-1 2 2v3c1-1 2 0 4 1l8 4c11 3 12 4 14 7 2 4 3 14 1 14l1 4v19c0 2-1 2-3 2l-3 1c0 2 5 1 8-1 2-1 2-1 3 1l3 13a98 98 0 0 0 3 19l2 1c2 0 7 5 7 8l1 1 1 2-3-2-4-2-3-1c-2-2-4-1-4 2-1 4-3 3-4-2-1-4 0-4 3-5 2-1 3-1 2-2h-2l-2 1c-3 0-10-21-13-36l-2-8-1-9c0-5 0-6 2-7l2-2-4-3v1c0 1-2 7-5 10-3 2-1 3 1 0 2-2 2-1 2 5-1 8-4 16-5 16-2 0-6-5-9-11l-4-5 8 15c5 4 7 4 8-2l2-8 1-2 3 13 6 21 6 18c0 5 3 15 4 17 2 1 3 0 2-2l2 2c1 2 2 3 5 3 2 0 3 0 2-1l2-4v2h1v-5c-2-5-2-6 0-5l2-1c1-1-3-8-7-12s-7-13-7-20l-4-16c-2-4-3-14-3-26-1-11-2-14-8-17l-6-2-8-3-7-3v-4l3-9 1-7v-6c-1-7-7-12-15-10zm7 2c5 2 6 5 6 12 0 12-4 19-10 19-5 0-9-5-11-14-1-9-1-10 1-13 1-2 3-3 6-4l5-1 3 1zm49 134c1 2 1 3-1 3l-1-1-1-1v1c1 2 1 3-1 3l-1-1c0-1-1-2-3-2s-3 0-2 1l-1 1-1-1-1-2c0-2 1-2 5-2l4-1 1-1 3 3z" fill="#666"/>
  <path d="M62 39c-1 1 0 1 2 1l4-1h-6zm7 0 2 1 4-1-3-1-3 1zm0 3c1 1 0 2-1 2v-1l-1-1-1 3 3 1c2 0 3-2 1-4h-1zm-3 6-2 1 2 1h4c2-2 2-2 0-2h-4zm-7 10-10 6c-14 6-14 8-15 26-1 17-2 20-4 25-1 3-3 9-3 14-3 15-4 17-7 20-5 3-8 8-8 11 0 2 2 3 4 1s1 0 0 6c-2 5-1 7 1 5h3v1l-2 1c1 1 6 1 8-1 1-3 1-4-1-3l-1-1 2-1 2 2 1 2 3-7c1-3 1-3-1-2 0 2-1 2-1 1l-1-1-2 2-1 2v-2l-1-2c-1 0-2 1-1 2 0 1 0 2-2 2v-2l-1-2-1 2-1 1c-2 0-2-1-1-3l1-4h2l2 1h11v-6l3-14c4-10 5-14 5-21l2-12 1-5 2 6c3 10 3 9-1 40-2 14-2 15-1 25l4 17 1 18c0 14 1 19 6 32 4 11 4 17-2 32-1 3 4 8 7 8h1v1c1 2 3 0 5-4 1-2 2-5 1-8l1-6c2-3 2-3 4-1l1 6c0 4 1 6 3 9l4 4 4-4 4-5-3-10c-5-9-5-14-1-30 3-10 3-12 2-19l1-22c3-8 6-34 4-42a3346 3346 0 0 1-6-26c1 4 1 5-2 8-2 3-3 8-1 8l1-2c-1-2 0-3 1-5 2-3 3-3 3 1l1 10 2 11c1 6-2 32-4 36l-1 19c0 15-1 18-3 27-4 12-4 18 0 24l2 5 2 3v1l-1 1-1 1v1h-1c-2-1-5 0-5 1 0 2 2 1 2 0 1-1 1 0 2 1v1h-3c-2 2-4-1-4-6l-2-7c-2-3-2-4-1-5v-62l-1-10-3-29c-1 0-2 7-3 25l-1 15v15l3 13v13l1 16v8l-2 8c0 7-1 8-4 8-2 0-3-1-2-2l-1-2-3-1h-1v1c-1 0-1-2 1-4l1-3 1-4c2-3 2-11 1-15l-4-14c-4-9-4-10-4-23 0-11 0-15-2-20-4-15-5-27-2-49l2-9 2 2 2 4 1 3 1-3c0-2-1-4-3-5l-3-2 1-7c0-7 1-8 3-10l7-9 5-9 1-1c0 3 2 2 4 0 2-4 3-11 1-12v2c0 2 0 4-2 7l-2 2-1-2-1-2h-1v3l-4 8c-5 10-8 13-10 13l-1-1-2-8-2-10c0-3 0-3 2-2 2 2 2 0 0-3l-4-5c0-2 0-2-2-1-1 2-1 3 1 3 3 0 3 9-1 21-1 5-2 6-4 6-3-1-3-3-3-12V89c0-9 1-14 4-17 2-3 11-7 20-11 3-2 4-3 1-4l-1 1zm-19 57c2 0 2 0 2 2l-2 7-3 12-3 9-2 3-8-2 3-12 4-16 1-5 3 2h5zm-10 34c2 1 3 1 3 4 0 4 0 4-2 4l-3-3c-1-3-1-3-4 0l-5 2c-2 0-3 1-3 2l-2 2c-2 0 1-4 5-8 2-3 4-4 5-3h5zm-4 8c-2 1-2 1 0 1h5c1 1 1 1-2 1-5 0-11-2-7-2l3-2h2l-2 2zm44 24 1 18c1 10 0 22-1 22l-2-6-1-17v-13l1-10c1-10 2-6 2 6zm2 61c0 9-1 12-2 6v-19l1-7v7l1 13z" fill="#666"/>
  <path d="M69 66h-7c1 2 6 2 9 1l3-2c0-2-4-1-5 1zm8-1 3 1 2-1-3-1c-2 0-3 0-2 1zm-23 2h5c1-2 0-2-2-2s-3 1-3 2zm29 0c-2 0-1 2 1 2 2 1 2 0 2-1 0-2 0-2-3-1zm-22 5c2 3 3 3 3 0l-2-2c-2-1-2-1-1 1zm10 0v3l1 2 1-3c0-4-2-5-2-2zm-7 4c-2 3-1 6 1 4v-4l1-2-2 2zm-1 9 1 3 1-1v-5c-1 0-2 1-2 3zm4 57c-4 0-5 1-3 1 3 1 11 0 11-1l-1-1-7 1zm-6 4 6 8c2 0 1-2-3-6l-3-2zm12 0-3 8 2-2 2-4c2-3 1-4-1-2zm73 7c-4 3-4 17 0 17 2 0 2 3 0 8l-3 4v23l3 31 3 8 1 5 2 12v9l-5 3-5 4 18 1c2-1 2-1 2-4-2-7-2-12-1-16 1-5 0-12-3-17-1-2 0-22 1-21h3l1 3 2 2c4 0 5-2 5-7l-2-15c0-8-1-12-3-16l-3-9-3-6c-2-2-2-4-2-6 2-8 2-9 1-12-2-2-3-2-6-2l-6 1zm11 4c2 3 0 7-3 7-1 0-2 0-1-2 0-2 0-2-2-2h-4c-4-4-1-6 5-6 3 0 4 0 5 3zm-6 6c0 3-6 7-6 4v-3c-1-2 0-2 3-2l3 1zm4 5 3 5 1 4 3 8 3 7c-1 1 0 3 1 3l1 7v11c2 5 2 6-2 7l-2-2-1-2v-23c-2 0-7-6-7-7 1-1 0-2-1-3-2-1-3-1-5 1-1 2 0 3 2 1 0-1 2 0 4 3 3 5 3 8-1 9-2 1-5 0-8-2-2-3-3-8-1-9v-2l2-5c2-5 3-5 3-3s2 3 2 0l2-3c1-1 2-3 0-3l-2 2-1 1-1-2-1-1 1-2c2-4 4-4 5 0zm7 41c1 4-1 4-3-2-2-5-2-7-1-11 1-2 1-2 2 4l2 9zm-15-11 6 1c2 0 3 0 3 2l-2 2c-3 0-8 4-8 6l1 2 1-2c0-4 7-6 9-2 2 3 3 9 1 11l-1 6-2 16-2 1v1h3l3 6v20l-1 2-1 1c-1 1 0 2 1 2 5 1 2 2-3 3-7 1-9-1-5-3 3-1 4-2 3-7a94 94 0 0 0-4-25l-2-7-1-15-1-17v-6l2 2zm-73 3 3 7 2-1c1-1 1-1-1-1l-2-3-1-3-1 1zm-11 1-1 2-1 2-2 1 2 1c1 0 2-1 2-3v-3zm-4 15 2 11 2 10 1 3v-3l-4-24-1 3zm19 3-1 12v6l1-5c2-16 2-19 1-19l-1 6z" fill="#666"/>
</svg>
`;

export const BodyDiagram2: React.FC<BodyDiagram2Props> = ({
  value = [],
  onChange,
  readOnly = false
}) => {
  const [sensationMarks, setSensationMarks] = useState<SensationMark[]>(value);
  const [selectedSensation, setSelectedSensation] = useState<'numbness' | 'aching' | 'burning' | 'pins_and_needles' | 'stabbing'>('aching');
  const svgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSensationMarks(value);
  }, [value]);

  const handleSvgClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !svgRef.current) return;

    const svg = svgRef.current.querySelector('svg');
    if (!svg) return;

    // Get SVG dimensions
    const svgRect = svg.getBoundingClientRect();
    // Calculate relative position (0-100%)
    const clickX = event.clientX - svgRect.left;
    const clickY = event.clientY - svgRect.top;

    let x = (clickX / svgRect.width) * 100;
    let y = (clickY / svgRect.height) * 100;

    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    const newMark: SensationMark = {
      id: `sensation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x,
      y,
      sensation: selectedSensation
    };

    const updatedMarks = [...sensationMarks, newMark];
    setSensationMarks(updatedMarks);
    onChange?.(updatedMarks);
  };

  const handleRemoveMark = (markId: string) => {
    if (readOnly) return;
    
    const updatedMarks = sensationMarks.filter(mark => mark.id !== markId);
    setSensationMarks(updatedMarks);
    onChange?.(updatedMarks);
  };

  const handleClearAll = () => {
    setSensationMarks([]);
    onChange?.([]);
  };

  return (
    <DiagramContainer elevation={1}>
      <Typography variant="h6" gutterBottom>
        Mark Sensation Areas
      </Typography>
      
      {!readOnly && (
        <>
          <SensationSelector>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Select sensation type:
            </Typography>
            {(Object.keys(SensationLabels) as Array<keyof typeof SensationLabels>).map((sensation) => (
              <Chip
                key={sensation}
                label={SensationLabels[sensation]}
                onClick={() => setSelectedSensation(sensation)}
                sx={{
                  backgroundColor: selectedSensation === sensation 
                    ? SensationColors[sensation] 
                    : '#e0e0e0',
                  color: selectedSensation === sensation ? '#fff' : '#666',
                  '&:hover': {
                    backgroundColor: SensationColors[sensation],
                    color: '#fff'
                  }
                }}
              />
            ))}
          </SensationSelector>

          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Click on the body diagram to mark areas of different sensations
          </Typography>
        </>
      )}

      <SvgWrapper 
        ref={svgRef}
        onClick={handleSvgClick}
        style={{ cursor: readOnly ? 'default' : 'crosshair' }}
      >
        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(BODY_SVG_CONTENT) }} />
        
        {/* Render sensation markers inside the wrapper */}
        {sensationMarks.map((mark, index) => (
          <SensationMarker
            key={mark.id}
            sensation={mark.sensation}
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
            title={readOnly ? `${SensationLabels[mark.sensation]}` : 'Click to remove'}
          >
            {SensationLabels[mark.sensation].charAt(0)}
          </SensationMarker>
        ))}
      </SvgWrapper>

      {!readOnly && sensationMarks.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            {sensationMarks.length} area{sensationMarks.length !== 1 ? 's' : ''} marked
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

      {readOnly && sensationMarks.length === 0 && (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          No sensation areas marked
        </Typography>
      )}
    </DiagramContainer>
  );
};

// Function to render the diagram for PDF export
export const renderBodyDiagram2ForPDF = (marks: SensationMark[]): string => {
  // This returns an HTML string that can be rendered in PDF
  const marksHtml = marks.map((mark, index) => `
    <div style="
      position: absolute;
      left: ${mark.x}%;
      top: ${mark.y}%;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: ${SensationColors[mark.sensation]};
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
      ${SensationLabels[mark.sensation].charAt(0)}
    </div>
  `).join('');

  const legend = `
    <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 15px;">
      ${Object.entries(SensationColors).map(([sensation, color]) => `
        <span><span style="display: inline-block; width: 12px; height: 12px; background: ${color}; border-radius: 50%; margin-right: 5px;"></span>${SensationLabels[sensation as keyof typeof SensationLabels]}</span>
      `).join('')}
    </div>
  `;

  return `
    <div style="position: relative; display: inline-block;">
      <div style="width: 488px; height: 488px;">${BODY_SVG_CONTENT}</div>
      ${marksHtml}
      ${marks.length > 0 ? legend : '<p>No sensation areas marked</p>'}
    </div>
  `;
};