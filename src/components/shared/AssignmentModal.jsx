import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Divider } from '@mui/material';

export default function AssignmentModal({
  open,
  title,
  message,
  isDaily,
  assignments = [],
  date,
  onAccept,
  onDecline,
  onClose,
  acceptAllLabel = 'Accept All',
  declineAllLabel = 'Decline All',
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, py: 2.25 }}>{title}</DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.25 }}>
        {isDaily ? (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              You have {assignments?.length || 0} assignments for {date}.
            </Typography>
            <Box
              component="ul"
              sx={{
                m: 0,
                pl: 2,
                pr: 1,
                maxHeight: 220,
                overflowY: 'auto',
                color: 'text.secondary',
              }}
            >
              {(assignments || [])
                .slice()
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                .slice(0, 10)
                .map((a, i) => (
                  <li key={i}>
                    {a.time} – {a.barangay}
                  </li>
                ))}
              {assignments?.length > 10 && (
                <li>+{assignments.length - 10} more…</li>
              )}
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="text.primary" gutterBottom>
            {message}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2.25 }}>
        <Box sx={{ display: 'flex', gap: 1, width: '100%', flexWrap: 'wrap' }}>
          {isDaily ? (
            <>
              <Button fullWidth variant="contained" color="success" onClick={onAccept}>{acceptAllLabel}</Button>
              <Button fullWidth variant="outlined" color="error" onClick={onDecline}>{declineAllLabel}</Button>
            </>
          ) : (
            <>
              <Button fullWidth variant="contained" color="success" onClick={onAccept}>Accept</Button>
              <Button fullWidth variant="outlined" color="error" onClick={onDecline}>Decline</Button>
            </>
          )}
          <Button fullWidth onClick={onClose}>Close</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}


