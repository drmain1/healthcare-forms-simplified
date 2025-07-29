import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import {
  Save as SaveIcon,
  Preview as PreviewIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { designTokens } from '../../styles/design-tokens';

interface FormBuilderToolbarProps {
  isEditing: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  onBack: () => void;
  onPreview: () => void;
  onSave: () => void;
}

export const FormBuilderToolbar: React.FC<FormBuilderToolbarProps> = ({
  isEditing,
  isCreating,
  isUpdating,
  onBack,
  onPreview,
  onSave,
}) => {
  return (
    <Box 
      className="tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-4 tw-bg-white tw-border-b tw-border-gray-300 tw-shadow-md tw-flex-shrink-0"
      sx={{ 
        mb: 0,
        zIndex: 1100
      }}
    >
      <Box className="tw-flex tw-items-center tw-gap-4">
        <Button
          startIcon={<BackIcon />}
          onClick={onBack}
          variant="outlined"
          sx={{ 
            borderColor: designTokens.colors.primary.main,
            color: designTokens.colors.primary.main,
            '&:hover': {
              borderColor: designTokens.colors.primary.dark,
              backgroundColor: 'rgba(25, 118, 210, 0.04)'
            }
          }}
        >
          Back to Forms
        </Button>
        <Box>
          <Typography 
            variant="h4" 
            fontWeight={400}
            className="tw-text-gray-900"
            sx={{ 
              fontFamily: designTokens.typography.fontFamily.secondary
            }}
          >
            {isEditing ? 'Edit Form' : 'Create New Form'}
          </Typography>
          <Typography 
            variant="body1" 
            className="tw-text-gray-700"
            sx={{ 
              fontFamily: designTokens.typography.fontFamily.secondary
            }}
          >
            Build HIPAA-compliant healthcare forms with drag-and-drop ease
          </Typography>
        </Box>
      </Box>
      
      <Box className="tw-flex tw-gap-4">
        <Button
          variant="outlined"
          startIcon={<PreviewIcon />}
          onClick={onPreview}
          sx={{ 
            borderColor: designTokens.colors.primary.main,
            color: designTokens.colors.primary.main,
            '&:hover': {
              borderColor: designTokens.colors.primary.dark,
              backgroundColor: 'rgba(25, 118, 210, 0.04)'
            }
          }}
        >
          Preview
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={onSave}
          disabled={isCreating || isUpdating}
          className="tw-bg-primary-700 tw-text-white tw-font-medium tw-uppercase tw-tracking-wide tw-shadow-md hover:tw-bg-primary-800 hover:tw-shadow-lg disabled:tw-bg-gray-400 disabled:tw-text-white"
        >
          {isCreating || isUpdating ? 'Saving...' : isEditing ? 'Update' : 'Save'} Form
        </Button>
      </Box>
    </Box>
  );
};