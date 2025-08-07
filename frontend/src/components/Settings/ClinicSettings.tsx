import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Save,
  Business,
  Phone,
  Email,
  Language,
  LocalHospital,
  ColorLens,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store.config';
import axios from 'axios';
import { firebaseAuth } from '../../services/firebaseAuth';

interface ClinicInfo {
  clinic_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  fax?: string;
  email: string;
  website?: string;
  tax_id?: string;
  npi?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

export const ClinicSettings: React.FC = () => {
  const organization = useSelector((state: RootState) => state.auth.organization);
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>({
    clinic_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    fax: '',
    email: '',
    website: '',
    tax_id: '',
    npi: '',
    logo_url: '',
    primary_color: '#2c3e50',
    secondary_color: '#3498db',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (organization?.id) {
      fetchClinicInfo();
    }
  }, [organization?.id]);

  const fetchClinicInfo = async () => {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      const token = await firebaseAuth.getIdToken();
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      
      const response = await axios.get(
        `${apiUrl}/organizations/${organization.id}/clinic-info`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.data && Object.keys(response.data).length > 0) {
        setClinicInfo(response.data);
      }
    } catch (error) {
      console.error('Error fetching clinic info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organization?.id) {
      setMessage({ type: 'error', text: 'Organization ID not found' });
      return;
    }
    
    setSaving(true);
    setMessage(null);
    
    try {
      const token = await firebaseAuth.getIdToken();
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      
      await axios.put(
        `${apiUrl}/organizations/${organization.id}/clinic-info`,
        clinicInfo,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      setMessage({ type: 'success', text: 'Clinic information saved successfully!' });
    } catch (error) {
      console.error('Error saving clinic info:', error);
      setMessage({ type: 'error', text: 'Failed to save clinic information' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ClinicInfo) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setClinicInfo({
      ...clinicInfo,
      [field]: event.target.value,
    });
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (field: 'phone' | 'fax') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const formatted = formatPhoneNumber(event.target.value);
    setClinicInfo({
      ...clinicInfo,
      [field]: formatted,
    });
  };

  if (!organization) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading organization details...
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <LocalHospital sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Clinic Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This information will appear on all generated PDF documents
            </Typography>
          </Box>
        </Box>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Business sx={{ mr: 1 }} />
              Basic Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Clinic Name"
              value={clinicInfo.clinic_name}
              onChange={handleChange('clinic_name')}
              required
              helperText="Your clinic or practice name"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="NPI Number"
              value={clinicInfo.npi}
              onChange={handleChange('npi')}
              helperText="National Provider Identifier"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Business sx={{ mr: 1 }} />
              Address
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address Line 1"
              value={clinicInfo.address_line1}
              onChange={handleChange('address_line1')}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address Line 2"
              value={clinicInfo.address_line2}
              onChange={handleChange('address_line2')}
              placeholder="Suite, Floor, Building (optional)"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="City"
              value={clinicInfo.city}
              onChange={handleChange('city')}
              required
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="State"
              value={clinicInfo.state}
              onChange={handleChange('state')}
              required
              inputProps={{ maxLength: 2 }}
              helperText="Two-letter state code"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="ZIP Code"
              value={clinicInfo.zip_code}
              onChange={handleChange('zip_code')}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Phone sx={{ mr: 1 }} />
              Contact Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone"
              value={clinicInfo.phone}
              onChange={handlePhoneChange('phone')}
              required
              placeholder="(555) 123-4567"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Phone /></InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Fax"
              value={clinicInfo.fax}
              onChange={handlePhoneChange('fax')}
              placeholder="(555) 123-4568"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={clinicInfo.email}
              onChange={handleChange('email')}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start"><Email /></InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Website"
              value={clinicInfo.website}
              onChange={handleChange('website')}
              placeholder="https://www.yourclinic.com"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Language /></InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tax ID"
              value={clinicInfo.tax_id}
              onChange={handleChange('tax_id')}
              helperText="Federal Tax Identification Number"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <ColorLens sx={{ mr: 1 }} />
              Branding (Optional)
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Logo URL"
              value={clinicInfo.logo_url}
              onChange={handleChange('logo_url')}
              placeholder="https://your-logo-url.com/logo.png"
              helperText="URL to your clinic logo image"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Primary Color"
              type="color"
              value={clinicInfo.primary_color || '#2c3e50'}
              onChange={handleChange('primary_color')}
              helperText="Header background color"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Secondary Color"
              type="color"
              value={clinicInfo.secondary_color || '#3498db'}
              onChange={handleChange('secondary_color')}
              helperText="Accent color"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          >
            {saving ? 'Saving...' : 'Save Clinic Information'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};