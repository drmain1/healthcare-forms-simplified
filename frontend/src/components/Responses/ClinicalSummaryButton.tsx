
import React, { useState } from 'react';
import { Button, Modal, Box, Typography, CircularProgress, Alert, IconButton } from '@mui/material';
import { ContentCopy, Close } from '@mui/icons-material';
import { useLazyGetClinicalSummaryQuery } from '../../store/api/responsesApi';

interface ClinicalSummaryButtonProps {
  responseId: string;
}

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export const ClinicalSummaryButton: React.FC<ClinicalSummaryButtonProps> = ({ responseId }) => {
  const [open, setOpen] = useState(false);
  const [getSummary, { data, isLoading, error }] = useLazyGetClinicalSummaryQuery();

  const handleOpen = () => {
    setOpen(true);
    getSummary(responseId);
  };

  const handleClose = () => setOpen(false);

  const handleCopy = () => {
    if (data) {
      navigator.clipboard.writeText(data.summary);
    }
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        AI Clinical Summary
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="clinical-summary-modal-title"
        aria-describedby="clinical-summary-modal-description"
      >
        <Box sx={style}>
          <Typography id="clinical-summary-modal-title" variant="h6" component="h2">
            AI Clinical Summary
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
          <Box id="clinical-summary-modal-description" sx={{ mt: 2 }}>
            {isLoading && <CircularProgress />}
            {error && <Alert severity="error">Failed to load summary.</Alert>}
            {data && (
              <>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{data.summary}</Typography>
                <Button onClick={handleCopy} startIcon={<ContentCopy />} sx={{ mt: 2 }}>
                  Copy Summary
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Modal>
    </>
  );
};
