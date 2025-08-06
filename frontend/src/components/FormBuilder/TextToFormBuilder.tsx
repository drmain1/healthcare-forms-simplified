import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  ContentCopy as CopyIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import geminiService from '../../services/geminiService';

interface TextToFormBuilderProps {
  onFormGenerated: (formJson: any) => void;
}

const samplePrompts = [
  "Create a patient intake form with personal information, medical history, current medications, and allergies",
  "Build a COVID-19 screening questionnaire with symptoms checklist and exposure questions",
  "Generate a pain assessment form with pain scale, location, duration, and triggers",
  "Make a mental health screening form with PHQ-9 depression questions",
  "Create a post-surgery follow-up form with recovery progress and complications",
];

export const TextToFormBuilder: React.FC<TextToFormBuilderProps> = ({ onFormGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedForm, setGeneratedForm] = useState<any>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description of the form you want to create');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formJson = await geminiService.generateFormFromText(prompt);
      setGeneratedForm(formJson);
      onFormGenerated({
        logoPosition: 'right',
        ...formJson
      });
    } catch (err: any) {
      
      
      // Provide more specific error messages
      if (err.message.includes('No valid JSON')) {
        setError('The AI had trouble formatting the response. Please try simplifying your request or breaking it into smaller parts.');
      } else if (err.message.includes('Invalid form structure')) {
        setError('The generated form structure was invalid. Please try rephrasing your request.');
      } else if (err.message.includes('quota') || err.message.includes('rate limit')) {
        setError('API rate limit reached. Please wait a moment and try again.');
      } else {
        setError('Failed to generate form. Try a simpler description or break complex forms into sections.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSamplePrompt = (samplePrompt: string) => {
    setPrompt(samplePrompt);
  };

  const handleRegenerate = () => {
    if (prompt) {
      handleGenerate();
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, backgroundColor: '#f8fafc' }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AIIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="600">
            AI Form Builder
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Describe the form you want to create, and AI will generate it for you using Gemini's advanced language model.
        </Typography>
      </Box>

      <TextField
        fullWidth
        multiline
        rows={4}
        variant="outlined"
        placeholder="Describe your form in detail. For example: 'Create a patient intake form with sections for demographics, medical history, current medications, allergies, and emergency contacts.'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        sx={{ mb: 2 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AIIcon />}
          sx={{ mr: 2 }}
        >
          {loading ? 'Generating...' : 'Generate Form'}
        </Button>

        {generatedForm && (
          <Tooltip title="Regenerate with same prompt">
            <IconButton onClick={handleRegenerate} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
          Sample Prompts - Click to Use:
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {samplePrompts.map((samplePrompt, index) => (
            <Chip
              key={index}
              label={samplePrompt}
              onClick={() => handleSamplePrompt(samplePrompt)}
              variant="outlined"
              size="small"
              sx={{ 
                mb: 1,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
            />
          ))}
        </Stack>
      </Box>

      {generatedForm && (
        <Box sx={{ mt: 3 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Form generated successfully! The form has been loaded in the builder where you can further customize it.
          </Alert>
          <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
            <Typography variant="subtitle2" gutterBottom>
              Generated Form Structure:
            </Typography>
            <Typography variant="body2" component="pre" sx={{ 
              overflow: 'auto', 
              maxHeight: 200,
              fontSize: '0.8rem',
              fontFamily: 'monospace'
            }}>
              {JSON.stringify(generatedForm, null, 2)}
            </Typography>
          </Paper>
        </Box>
      )}
    </Paper>
  );
};