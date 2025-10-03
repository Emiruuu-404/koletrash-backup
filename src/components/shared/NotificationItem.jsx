import React from 'react';
import { Card, CardContent, Stack, Avatar, Box, Typography, Chip, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function NotificationItem({
  icon,
  title,
  description,
  createdAt,
  priorityLabel,
  priorityColor,
  isRead,
  onClick,
  onDelete,
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        border: '1px solid #e5e7eb',
        bgcolor: isRead ? 'grey.50' : 'white',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }} alignItems="flex-start">
          <Avatar
            sx={{
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              bgcolor: 'white',
              border: '2px solid #e5e7eb',
              color: '#6b7280',
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={{ xs: 1, sm: 1 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={isRead ? 'normal' : 'bold'}
                  sx={{ mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={title}
                >
                  {title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 1,
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: { xs: 3, sm: 2 },
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {description}
                </Typography>
                <Box sx={{
                  display: 'inline-block',
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: '#e2e8f0', // slate-200
                  color: '#475569', // slate-600
                  fontSize: 11,
                }}>
                  {createdAt}
                </Box>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                {onDelete && (
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fef2f2', color: '#dc2626' } }}
                    aria-label="Delete notification"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}




