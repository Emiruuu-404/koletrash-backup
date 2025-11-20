import React, { useState, useEffect, useCallback } from 'react';
import { FiEye, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiFilter, FiRefreshCw, FiImage, FiCalendar, FiUser, FiMapPin, FiTag, FiSearch, FiPrinter, FiX, FiExternalLink } from 'react-icons/fi';
import axios from 'axios';
import { buildApiUrl } from '../../config/api';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('access_token');
  } catch (err) {
    console.warn('Unable to read access token', err);
    return null;
  }
};

const getAuthHeaders = (extra = {}) => {
  const token = getAuthToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

const API_BASE_URL = buildApiUrl();

export default function Issues() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoLoadError, setPhotoLoadError] = useState(false);

  const backendBaseUrl = API_BASE_URL.replace(/\/api\/?$/, '/');

  const buildAbsoluteUrl = useCallback((base, path) => {
    if (!base || !path) return null;
    const sanitizedBase = base.replace(/\/+$/, '');
    const sanitizedPath = path.replace(/^\/+/, '');
    return `${sanitizedBase}/${sanitizedPath}`;
  }, []);

  const resolvePhotoUrl = useCallback((rawUrl) => {
    if (!rawUrl) return null;
    const trimmed = String(rawUrl).trim();
    if (!trimmed) return null;

    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

    try {
      const parsed = new URL(trimmed);

      if (['localhost', '127.0.0.1'].includes(parsed.hostname)) {
        const sanitizedPath = parsed.pathname.replace(/^\/+/, '').replace(/^koletrash\//i, '');
        const originCandidates = Array.from(new Set([
          currentOrigin,
          backendBaseUrl,
          buildAbsoluteUrl(currentOrigin, 'backend')
        ].filter(Boolean)));

        for (const candidate of originCandidates) {
          if (candidate) {
            return buildAbsoluteUrl(candidate, sanitizedPath);
          }
        }
      }

      return parsed.toString();
    } catch (error) {
      const sanitizedPath = trimmed.replace(/^(\.\/|\/)+/, '');
      const originCandidates = Array.from(new Set([
        currentOrigin,
        backendBaseUrl,
        buildAbsoluteUrl(currentOrigin, 'backend')
      ].filter(Boolean)));

      for (const candidate of originCandidates) {
        if (candidate) {
          return buildAbsoluteUrl(candidate, sanitizedPath);
        }
      }

      return null;
    }
  }, [backendBaseUrl, buildAbsoluteUrl]);

  const openInNewTab = useCallback((url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const openPhotoPreview = useCallback((report) => {
    if (!report) return;
    const resolvedUrl = report.resolutionPhotoUrl || report.resolvedPhotoUrl || null;
    const originalUrl = report.submittedPhotoUrl || resolvePhotoUrl(report.photo_url) || null;

    if (!resolvedUrl && !originalUrl) {
      setPhotoPreview({
        resolvedUrl: null,
        originalUrl: null,
        reporter: report.name,
        issueType: report.issue_type,
        createdAt: report.created_at
      });
      setPhotoLoadError(true);
      return;
    }

    setPhotoLoadError(false);
    setPhotoPreview({
      resolvedUrl,
      originalUrl,
      reporter: report.name,
      issueType: report.issue_type,
      createdAt: report.created_at
    });
  }, [resolvePhotoUrl]);

  const closePhotoPreview = () => {
    setPhotoPreview(null);
    setPhotoLoadError(false);
  };

  // Fetch all issue reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await axios.get(`${buildApiUrl('get_issues.php')}?${params}`, {
        headers: getAuthHeaders(),
      });
      
      if (response.data.status === 'success') {
        const normalizedReports = (response.data.data || []).map((report) => {
          const submittedPhotoUrl = resolvePhotoUrl(report.photo_url);
          const resolutionPhotoUrl = resolvePhotoUrl(report.resolution_photo_url);

          return {
            ...report,
            submittedPhotoUrl,
            resolutionPhotoUrl,
            resolvedPhotoUrl: resolutionPhotoUrl || submittedPhotoUrl,
            resolution_notes: report.resolution_notes || '',
            resolved_by_name: report.resolved_by_name || null,
            resolved_at: report.resolved_at || null
          };
        });

        setReports(normalizedReports);
      } else {
        setError(response.data.message || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to fetch reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterStatus]);

  // Update report status
  const updateReportStatus = async (reportId, newStatus, resolutionNotes = '', resolutionPhoto = null, options = {}) => {
    try {
      setUpdatingStatus(true);
      const { keepExistingPhoto = false } = options;
      
      // If status is resolved and photo is provided, use multipart form data
      if (newStatus === 'resolved' && resolutionPhoto) {
        const formData = new FormData();
        formData.append('issue_id', reportId);
        formData.append('status', newStatus);
        formData.append('resolved_by', 1); // Admin user ID
        formData.append('resolution_notes', resolutionNotes);
        formData.append('resolution_photo', resolutionPhoto);

        const response = await axios.post(`${buildApiUrl('resolve_issue_with_photo.php')}`, formData, {
          headers: getAuthHeaders(),
        });

        if (response.data.status === 'success') {
          setReports(prev => prev.map(report => 
            report.id === reportId 
              ? {
                  ...report,
                  status: newStatus,
                  resolution_notes: resolutionNotes,
                  resolution_photo_url: response.data.data.resolution_photo_url,
                  resolutionPhotoUrl: resolvePhotoUrl(response.data.data.resolution_photo_url),
                  resolvedPhotoUrl: resolvePhotoUrl(response.data.data.resolution_photo_url),
                  resolved_at: response.data.data.updated_at || report.resolved_at
                }
              : report
          ));
          setShowModal(false);
          setSelectedReport(null);
          fetchReports();
        } else {
          setError(response.data.message || 'Failed to resolve issue');
        }
      } else {
        // Use regular JSON endpoint for non-resolved status or no photo
        const response = await axios.post(
          buildApiUrl('update_issue_status.php'),
          {
            issue_id: reportId,
            status: newStatus,
            resolved_by: 1, // Admin user ID
            resolution_notes: resolutionNotes
          },
          {
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          }
        );

        if (response.data.status === 'success') {
          setReports(prev => prev.map(report => {
            if (report.id !== reportId) {
              return report;
            }

            const shouldClearResolution = newStatus !== 'resolved';
            const nextResolutionPhotoPath = shouldClearResolution
              ? null
              : (keepExistingPhoto ? report.resolution_photo_url : report.resolution_photo_url);
            const nextResolutionPhotoUrl = resolvePhotoUrl(nextResolutionPhotoPath);

            return {
              ...report,
              status: newStatus,
              resolution_notes: newStatus === 'resolved' ? resolutionNotes : '',
              resolved_at: newStatus === 'resolved' ? response.data.data.updated_at : null,
              resolution_photo_url: nextResolutionPhotoPath,
              resolutionPhotoUrl: nextResolutionPhotoUrl,
              resolvedPhotoUrl: nextResolutionPhotoUrl || report.submittedPhotoUrl
            };
          }));
          setShowModal(false);
          setSelectedReport(null);
          fetchReports();
        } else {
          setError(response.data.message || 'Failed to update status');
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: FiClock, label: 'Pending' };
      case 'active':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: FiAlertCircle, label: 'Active' };
      case 'resolved':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: FiCheckCircle, label: 'Resolved' };
      case 'closed':
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: FiXCircle, label: 'Closed' };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: FiClock, label: 'Unknown' };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const escapeHtml = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Filter reports based on search term
  const filteredReports = reports.filter(report => 
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.issue_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.barangay.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusCounts = reports.reduce((acc, report) => {
    const statusKey = (report.status || 'active').toLowerCase();
    const normalizedKey = ['open', 'in-progress', 'in_progress'].includes(statusKey) ? 'active' : statusKey;
    if (normalizedKey in acc) {
      acc[normalizedKey] += 1;
    } else {
      acc.other += 1;
    }
    acc.total += 1;
    return acc;
  }, { total: 0, pending: 0, active: 0, resolved: 0, closed: 0, other: 0 });

  const handlePrintReports = () => {
    if (typeof window === 'undefined') {
      return;
    }

    if (filteredReports.length === 0) {
      alert('No reports available to print with the current filters.');
      return;
    }

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=650');

    if (!printWindow) {
      alert('Please allow pop-ups to print the reports.');
      return;
    }

    const printedAt = new Date();
    const printedAtLabel = printedAt.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const appliedFiltersSegments = [];
    if (filterStatus !== 'all') {
      appliedFiltersSegments.push(`Status: ${escapeHtml(filterStatus)}`);
    }
    if (searchTerm) {
      appliedFiltersSegments.push(`Search: &ldquo;${escapeHtml(searchTerm)}&rdquo;`);
    }
    const appliedFilters = appliedFiltersSegments.join(' • ');

    const rowsHtml = filteredReports.map((report, index) => {
      const statusInfo = getStatusInfo(report.status);
      const statusLabel = statusInfo.label;
      const submittedAt = formatDate(report.created_at);
      const resolvedAt = report.resolved_at ? formatDate(report.resolved_at) : '—';
      const description = escapeHtml(report.description).replace(/\n/g, '<br />');
      const resolutionNotes = report.resolution_notes
        ? escapeHtml(report.resolution_notes).replace(/\n/g, '<br />')
        : '—';
      const reporterName = escapeHtml(report.name);
      const barangayName = escapeHtml(report.barangay);
      const issueType = escapeHtml(report.issue_type);
      const submittedPhotoLink = report.submittedPhotoUrl
        ? `<div class="link-row">Submitted photo: <a href="${escapeHtml(report.submittedPhotoUrl)}" target="_blank" rel="noopener">View</a></div>`
        : '';
      const resolutionPhotoLink = report.resolutionPhotoUrl
        ? `<div class="link-row">Resolution photo: <a href="${escapeHtml(report.resolutionPhotoUrl)}" target="_blank" rel="noopener">View</a></div>`
        : '';

      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${reporterName}</strong>
            <div class="small">${barangayName}</div>
          </td>
          <td>${issueType}</td>
          <td>${escapeHtml(statusLabel)}</td>
          <td>
            <div>${escapeHtml(submittedAt)}</div>
            ${report.resolved_at ? `<div class="small">Resolved: ${escapeHtml(resolvedAt)}</div>` : ''}
          </td>
          <td>${description}${submittedPhotoLink || resolutionPhotoLink ? `<div class="link-wrapper">${submittedPhotoLink}${resolutionPhotoLink}</div>` : ''}</td>
          <td>${resolutionNotes}</td>
        </tr>
      `;
    }).join('');

    const summaryCards = `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Total Reports</div>
          <div class="summary-value">${statusCounts.total}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Pending</div>
          <div class="summary-value">${statusCounts.pending}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Active</div>
          <div class="summary-value">${statusCounts.active}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Resolved</div>
          <div class="summary-value">${statusCounts.resolved}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Closed</div>
          <div class="summary-value">${statusCounts.closed}</div>
        </div>
        ${statusCounts.other > 0 ? `
          <div class="summary-card">
            <div class="summary-label">Other Status</div>
            <div class="summary-value">${statusCounts.other}</div>
          </div>
        ` : ''}
      </div>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Issue Reports - Printable Summary</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; color: #111827; margin: 0; padding: 32px; background: #f9fafb; }
            h1 { margin: 0 0 4px; font-size: 28px; color: #047857; }
            h2 { font-size: 16px; color: #374151; margin: 0; }
            .meta { margin-top: 4px; font-size: 12px; color: #6b7280; }
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin: 24px 0; }
            .summary-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; box-shadow: inset 0 0 0 1px rgba(4, 120, 87, 0.05); }
            .summary-label { font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; }
            .summary-value { margin-top: 8px; font-size: 20px; font-weight: 700; color: #111827; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; background: #ffffff; }
            thead { background: #ecfdf5; }
            th, td { border: 1px solid #e5e7eb; padding: 10px 12px; font-size: 13px; vertical-align: top; }
            th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #047857; }
            td { color: #1f2937; }
            tr:nth-child(even) { background: #f9fafb; }
            .small { font-size: 11px; color: #6b7280; margin-top: 4px; }
            .link-wrapper { margin-top: 8px; }
            .link-row { font-size: 11px; margin-top: 4px; }
            a { color: #047857; text-decoration: none; }
            a:hover { text-decoration: underline; }
            @media print {
              body { background: #ffffff; }
              .summary-card { box-shadow: none; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <h1>KolekTrash Issue Reports</h1>
          <div class="meta">Printed on ${escapeHtml(printedAtLabel)}${appliedFilters ? ` • Filters: ${appliedFilters}` : ''}</div>
          ${summaryCards}
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Reporter</th>
                <th>Issue Type</th>
                <th>Status</th>
                <th>Timeline</th>
                <th>Description & Evidence</th>
                <th>Resolution Notes</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 200);
  };

  // Status update modal
  const StatusUpdateModal = () => {
    if (!selectedReport) return null;

    const [newStatus, setNewStatus] = useState(selectedReport.status);
    const initialResolutionPhotoUrl = selectedReport.resolutionPhotoUrl || null;
    const [resolutionNotes, setResolutionNotes] = useState(selectedReport.resolution_notes || '');
    const [resolutionPhoto, setResolutionPhoto] = useState(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState(initialResolutionPhotoUrl);
    const [useExistingPhoto, setUseExistingPhoto] = useState(Boolean(initialResolutionPhotoUrl));

    const normalizedIssueType = (selectedReport.issue_type || '').trim().toLowerCase();
    const isProofOptional = normalizedIssueType === 'rude or unprofessional service from collectors';
    const requiresResolutionProof = newStatus === 'resolved' && !isProofOptional;

    const handleOpenExistingProof = () => {
      if (initialResolutionPhotoUrl) {
        openInNewTab(initialResolutionPhotoUrl);
      }
    };

    const handlePhotoChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setResolutionPhoto(file);
        setUseExistingPhoto(false);
        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      }
    };

    const removePhoto = () => {
      if (resolutionPhoto) {
        setResolutionPhoto(null);
        if (initialResolutionPhotoUrl) {
          setPhotoPreviewUrl(initialResolutionPhotoUrl);
          setUseExistingPhoto(true);
        } else {
          setPhotoPreviewUrl(null);
          setUseExistingPhoto(false);
        }
      } else if (useExistingPhoto) {
        setPhotoPreviewUrl(null);
        setUseExistingPhoto(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Update Issue Status</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Issue Type</label>
              <p className="text-gray-900 font-medium">{selectedReport.issue_type}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reporter</label>
              <p className="text-gray-900">{selectedReport.name} - {selectedReport.barangay}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <p className="text-gray-600 text-sm">{selectedReport.description}</p>
            </div>

            {(selectedReport.resolution_notes || initialResolutionPhotoUrl) && (
              <div className="mb-4 border border-green-200 bg-green-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-700">Current resolution details</p>
                {selectedReport.resolution_notes && (
                  <p className="mt-2 text-sm text-green-800 whitespace-pre-line">{selectedReport.resolution_notes}</p>
                )}
                {(selectedReport.resolved_by_name || selectedReport.resolved_at) && (
                  <p className="mt-2 text-xs text-green-700">
                    {selectedReport.resolved_by_name ? `Resolved by ${selectedReport.resolved_by_name}` : 'Resolved'}
                    {selectedReport.resolved_at ? ` • ${formatDate(selectedReport.resolved_at)}` : ''}
                  </p>
                )}
                {initialResolutionPhotoUrl && (
                  <button
                    type="button"
                    onClick={handleOpenExistingProof}
                    className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-green-700 hover:text-green-900"
                  >
                    <FiExternalLink className="w-4 h-4" /> View current proof
                  </button>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {newStatus === 'resolved' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Photo
                  {requiresResolutionProof ? (
                    <>
                      {' '}<span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 ml-1">(Proof that issue is resolved)</span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-500 ml-1">(Optional for this issue type)</span>
                  )}
                </label>
                
                {!photoPreviewUrl ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FiImage className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500">Click to upload resolution photo</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img 
                      src={photoPreviewUrl} 
                      alt="Resolution preview" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <span className="absolute left-3 top-3 px-2 py-1 rounded-full text-xs font-semibold text-white bg-green-600/80">
                      {resolutionPhoto ? 'New upload' : 'Current proof'}
                    </span>
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {requiresResolutionProof && !resolutionPhoto && !useExistingPhoto && (
                  <p className="mt-2 text-xs text-red-500">Attach a proof photo before marking this issue as resolved.</p>
                )}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Resolution Notes</label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Add notes about the resolution..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => updateReportStatus(
                  selectedReport.id,
                  newStatus,
                  resolutionNotes,
                  resolutionPhoto,
                  { keepExistingPhoto: useExistingPhoto && !resolutionPhoto }
                )}
                disabled={updatingStatus || (requiresResolutionProof && !resolutionPhoto && !useExistingPhoto)}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedReport(null);
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-full p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-green-700 font-medium">Loading issue reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-700 mb-2">Issue Reports</h1>
        <p className="text-gray-600">Manage and track all issue reports from residents and barangay heads</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-64"
            />
          </div>
          
          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        
        <div className="flex gap-3">
          {/* Refresh */}
          <button
            onClick={fetchReports}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <FiRefreshCw className="w-5 h-5" />
            Refresh
          </button>
          
          {/* Export */}
          <button
            onClick={handlePrintReports}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <FiPrinter className="w-5 h-5" />
            Print Reports
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
          <FiAlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
            <FiAlertCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{reports.filter(r => r.status === 'pending').length}</p>
            </div>
            <FiClock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{reports.filter(r => r.status === 'resolved').length}</p>
            </div>
            <FiCheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Closed</p>
              <p className="text-2xl font-bold text-gray-600">{reports.filter(r => r.status === 'closed').length}</p>
            </div>
            <FiXCircle className="w-8 h-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <FiAlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'No reports match your search criteria.' : 'No issue reports found.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barangay</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => {
                  const statusInfo = getStatusInfo(report.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <FiUser className="w-5 h-5 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{report.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{report.issue_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FiMapPin className="w-4 h-4 text-gray-400 mr-1" />
                          {report.barangay}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiCalendar className="w-4 h-4 text-gray-400 mr-1" />
                          {formatDate(report.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowModal(true);
                            }}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                          >
                            <FiEye className="w-4 h-4" />
                            View
                          </button>
                          {(report.photo_url || report.resolvedPhotoUrl) && (
                            <button
                              onClick={() => openPhotoPreview(report)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            >
                              <FiImage className="w-4 h-4" />
                              Photo
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {photoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden animate-fadeIn">
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Issue Photo</h2>
                <p className="text-sm text-gray-500">
                  {photoPreview.issueType ? `${photoPreview.issueType} • ` : ''}
                  {photoPreview.reporter || 'Reporter'}
                  {photoPreview.createdAt ? ` • ${formatDate(photoPreview.createdAt)}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={closePhotoPreview}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close photo preview"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 flex items-center justify-center p-6 min-h-[320px]">
              {!photoLoadError && photoPreview.resolvedUrl ? (
                <img
                  src={photoPreview.resolvedUrl}
                  alt={photoPreview.issueType || 'Issue report photo'}
                  className="max-h-[70vh] max-w-full rounded-xl shadow-md"
                  onError={() => setPhotoLoadError(true)}
                />
              ) : (
                <div className="text-center space-y-3">
                  <FiAlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-gray-800">Photo preview unavailable</h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                      We couldn&apos;t load the preview image. You can still open the original attachment using the buttons below if it&apos;s available.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-t border-gray-100 bg-white">
              {photoPreview.resolvedUrl && !photoLoadError && (
                <button
                  type="button"
                  onClick={() => openInNewTab(photoPreview.resolvedUrl)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <FiExternalLink className="w-4 h-4" />
                  Open in new tab
                </button>
              )}

              {photoPreview.originalUrl && (
                <button
                  type="button"
                  onClick={() => openInNewTab(photoPreview.originalUrl)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FiExternalLink className="w-4 h-4" />
                  Open original link
                </button>
              )}

              <button
                type="button"
                onClick={closePhotoPreview}
                className="ml-auto px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showModal && <StatusUpdateModal />}
    </div>
  );
}


