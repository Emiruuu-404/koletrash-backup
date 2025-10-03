import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  IconButton,
  Box,
  Avatar,
  Stack,
  Divider,
  Badge,
  Paper,
  Tooltip,
  ButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  NotificationsNone as NotificationsNoneIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  PriorityHigh as PriorityHighIcon,
  Home as HomeIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  MarkEmailRead as MarkEmailReadIcon,
} from '@mui/icons-material';

const API_BASE_URL = 'https://koletrash.systemproj.com/backend/api';

const initialNotifications = [];

// Transform notifications for resident context
const transformNotification = (notif, index) => ({
  ...notif,
  type: getResidentType(index),
  priority: getResidentPriority(index),
});

function getResidentType(index) {
  const types = ['schedule', 'reminder', 'event', 'iec', 'system', 'feedback', 'pickup', 'meeting', 'weather', 'welcome'];
  return types[index % types.length];
}

function getResidentPriority(index) {
  const priorities = ['high', 'medium', 'low', 'medium', 'high', 'low', 'medium', 'medium', 'high', 'low'];
  return priorities[index % priorities.length];
}

export default function ResidentNotifications() {
  const [openModal, setOpenModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch from backend
  useEffect(() => {
    const uid = localStorage.getItem('user_id') || JSON.parse(localStorage.getItem('user') || 'null')?.user_id;
    if (!uid) { setLoading(false); return; }
    setLoading(true);
    fetch(`${API_BASE_URL}/get_notifications.php?recipient_id=${uid}`)
      .then(res => res.json())
      .then(data => {
        if (data?.success) setNotifications(data.notifications || []);
        else { setNotifications([]); setError(data?.message || 'Failed to load notifications'); }
      })
      .catch(()=>{ setNotifications([]); setError('Failed to load notifications'); })
      .finally(()=> setLoading(false));
  }, []);

  // Transform notifications for resident context (parse JSON payloads)
  const residentNotifications = notifications.map((notif, index) => {
    let parsed = null;
    try { parsed = JSON.parse(notif.message); } catch { parsed = null; }
    if (parsed && parsed.type === 'truck_full_alert') {
      return transformNotification({
        id: notif.notification_id,
        title: 'Truck is full – temporary delay',
        message: `${parsed.barangay_name ? parsed.barangay_name + ': ' : ''}The truck is heading to landfill. Collection may be delayed.${parsed.note ? ' Note: ' + parsed.note : ''}`,
        time: new Date(notif.created_at).toLocaleString(),
        read: notif.response_status === 'read',
      }, index);
    }
    if (parsed && parsed.type === 'daily_assignments' && Array.isArray(parsed.assignments)) {
      const list = parsed.assignments.map(a => {
        const time = a.time ? a.time.slice(0,5) : '';
        const brgy = a.barangay || a.barangay_name || 'Barangay';
        const cluster = a.cluster ? ` (${a.cluster})` : '';
        return `${time} • ${brgy}${cluster}`;
      });
      return transformNotification({
        id: notif.notification_id,
        title: `Daily Assignments • ${parsed.date || ''}`.trim(),
        message: list.length ? `${list.length} stops:\n` + list.join('\n') : 'No assignments.',
        time: new Date(notif.created_at).toLocaleString(),
        read: notif.response_status === 'read',
      }, index);
    }
    // Fallback: show raw message
    return transformNotification({
      id: notif.notification_id,
      title: 'Notification',
      message: (parsed && parsed.message) ? parsed.message : (notif.message || ''),
      time: new Date(notif.created_at).toLocaleString(),
      read: notif.response_status === 'read',
    }, index);
  });

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => n.response_status !== 'read');
    setNotifications(prev => prev.map(n => ({ ...n, response_status: 'read' })));
    for (const n of unread) {
      try {
        await fetch(`${API_BASE_URL}/mark_notification_read.php`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ notification_id: n.notification_id }) });
      } catch {}
    }
  };

  const deleteNotification = async (id) => {
    setNotifications(prev => prev.filter(n => (n.notification_id || n.id) !== id));
    try {
      await fetch(`${API_BASE_URL}/delete_notification.php`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ notification_id: id }) });
    } catch {}
  };

  const getNotificationIcon = (type) => {
    const iconProps = { fontSize: 'small' };
    switch (type) {
      case 'schedule': return <ScheduleIcon sx={{ color: '#059669' }} {...iconProps} />;
      case 'reminder': return <InfoIcon sx={{ color: '#10b981' }} {...iconProps} />;
      case 'event': return <EventIcon sx={{ color: '#7c3aed' }} {...iconProps} />;
      case 'iec': return <SchoolIcon sx={{ color: '#16a34a' }} {...iconProps} />;
      case 'system': return <HomeIcon sx={{ color: '#6b7280' }} {...iconProps} />;
      case 'feedback': return <AssessmentIcon sx={{ color: '#f59e0b' }} {...iconProps} />;
      case 'pickup': return <InfoIcon sx={{ color: '#059669' }} {...iconProps} />;
      case 'meeting': return <EventIcon sx={{ color: '#7c3aed' }} {...iconProps} />;
      case 'weather': return <WarningIcon sx={{ color: '#dc2626' }} {...iconProps} />;
      case 'welcome': return <HomeIcon sx={{ color: '#10b981' }} {...iconProps} />;
      default: return <NotificationsNoneIcon sx={{ color: '#6b7280' }} {...iconProps} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'schedule': return '#059669'; // emerald-600
      case 'reminder': return '#10b981'; // emerald-500
      case 'event': return '#7c3aed'; // violet-600
      case 'iec': return '#16a34a'; // green-600
      case 'system': return '#6b7280'; // gray-500
      case 'feedback': return '#f59e0b'; // amber-500
      case 'pickup': return '#059669'; // emerald-600
      case 'meeting': return '#7c3aed'; // violet-600
      case 'weather': return '#dc2626'; // red-600
      case 'welcome': return '#10b981'; // emerald-500
      default: return '#6b7280'; // gray-500
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '100%', width: '100%', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
          Notifications
        </Typography>
      </Box>

      {/* Filter Section */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<MarkEmailReadIcon />}
          onClick={markAllAsRead}
          disabled={!residentNotifications.some(n => !n.read)}
          sx={{ 
            borderRadius: 2,
            bgcolor: '#059669',
            '&:hover': { bgcolor: '#047857' },
            '&:disabled': { bgcolor: '#9ca3af' },
            minWidth: 160,
            boxShadow: 'none',
            fontSize: 14,
            px: 2,
            py: 1
          }}
        >
          Mark all as read
        </Button>
      </Box>

      {/* Notifications List */}
      <Stack spacing={2}>
        {loading && (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: '#f0fdf4', borderRadius: 2, border: '2px dashed #bbf7d0' }}>
            <Typography>Loading notifications…</Typography>
          </Paper>
        )}
        {error && (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: '#fef2f2', borderRadius: 2, border: '2px dashed #fecaca' }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        )}
        {!loading && !error && residentNotifications.map(notification => (
          <Card 
            key={notification.id}
            variant="outlined" 
            sx={{ 
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              bgcolor: notification.read ? 'grey.50' : 'white',
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)'
              }
            }}
            onClick={() => {
              setSelectedNotification(notification);
              setOpenModal(true);
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }} alignItems="flex-start">
                {/* Icon */}
                <Avatar 
                  sx={{ 
                    width: { xs: 36, sm: 40 }, 
                    height: { xs: 36, sm: 40 }, 
                    bgcolor: 'white',
                    border: '2px solid #e0e0e0',
                    color: '#6b7280'
                  }}
                >
                  {getNotificationIcon('default')}
                </Avatar>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="subtitle1" 
                        fontWeight={notification.read ? 'normal' : 'bold'}
                        sx={{ mb: 0.5 }}
                      >
                        {notification.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ mb: 1, lineHeight: 1.4 }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {notification.time}
                      </Typography>
                    </Box>

                    {/* Priority and Actions */}
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={notification.priority.toUpperCase()}
                        size="small"
                        sx={{
                          fontWeight: 'bold',
                          minWidth: 60,
                          ...(notification.priority === 'high' && {
                            bgcolor: '#dc2626',
                            color: 'white'
                          }),
                          ...(notification.priority === 'medium' && {
                            bgcolor: '#f59e0b',
                            color: 'white'
                          }),
                          ...(notification.priority === 'low' && {
                            bgcolor: '#16a34a',
                            color: 'white'
                          })
                        }}
                      />
                      <Tooltip title="Delete notification">
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          sx={{ 
                            color: '#dc2626',
                            '&:hover': { bgcolor: '#fef2f2', color: '#dc2626' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}

        {!loading && !error && residentNotifications.length === 0 && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              textAlign: 'center', 
              bgcolor: '#f0fdf4', 
              borderRadius: 2,
              border: '2px dashed #bbf7d0'
            }}
          >
            <NotificationsNoneIcon sx={{ fontSize: 60, color: '#6b7280', mb: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ color: '#374151' }}>
              No notifications found
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              You're all caught up! 🎉
            </Typography>
          </Paper>
        )}
      </Stack>

      {/* Modal for notification details (match screenshot style) */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: 6 } }}>
        <Box sx={{ bgcolor: 'white', borderRadius: 3, overflow: 'hidden', p: 0, minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {/* Green header with title */}
          <Box sx={{ width: '100%', bgcolor: '#059669', py: 2, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, fontSize: 20, textAlign: 'center', letterSpacing: 0.5 }}>
              {selectedNotification?.title}
            </Typography>
          </Box>
          {/* Message and time */}
          <Box sx={{ width: '100%', px: 3, py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" sx={{ color: '#374151', mb: 2, textAlign: 'center', fontSize: 16, fontWeight: 500 }}>
              {selectedNotification?.message}
            </Typography>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#f59e0b', fontSize: 15, fontWeight: 600, textAlign: 'center', px: 2, py: 0.5, borderRadius: 2, bgcolor: '#fef3c7', display: 'inline-block' }}>
                {selectedNotification?.time}
              </Typography>
            </Box>
          </Box>
          {/* Close button */}
          <DialogActions sx={{ width: '100%', bgcolor: 'white', justifyContent: 'center', p: 2, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
            <Button onClick={() => setOpenModal(false)} sx={{ color: 'white', bgcolor: '#059669', fontWeight: 700, fontSize: 16, px: 5, py: 1.2, borderRadius: 2, textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#047857' } }}>
              Close
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
