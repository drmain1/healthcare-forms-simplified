import React, { useState, useRef, useEffect } from 'react';
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
  Fade,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  ContentCopy as CopyIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import geminiService from '../../services/geminiService';

interface ConversationalFormBuilderProps {
  onFormGenerated: (formJson: any) => void;
  currentFormJson?: any;
  onFormModified?: (formJson: any) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  formJson?: any;
  error?: boolean;
}

const suggestedModifications = [
  "Add a section for emergency contacts",
  "Make all demographic fields required",
  "Add insurance information section",
  "Include a pain scale from 1-10",
  "Add conditional logic for allergy details",
  "Create a medication list with dosage fields",
  "Add file upload for medical documents",
  "Include HIPAA consent checkbox",
  "Add a signature field at the end",
  "Create a multi-page form with progress bar",
];

export const ConversationalFormBuilder: React.FC<ConversationalFormBuilderProps> = ({
  onFormGenerated,
  currentFormJson,
  onFormModified,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [formHistory, setFormHistory] = useState<any[]>([]);
  const [isModificationMode, setIsModificationMode] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if we have a form with actual content
    const hasContent = currentFormJson && 
      currentFormJson.pages && 
      currentFormJson.pages.length > 0 && 
      currentFormJson.pages.some((page: any) => page.elements && page.elements.length > 0);
    
    if (hasContent && !isModificationMode) {
      setIsModificationMode(true);
      addMessage('assistant', 'Great! I\'ve loaded your form. You can now ask me to make changes. For example, "Add a section for emergency contacts" or "Make the phone number field required".');
    }
  }, [currentFormJson]);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (role: 'user' | 'assistant', content: string, formJson?: any, error?: boolean) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      formJson,
      error,
    };
    setChatHistory(prev => [...prev, newMessage]);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!prompt.trim()) return;

    const userPrompt = prompt;
    setPrompt('');
    addMessage('user', userPrompt);
    setLoading(true);

    try {
      let result: any;
      
      // Check if we have a form with actual content
      const hasContent = currentFormJson && 
        currentFormJson.pages && 
        currentFormJson.pages.length > 0 && 
        currentFormJson.pages.some((page: any) => page.elements && page.elements.length > 0);
      
      if (!isModificationMode || !hasContent) {
        // Initial form generation
        addMessage('assistant', 'Creating your form...');
        result = await geminiService.generateFormFromText(userPrompt);
        
        // Save to history
        setFormHistory([result]);
        setIsModificationMode(true);
        
        // Update current form
        onFormGenerated({
          logoPosition: 'right',
          ...result
        });
        
        addMessage(
          'assistant', 
          'I\'ve created your form! You can now ask me to make changes. Try things like:\n• "Add a date of birth field"\n• "Make the email field required"\n• "Add a section for medical history"',
          result
        );
      } else {
        // Modification mode
        addMessage('assistant', 'Applying your changes...');
        result = await geminiService.modifyExistingForm(currentFormJson, userPrompt);
        
        // Save to history
        setFormHistory(prev => [...prev, result]);
        
        // Update form
        if (onFormModified) {
          onFormModified(result);
        } else {
          onFormGenerated({
            logoPosition: 'right',
            ...result
          });
        }
        
        addMessage('assistant', 'Done! I\'ve updated your form. What would you like to change next?', result);
      }
    } catch (err: any) {
      console.error('AI error:', err);
      
      let errorMessage = 'I encountered an error while processing your request. ';
      if (err.message.includes('quota') || err.message.includes('rate limit')) {
        errorMessage += 'API rate limit reached. Please wait a moment and try again.';
      } else if (err.message.includes('No valid JSON')) {
        errorMessage += 'I had trouble understanding the form structure. Please try rephrasing your request.';
      } else {
        errorMessage += 'Please try again with a simpler request.';
      }
      
      addMessage('assistant', errorMessage, undefined, true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const handleUndo = () => {
    if (formHistory.length > 1) {
      const newHistory = [...formHistory];
      newHistory.pop(); // Remove current
      const previousForm = newHistory[newHistory.length - 1];
      
      setFormHistory(newHistory);
      if (onFormModified) {
        onFormModified(previousForm);
      } else {
        onFormGenerated({
          logoPosition: 'right',
          ...previousForm
        });
      }
      
      addMessage('assistant', 'I\'ve undone the last change. The form has been restored to its previous state.');
    }
  };

  const handleReset = () => {
    setChatHistory([]);
    setFormHistory([]);
    setIsModificationMode(false);
    setPrompt('');
    addMessage('assistant', 'Let\'s start fresh! Describe the form you\'d like to create.');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="600">
              AI Form Assistant
            </Typography>
            {isModificationMode && (
              <Chip 
                label="Modification Mode" 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            )}
          </Box>
          <Box>
            {formHistory.length > 1 && (
              <Tooltip title="Undo last change">
                <IconButton onClick={handleUndo} size="small">
                  <UndoIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Start over">
              <IconButton onClick={handleReset} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Chat History */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 2, 
        backgroundColor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        {chatHistory.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <BotIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Welcome to the AI Form Builder!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Describe the form you want to create, and I'll build it for you.
            </Typography>
          </Box>
        )}

        {chatHistory.map((message) => (
          <Fade in key={message.id}>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'flex-start',
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                }}
              >
                {message.role === 'user' ? <PersonIcon /> : <BotIcon />}
              </Avatar>
              <Paper
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  backgroundColor: message.role === 'user' ? 'primary.main' : 'white',
                  color: message.role === 'user' ? 'white' : 'text.primary',
                  boxShadow: message.error ? '0 0 0 2px #f44336' : 1,
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    whiteSpace: 'pre-line',
                    '& ul': { margin: '8px 0', paddingLeft: '20px' },
                    '& li': { marginBottom: '4px' },
                  }}
                >
                  {message.content}
                </Typography>
                {message.formJson && (
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      size="small"
                      label="Form updated"
                      color={message.role === 'user' ? 'default' : 'success'}
                      sx={{ 
                        backgroundColor: message.role === 'user' ? 'rgba(255,255,255,0.2)' : undefined,
                        color: message.role === 'user' ? 'white' : undefined,
                      }}
                    />
                  </Box>
                )}
              </Paper>
            </Box>
          </Fade>
        ))}
        
        {loading && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              <BotIcon />
            </Avatar>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Thinking...</Typography>
            </Paper>
          </Box>
        )}
        
        <div ref={chatEndRef} />
      </Box>

      {/* Suggestions */}
      {isModificationMode && !loading && (
        <Paper elevation={0} sx={{ p: 2, borderTop: '1px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Suggested modifications:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
            {suggestedModifications.slice(0, 5).map((suggestion, index) => (
              <Chip
                key={index}
                label={suggestion}
                size="small"
                variant="outlined"
                onClick={() => handleSuggestionClick(suggestion)}
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
        </Paper>
      )}

      {/* Input Area */}
      <Paper elevation={0} sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder={
                isModificationMode 
                  ? "Ask me to modify the form (e.g., 'Add a phone number field')"
                  : "Describe the form you want to create..."
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                }
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !prompt.trim()}
              startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
            >
              Send
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};