import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
  Switch,
  FormControlLabel,
  CircularProgress,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Link as LinkIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  useGetFormQuery, 
  useCreateShareLinkMutation,
  useGetShareLinksQuery 
} from '../../store/api/formsApi';

export const FormSendSimplified: React.FC = () => {
  const navigate = useNavigate();
  const { id: formIdFromUrl } = useParams();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0); // 0: Static Link, 1: Email, 2: SMS, 3: QR Code
  
  // Share link settings
  const [linkSettings, setLinkSettings] = useState({
    expires_in_days: 30,
    max_responses: null as number | null,
    require_password: false,
    password: ''
  });

  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    recipients: [] as string[],
    subject: '',
    message: '',
    sendReminder: false,
    reminderDays: 3
  });

  // SMS settings
  const [smsSettings, setSmsSettings] = useState({
    recipients: [] as string[],
    message: ''
  });

  // Fetch specific form details
  const { data: formData, isLoading: isLoadingForm, error: formError } = useGetFormQuery(formIdFromUrl || '', {
    skip: !formIdFromUrl
  });

  // Fetch existing share links for selected form
  const { data: shareLinks, refetch: refetchShareLinks } = useGetShareLinksQuery(formIdFromUrl || '', {
    skip: !formIdFromUrl
  });

  // Create share link mutation
  const [createShareLink, { isLoading: isCreatingLink }] = useCreateShareLinkMutation();

  // Set default email subject when form loads
  useEffect(() => {
    if (formData && !emailSettings.subject) {
      setEmailSettings(prev => ({
        ...prev,
        subject: `Please complete: ${formData.title}`,
        message: `You have been invited to complete the following form: ${formData.title}\n\nPlease click the link below to begin.`
      }));
    }
  }, [formData]);

  const handleCreateStaticLink = async () => {
    if (!formIdFromUrl) return;

    try {
      const result = await createShareLink({
        formId: formIdFromUrl,
        shareSettings: linkSettings
      }).unwrap();
      
      console.log('Share link created:', result);
      // Copy to clipboard
      await navigator.clipboard.writeText(result.share_url);
      setCopiedLink(result.share_url);
      
      // Refresh share links
      refetchShareLinks();
      
      // Clear copied state after 3 seconds
      setTimeout(() => setCopiedLink(null), 3000);
    } catch (error: any) {
      console.error('Error creating share link:', error);
      alert('Failed to create share link. Please try again.');
    }
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(link);
      setTimeout(() => setCopiedLink(null), 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Loading states
  if (isLoadingForm) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading form...</Typography>
      </Box>
    );
  }

  // Error state
  if (formError || !formData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Unable to load form. Please check the URL and try again.
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/forms')}>
          Back to Forms
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/forms')}
          variant="outlined"
        >
          Back to Forms
        </Button>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Send Form
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generate shareable links to distribute your forms
          </Typography>
        </Box>
      </Box>

      {/* Form Information Card */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'primary.main', color: 'white' }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          {formData.title}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
          {formData.description || 'Form automatically generated from PDF upload'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            label={`Status: ${formData.status}`} 
            size="small" 
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
          />
          <Chip 
            label={`${formData.response_count || 0} responses`} 
            size="small" 
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
          />
          <Chip 
            label={`Created: ${new Date(formData.created_at).toLocaleDateString()}`} 
            size="small" 
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
          />
        </Box>
      </Paper>

      <Grid container spacing={3}>

        {/* Distribution Methods */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Distribution Method
            </Typography>
            
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
            >
              <Tab icon={<LinkIcon />} label="Static Link" />
              <Tab icon={<EmailIcon />} label="Email" />
              <Tab icon={<SmsIcon />} label="SMS" />
              <Tab icon={<QrCodeIcon />} label="QR Code" />
            </Tabs>

            {/* Static Link Tab */}
            {activeTab === 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create a shareable link that patients can use to fill out the form directly
                </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Expires in (days)"
                  type="number"
                  value={linkSettings.expires_in_days}
                  onChange={(e) => setLinkSettings(prev => ({ 
                    ...prev, 
                    expires_in_days: parseInt(e.target.value) || 30 
                  }))}
                  inputProps={{ min: 1, max: 365 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max responses (optional)"
                  type="number"
                  value={linkSettings.max_responses || ''}
                  onChange={(e) => setLinkSettings(prev => ({ 
                    ...prev, 
                    max_responses: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  inputProps={{ min: 1 }}
                  placeholder="Unlimited"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={linkSettings.require_password}
                      onChange={(e) => setLinkSettings(prev => ({ 
                        ...prev, 
                        require_password: e.target.checked,
                        password: e.target.checked ? prev.password : ''
                      }))}
                    />
                  }
                  label="Require password"
                />
              </Grid>
              {linkSettings.require_password && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={linkSettings.password}
                    onChange={(e) => setLinkSettings(prev => ({ 
                      ...prev, 
                      password: e.target.value 
                    }))}
                  />
                </Grid>
              )}
            </Grid>

                <Button
                  variant="contained"
                  startIcon={<LinkIcon />}
                  onClick={handleCreateStaticLink}
                  disabled={!formIdFromUrl || isCreatingLink}
                  fullWidth
                  size="large"
                  sx={{ mb: 4 }}
                >
                  {isCreatingLink ? 'Creating Link...' : 'Generate Static Link'}
                </Button>

            {shareLinks && shareLinks.length > 0 && (
              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Existing Share Links
                </Typography>
                <List sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 1 }}>
                  {shareLinks.map((link: any) => (
                    <ListItem 
                      key={link.id} 
                      sx={{ 
                        bgcolor: 'white', 
                        borderRadius: 1, 
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'grey.200',
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontFamily: 'monospace', 
                                bgcolor: 'grey.100',
                                p: 1,
                                borderRadius: 1,
                                fontSize: '0.85rem',
                                wordBreak: 'break-all',
                                flex: 1
                              }}
                            >
                              {link.share_url}
                            </Typography>
                            <Tooltip title={copiedLink === link.share_url ? "Copied!" : "Copy link"}>
                              <IconButton
                                size="small"
                                onClick={() => handleCopyLink(link.share_url)}
                                color={copiedLink === link.share_url ? "success" : "default"}
                              >
                                {copiedLink === link.share_url ? <CheckIcon /> : <CopyIcon />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip 
                              label={link.is_active ? 'Active' : 'Inactive'} 
                              color={link.is_active ? 'success' : 'default'}
                              size="small"
                            />
                            {link.expires_at && (
                              <Typography variant="caption" color="text.secondary">
                                Expires: {new Date(link.expires_at).toLocaleDateString()}
                              </Typography>
                            )}
                            {link.max_responses && (
                              <Typography variant="caption" color="text.secondary">
                                {link.current_responses}/{link.max_responses} responses
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
              </Box>
            )}

            {/* Email Tab */}
            {activeTab === 1 && (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Email distribution is coming soon! This feature will allow you to send form links directly to patient email addresses.
                </Alert>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Future features will include:
                </Typography>
                <List>
                  <ListItem>• Bulk email sending to multiple recipients</ListItem>
                  <ListItem>• Custom email templates</ListItem>
                  <ListItem>• Automated reminder emails</ListItem>
                  <ListItem>• Email delivery tracking</ListItem>
                  <ListItem>• HIPAA-compliant secure email options</ListItem>
                </List>
              </Box>
            )}

            {/* SMS Tab */}
            {activeTab === 2 && (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  SMS distribution is coming soon! This feature will allow you to send form links via text message.
                </Alert>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Future features will include:
                </Typography>
                <List>
                  <ListItem>• SMS sending to individual or multiple phone numbers</ListItem>
                  <ListItem>• Shortened URLs for better SMS compatibility</ListItem>
                  <ListItem>• SMS delivery confirmation</ListItem>
                  <ListItem>• Automated reminder texts</ListItem>
                  <ListItem>• Two-way SMS communication</ListItem>
                </List>
              </Box>
            )}

            {/* QR Code Tab */}
            {activeTab === 3 && (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  QR Code generation is coming soon! This feature will create scannable codes for easy form access.
                </Alert>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Future features will include:
                </Typography>
                <List>
                  <ListItem>• Generate QR codes for print materials</ListItem>
                  <ListItem>• Customizable QR code designs with your logo</ListItem>
                  <ListItem>• Downloadable QR codes in multiple formats (PNG, SVG, PDF)</ListItem>
                  <ListItem>• QR code analytics and scan tracking</ListItem>
                  <ListItem>• Dynamic QR codes that can be updated</ListItem>
                </List>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Success Message */}
      {copiedLink && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: 'success.main',
            color: 'white',
            px: 3,
            py: 2,
            borderRadius: 2,
            boxShadow: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <CheckIcon />
          <Typography>Link copied to clipboard!</Typography>
        </Box>
      )}
    </Box>
  );
};