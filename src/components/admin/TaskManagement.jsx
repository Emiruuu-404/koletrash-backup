import React, { useState, useEffect } from 'react';
import { FiUser, FiCalendar, FiClock, FiCheckCircle, FiTrash2, FiChevronDown, FiCheck, FiSend, FiUsers } from 'react-icons/fi';
import { FaUserTie, FaUserFriends, FaTimes } from 'react-icons/fa';
import Select from 'react-select';
import { buildApiUrl } from '../../config/api';

const getAuthToken = () => {
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

// Fix default marker icon issue with leaflet in React
// Map removed in minimalist redesign

export default function TaskManagement() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [barangayList, setBarangayList] = useState([]);
  const [barangayLoading, setBarangayLoading] = useState(true);
  const [barangayError, setBarangayError] = useState(null);

  // New state for personnel
  const [drivers, setDrivers] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [personnelLoading, setPersonnelLoading] = useState(false);
  const [personnelError, setPersonnelError] = useState(null);
  // New state for trucks
  const [trucks, setTrucks] = useState([]);
  const [trucksLoading, setTrucksLoading] = useState(false);
  const [trucksError, setTrucksError] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState(null);
  const [assignSuccess, setAssignSuccess] = useState(null);

  // Lightweight toast for global notifications
  const [toast, setToast] = useState(null); // { message, type }
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // New: State for selected schedule (for dynamic summary bar)
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // New: State for selected collectors (for react-select)
  const [selectedCollectors, setSelectedCollectors] = useState([]);

  // Auto-generation states
  const [showAutoGenModal, setShowAutoGenModal] = useState(false);
  const [autoGenLoading, setAutoGenLoading] = useState(false);
  const [autoGenError, setAutoGenError] = useState(null);
  const [autoGenSuccess, setAutoGenSuccess] = useState(null);
  const [autoGenResults, setAutoGenResults] = useState(null);

  // Predefined schedule generation states
  const [showPredefinedGenModal, setShowPredefinedGenModal] = useState(false);
  const [predefinedGenLoading, setPredefinedGenLoading] = useState(false);
  const [predefinedGenError, setPredefinedGenError] = useState(null);
  const [predefinedGenSuccess, setPredefinedGenSuccess] = useState(null);
  const [predefinedGenResults, setPredefinedGenResults] = useState(null);
  const [predefinedGenPreview, setPredefinedGenPreview] = useState(null);
  const [predefinedOverwrite, setPredefinedOverwrite] = useState(false);

  // Extract unique clusters from barangayList
  const clusterOptions = Array.from(new Set(barangayList.map(b => b.cluster_id).filter(Boolean)));
  const [selectedCluster, setSelectedCluster] = useState('');

  // Add state and effect for assignments table
  const [allAssignments, setAllAssignments] = useState([]);
  const [allAssignmentsLoading, setAllAssignmentsLoading] = useState(true);

  // Add state for date filter
  const [assignmentDateFilter, setAssignmentDateFilter] = useState('');

  // Add state for cluster filter
  const [assignmentClusterFilter, setAssignmentClusterFilter] = useState('');

  // Advanced filters (Step 3)
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState('');
  const [assignmentDriverFilter, setAssignmentDriverFilter] = useState('');
  const [assignmentTruckFilter, setAssignmentTruckFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [historyFor, setHistoryFor] = useState(null); // assignment object
  const [historyEvents, setHistoryEvents] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Filter assignments by multiple criteria
  const filteredAssignments = allAssignments.filter(a => {
    const dateMatch = assignmentDateFilter ? a.date === assignmentDateFilter : true;
    const clusterMatch = assignmentClusterFilter ? a.cluster === assignmentClusterFilter : true;
    const statusMatch = assignmentStatusFilter ? (a.status || '').toLowerCase() === assignmentStatusFilter.toLowerCase() : true;
    const driverName = a.driver ? (a.driver.name || a.driver.username || '') : '';
    const driverMatch = assignmentDriverFilter.trim() ? driverName.toLowerCase().includes(assignmentDriverFilter.toLowerCase()) : true;
    const truckStr = a.truck_plate || '';
    const truckMatch = assignmentTruckFilter.trim() ? truckStr.toLowerCase().includes(assignmentTruckFilter.toLowerCase()) : true;
    return dateMatch && clusterMatch && statusMatch && driverMatch && truckMatch;
  });

  // Pagination (client-side for now)
  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedAssignments = filteredAssignments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [assignmentDateFilter, assignmentClusterFilter, assignmentStatusFilter, assignmentDriverFilter, assignmentTruckFilter, pageSize]);

  const isSelected = (id) => selectedIds.includes(id);
  const toggleSelect = (id) => setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const selectAllOnPage = (checked) => {
    if (checked) setSelectedIds(prev => Array.from(new Set([...prev, ...paginatedAssignments.map(a => a.assignment_id)])));
    else setSelectedIds(prev => prev.filter(id => !paginatedAssignments.some(a => a.assignment_id === id)));
  };
  const clearSelection = () => setSelectedIds([]);

  // Add state for schedules from collection_schedule
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [schedulesError, setSchedulesError] = useState(null);

  // Add state for last refresh time
  const [lastRefresh, setLastRefresh] = useState(null);

  // Manual refresh function
  const refreshAssignments = async () => {
    setAllAssignmentsLoading(true);
    try {
      const res = await fetch(buildApiUrl('get_all_task_assignments.php'), {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setAllAssignments(data.assignments);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to refresh assignments:', error);
    } finally {
      setAllAssignmentsLoading(false);
    }
  };

  // Global reassign: trigger backend cron endpoint to reassign all declined for the day
  const handleReassignAll = async () => {
    try {
      const res = await fetch('https://koletrash.systemproj.com/backend/cron_auto_reassign_declined_fixed.php?token=koletrash_auto_generate_2024', { method: 'GET' });
      let data = {};
      try { data = await res.json(); } catch (_) { /* ignore parse errors */ }
      if (res.ok && (data.success === undefined || data.success === true)) {
        showToast('Reassignment triggered successfully', 'success');
      } else {
        showToast(data.message || 'Reassignment trigger failed', 'info');
      }
    } catch (e) {
      showToast('Network error while triggering reassignment', 'info');
    } finally {
      await refreshAssignments();
    }
  };

  // (layout only) No changes to sidebars or live map per request

  // Fetch barangays from backend
  useEffect(() => {
    setBarangayLoading(true);
    fetch(buildApiUrl('get_barangays.php'), { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBarangayList(Array.isArray(data.barangays) ? data.barangays : []);
          if (Array.isArray(data.barangays) && data.barangays.length > 0) setSelected(data.barangays[0]);
          setBarangayError(null);
        } else {
          setBarangayList([]);
          setBarangayError(data.message || 'Failed to fetch barangays.');
        }
      })
      .catch((err) => {
        setBarangayList([]);
        setBarangayError('Failed to fetch barangays.');
      })
      .finally(() => setBarangayLoading(false));
  }, []);

  useEffect(() => {
    fetch(buildApiUrl('get_all_task_assignments.php'), { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAllAssignments(data.assignments);
        }
        setAllAssignmentsLoading(false);
      });
  }, []);

  // Auto-refresh assignments every 30 seconds to reflect personnel responses
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(buildApiUrl('get_all_task_assignments.php'), { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAllAssignments(data.assignments);
            setLastRefresh(new Date());
          }
        })
        .catch(() => {
          // Silently fail for auto-refresh
        });
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);


  // Add this useEffect after allAssignments and selected states are defined
  useEffect(() => {
    if (selected && allAssignments.length > 0) {
      // Try to find assignment by barangay_id
      let assignments = allAssignments
        .filter(a => a.barangay_id === selected.barangay_id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      // If none, fallback to cluster
      if (assignments.length === 0 && selected.cluster_id) {
        assignments = allAssignments
          .filter(a => a.cluster === selected.cluster_id)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      if (assignments.length > 0) {
        const latest = assignments[0];
        setSelectedSchedule({
          driver: latest.driver || null,
          collectors: latest.collectors?.slice(0, 3) || [],
          date: latest.date,
          time: latest.time,
          status: latest.status,
          waste_collected: latest.waste_collected || '',
          truck_plate: latest.truck_plate || '',
          truck_type: latest.truck_type || '',
          truck_capacity: latest.truck_capacity || '',
          // IDs needed by actions
          team_id: latest.team_id || latest.assignment_id || latest.teamId || latest.team?.id || null,
          schedule_id: latest.schedule_id || latest.scheduleId || null,
        });
      } else {
        setSelectedSchedule(null);
      }
    } else {
      setSelectedSchedule(null);
    }
  }, [selected, allAssignments]);

  // Filter for schedule table: show assignments where driver and all collectors are accepted or confirmed
  const allAcceptedAssignments = allAssignments.filter(a => {
    // Driver must be accepted or confirmed
    if (!a.driver || (a.driver.status !== 'accepted' && a.driver.status !== 'confirmed')) return false;
    // All collectors must be accepted or confirmed
    if (!a.collectors || a.collectors.length === 0) return false;
    return a.collectors.every(c => c.status === 'accepted' || c.status === 'confirmed');
  });

  // Debug logs
  console.log('allAssignments', allAssignments);
  console.log('allAcceptedAssignments', allAcceptedAssignments);
  if (allAssignments.length > 0) {
    console.log('Sample assignment:', allAssignments[0]);
  }

  // Modal open handler (fetch personnel and trucks)
  const handleAssign = (data) => {
    setModalData(data);
    setShowModal(true);
    setPersonnelLoading(true);
    setPersonnelError(null);
    setTrucksLoading(true);
    setTrucksError(null);
    // Set default cluster if available
    if (selected && selected.cluster_id) setSelectedCluster(selected.cluster_id);
    // Reset selected collectors
    setSelectedCollectors([]);
    // Fetch personnel
    fetch(buildApiUrl('get_personnel.php'), { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDrivers(Array.isArray(data.truck_drivers) ? data.truck_drivers : []);
          setCollectors(Array.isArray(data.garbage_collectors) ? data.garbage_collectors : []);
          setPersonnelError(null);
        } else {
          setDrivers([]);
          setCollectors([]);
          setPersonnelError(data.message || 'Failed to fetch personnel.');
        }
      })
      .catch(() => {
        setDrivers([]);
        setCollectors([]);
        setPersonnelError('Failed to fetch personnel.');
      })
      .finally(() => setPersonnelLoading(false));
    // Fetch trucks
    fetch(buildApiUrl('get_trucks.php'), { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTrucks(Array.isArray(data.trucks) ? data.trucks : []);
          setTrucksError(null);
        } else {
          setTrucks([]);
          setTrucksError(data.message || 'Failed to fetch trucks.');
        }
      })
      .catch(() => {
        setTrucks([]);
        setTrucksError('Failed to fetch trucks.');
      })
      .finally(() => setTrucksLoading(false));
  };

  // Modal close handler
  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
    setAssignError(null);
    setAssignSuccess(null);
  };

  // Filtered barangays for sidebar
  const filteredBarangays = (filter.trim() === ''
    ? barangayList.slice(0, 10)
    : barangayList.filter(b => b.barangay_name.toLowerCase().includes(filter.toLowerCase())).slice(0, 10));

  // Stats for insights panel
  const totalCount = filteredAssignments.length;
  const assignedCount = filteredAssignments.filter(a => a.status === 'assigned').length;
  const acceptedCount = filteredAssignments.filter(a => a.status === 'accepted').length;
  const completedCount = filteredAssignments.filter(a => a.status === 'completed').length;

  function handleConfirmAssignment(e) {
    e.preventDefault();
    setAssignLoading(true);
    setAssignError(null);
    setAssignSuccess(null);

    const form = e.target;
    const driverId = form.querySelector('select[name="driver"]')?.value || form.driver?.value;
    // Use selectedCollectors state for collectorIds
    const collectorIds = selectedCollectors.map(opt => opt.value);
    const truckId = form.querySelector('select[name="truck"]')?.value || form.truck?.value;
    const date = form.querySelector('input[type="date"]')?.value || form.date?.value;
    const time = form.querySelector('input[type="time"]')?.value || form.time?.value;
    // Replace cluster with barangay_id
    const barangay_id = form.querySelector('select[name="barangay_id"]')?.value || selected?.barangay_id;

    if (!driverId || !truckId || !date || !time || !barangay_id) {
      setAssignError('Please fill in all required fields.');
      setAssignLoading(false);
      return;
    }

    fetch(buildApiUrl('assign_task.php'), {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        driver_id: driverId,
        collector_ids: collectorIds,
        truck_id: truckId,
        date,
        time,
        barangay_id,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAssignSuccess('Task assigned and personnel notified!');
          setAssignError(null);
          // Optionally close modal or reset form after a delay
          // setTimeout(() => closeModal(), 1500);
        } else {
          setAssignError(data.message || 'Failed to assign task.');
          setAssignSuccess(null);
        }
      })
      .catch(() => {
        setAssignError('Failed to assign task.');
        setAssignSuccess(null);
      })
      .finally(() => setAssignLoading(false));
  }

  // Auto-generation function
  function handleAutoGenerateTasks(e) {
    e.preventDefault();
    setAutoGenLoading(true);
    setAutoGenError(null);
    setAutoGenSuccess(null);
    setAutoGenResults(null);

    const form = e.target;
    const startDate = form.querySelector('input[name="start_date"]')?.value;
    const endDate = form.querySelector('input[name="end_date"]')?.value;
    const cluster = form.querySelector('select[name="auto_cluster"]')?.value || '';

    // Debug log
    console.log({ start_date: startDate, end_date: endDate, cluster });

    if (!startDate || !endDate) {
      setAutoGenError('Please select start and end dates.');
      setAutoGenLoading(false);
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setAutoGenError('Start date cannot be after end date.');
      setAutoGenLoading(false);
      return;
    }

    fetch(buildApiUrl('auto_generate_tasks.php'), {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        cluster: cluster || null,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAutoGenSuccess(`Successfully generated ${data.total_generated} tasks!`);
          setAutoGenResults(data.generated_tasks);
          setAutoGenError(null);
        } else {
          setAutoGenError(data.message || 'Failed to generate tasks.');
          setAutoGenSuccess(null);
        }
      })
      .catch(() => {
        setAutoGenError('Failed to generate tasks.');
        setAutoGenSuccess(null);
      })
      .finally(() => setAutoGenLoading(false));
  }

  // Close auto-generation modal
  const closeAutoGenModal = () => {
    setShowAutoGenModal(false);
    setAutoGenError(null);
    setAutoGenSuccess(null);
    setAutoGenResults(null);
  };

  // Predefined schedule generation function
  function handlePredefinedGenerateTasks(e) {
    e.preventDefault();
    setPredefinedGenLoading(true);
    setPredefinedGenError(null);
    setPredefinedGenSuccess(null);
    setPredefinedGenResults(null);

    const form = e.target;
    const startDate = form.querySelector('input[name="predefined_start_date"]')?.value;
    const endDate = form.querySelector('input[name="predefined_end_date"]')?.value;

    if (!startDate || !endDate) {
      setPredefinedGenError('Please select start and end dates.');
      setPredefinedGenLoading(false);
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setPredefinedGenError('Start date cannot be after end date.');
      setPredefinedGenLoading(false);
      return;
    }

    fetch(buildApiUrl('generate_tasks_from_predefined.php'), {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        overwrite: predefinedOverwrite,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPredefinedGenSuccess(`Successfully generated ${data.total_generated} tasks from predefined schedules!`);
          setPredefinedGenResults(data.generated_tasks);
          if (typeof data.skipped_duplicates === 'number') {
            setPredefinedGenPreview({ skipped: data.skipped_duplicates, overwrite: data.overwrite });
          }
          setPredefinedGenError(null);
        } else {
          setPredefinedGenError(data.message || 'Failed to generate tasks from predefined schedules.');
          setPredefinedGenSuccess(null);
        }
      })
      .catch(() => {
        setPredefinedGenError('Failed to generate tasks from predefined schedules.');
        setPredefinedGenSuccess(null);
      })
      .finally(() => setPredefinedGenLoading(false));
  }

  // Close predefined generation modal
  const closePredefinedGenModal = () => {
    setShowPredefinedGenModal(false);
    setPredefinedGenError(null);
    setPredefinedGenSuccess(null);
    setPredefinedGenResults(null);
  };

  // Delete assignment handler
  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      const res = await fetch(buildApiUrl('delete_assignment.php'), {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ assignment_id: assignmentId }),
      });
      const data = await res.json();
      if (data.success) {
        setAllAssignments(prev => prev.filter(a => a.assignment_id !== assignmentId));
      } else {
        alert(data.message || 'Failed to delete assignment.');
      }
    } catch (err) {
      alert('Network error.');
    }
  };

  // Delete all assignments handler
  const handleDeleteAllAssignments = async () => {
    if (!window.confirm('Are you sure you want to delete ALL shown assignments?')) return;
    for (const assignment of filteredAssignments) {
      try {
        const res = await fetch(buildApiUrl('delete_assignment.php'), {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ assignment_id: assignment.assignment_id }),
        });
        const data = await res.json();
        if (!data.success) {
          alert(data.message || 'Failed to delete assignment ' + assignment.assignment_id);
        }
      } catch (err) {
        alert('Network error while deleting assignment ' + assignment.assignment_id);
      }
    }
    // Remove all deleted assignments from UI
    setAllAssignments(prev => prev.filter(a => !filteredAssignments.some(fa => fa.assignment_id === a.assignment_id)));
  };

  // Fetch schedules from backend
  useEffect(() => {
    setSchedulesLoading(true);
    fetch(buildApiUrl('get_collection_schedule.php'), { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSchedules(Array.isArray(data.schedules) ? data.schedules : []);
          setSchedulesError(null);
        } else {
          setSchedules([]);
          setSchedulesError(data.message || 'Failed to fetch schedules.');
        }
      })
      .catch((err) => {
        setSchedules([]);
        setSchedulesError('Failed to fetch schedules.');
      })
      .finally(() => setSchedulesLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-full overflow-x-auto bg-emerald-50 min-h-screen font-sans">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded shadow-md text-sm ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-gray-800 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
      {/* Header removed - using global admin header */}

      {/* Minimal Summary Bar - Tree Palette */}
      <div className="w-full flex items-center justify-between bg-green-50 py-6 px-8 mb-8">
        {/* Left: Info Columns */}
        <div className="flex flex-1 items-start gap-20">
          {/* Column 1 */}
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <FiUser className="w-6 h-6 text-green-800" />
              <div>
                <div className="text-base text-green-900 font-semibold leading-tight">
                  {selectedSchedule?.driver?.name ? (
                    <>
                      {selectedSchedule.driver.name}
                      {selectedSchedule.driver.status === 'accepted' && <span className="text-green-600"> (Accepted)</span>}
                      {selectedSchedule.driver.status === 'pending' && <span className="text-yellow-600"> (Pending)</span>}
                      {selectedSchedule.driver.status === 'declined' && <span className="text-red-600"> (Declined)</span>}
                    </>
                  ) : (
                    <span className="text-gray-400">No driver selected</span>
                  )}
                </div>
                <div className="text-xs text-green-700 font-normal">Truck Driver</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiUser className="w-6 h-6 text-green-800" />
              <div>
                <div className="text-base text-green-900 font-semibold leading-tight">
                  {selectedSchedule?.collectors?.[0] ? (
                    <>
                      {selectedSchedule.collectors[0].name}
                      {selectedSchedule.collectors[0].status === 'accepted' && <span className="text-green-600"> (Accepted)</span>}
                      {selectedSchedule.collectors[0].status === 'pending' && <span className="text-yellow-600"> (Pending)</span>}
                      {selectedSchedule.collectors[0].status === 'declined' && <span className="text-red-600"> (Declined)</span>}
                    </>
                  ) : (
                    <span className="text-gray-400">No collector</span>
                  )}
                </div>
                <div className="text-xs text-green-700 font-normal">Garbage Collector 1</div>
              </div>
            </div>
          </div>
          {/* Column 2 */}
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <FiUser className="w-6 h-6 text-green-800" />
              <div>
                <div className="text-base text-green-900 font-semibold leading-tight">
                  {selectedSchedule?.collectors?.[1] ? (
                    <>
                      {selectedSchedule.collectors[1].name}
                      {selectedSchedule.collectors[1].status === 'accepted' && <span className="text-green-600"> (Accepted)</span>}
                      {selectedSchedule.collectors[1].status === 'pending' && <span className="text-yellow-600"> (Pending)</span>}
                      {selectedSchedule.collectors[1].status === 'declined' && <span className="text-red-600"> (Declined)</span>}
                    </>
                  ) : (
                    <span className="text-gray-400">No collector</span>
                  )}
                </div>
                <div className="text-xs text-green-700 font-normal">Garbage Collector 2</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiUser className="w-6 h-6 text-green-800" />
              <div>
                <div className="text-base text-green-900 font-semibold leading-tight">
                  {selectedSchedule?.collectors?.[2] ? (
                    <>
                      {selectedSchedule.collectors[2].name}
                      {selectedSchedule.collectors[2].status === 'accepted' && <span className="text-green-600"> (Accepted)</span>}
                      {selectedSchedule.collectors[2].status === 'pending' && <span className="text-yellow-600"> (Pending)</span>}
                      {selectedSchedule.collectors[2].status === 'declined' && <span className="text-red-600"> (Declined)</span>}
                    </>
                  ) : (
                    <span className="text-gray-400">No collector</span>
                  )}
                </div>
                <div className="text-xs text-green-700 font-normal">Garbage Collector 3</div>
              </div>
            </div>
          </div>
          {/* Column 3 */}
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <FiCalendar className="w-6 h-6 text-green-800" />
              <div>
                <div className="text-base text-green-900 font-semibold leading-tight">
                  {selectedSchedule?.date || <span className="text-gray-400">No date</span>}
                </div>
                <div className="text-xs text-green-700 font-normal">Date Collected</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiClock className="w-6 h-6 text-green-800" />
              <div>
                <div className="text-base text-green-900 font-semibold leading-tight">
                  {selectedSchedule?.time || <span className="text-gray-400">No time</span>}
                </div>
                <div className="text-xs text-green-700 font-normal">Time Collected</div>
              </div>
            </div>
          </div>
          {/* Column 4 */}
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <FiTrash2 className="w-6 h-6 text-green-800" />
              <div>
                <div className="text-base text-green-900 font-semibold leading-tight">
                  {selectedSchedule?.truck_plate ? (
                    <>
                      {selectedSchedule.truck_plate} <span className="text-gray-500">|</span> {selectedSchedule.truck_type} <span className="text-gray-500">|</span> {selectedSchedule.truck_capacity}kg
                    </>
                  ) : <span className="text-gray-400">No truck assigned</span>}
                </div>
                <div className="text-xs text-green-700 font-normal">Truck Details</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiCheckCircle className="w-6 h-6 text-green-800" />
              <div>
                <div className="text-base text-green-900 font-semibold leading-tight">
                  {selectedSchedule?.status === 'assigned' && <span className="text-yellow-600">Assigned</span>}
                  {selectedSchedule?.status === 'accepted' && <span className="text-green-600">Accepted</span>}
                  {selectedSchedule?.status === 'declined' && <span className="text-red-600">Declined</span>}
                  {!['assigned','accepted','declined'].includes(selectedSchedule?.status) && (selectedSchedule?.status || <span className="text-gray-400">No status</span>)}
                </div>
                <div className="text-xs text-green-700 font-normal">COLLECTION STATUS</div>
              </div>
            </div>
          </div>
        </div>
        {/* Right: Action Buttons */}
        <div className="flex-shrink-0 ml-8 flex flex-col gap-2 items-end">
          <button
            className="px-8 py-2 rounded text-base font-semibold transition shadow-none focus:outline-none focus:ring-2 disabled:opacity-50 min-w-[180px]
                       bg-green-600 hover:bg-green-700 text-white focus:ring-green-800"
            onClick={() => handleAssign({ type: 'regular' })}
          >
            Assign
          </button>
          <button
            className="px-8 py-2 rounded text-base font-semibold transition shadow-none focus:outline-none focus:ring-2 disabled:opacity-50 min-w-[180px]
                       bg-green-600 hover:bg-green-700 text-white focus:ring-green-800"
            onClick={handleReassignAll}
          >
            Reassign All
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-5 w-full">
        {/* Barangay Sidebar - Minimal Design */}
        <div className="bg-white rounded-md border border-gray-200 p-5 w-full lg:w-80 flex flex-col">
          <h2 className="text-lg font-medium text-green-800 mb-4">Barangay Selection</h2>
          {/* Search Bar */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search Barangay"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white text-gray-800 outline-none transition-all duration-200 focus:border-green-800"
            />
          </div>
          {/* Barangay List */}
          <div className="flex-1 overflow-y-auto rounded border border-gray-200 bg-white">
            {barangayLoading && (
              <div className="px-4 py-3 text-gray-500 text-sm text-center">Loading barangays...</div>
            )}
            {barangayError && (
              <div className="px-4 py-3 text-red-600 text-sm text-center">{barangayError}</div>
            )}
            {!barangayLoading && !barangayError && filteredBarangays.length === 0 && (
              <div className="px-4 py-3 text-gray-500 text-sm text-center">No results found</div>
            )}
            {!barangayLoading && !barangayError && filteredBarangays.map(b => (
              <div
                key={b.barangay_id}
                className={`px-4 py-3 cursor-pointer flex flex-col transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                  selected && selected.barangay_id === b.barangay_id
                    ? 'bg-green-800 text-white'
                    : 'hover:bg-emerald-50 text-gray-700'
                }`}
                onClick={() => setSelected(b)}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    selected && selected.barangay_id === b.barangay_id ? 'bg-white' : 'bg-green-600'
                  }`}></span>
                  <span className="text-sm font-semibold">{b.barangay_name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights Panel - Minimal Replacement for Map */}
        <div className="flex-1 bg-white rounded-md border border-gray-200 p-5">
          <h2 className="text-lg font-medium text-green-800 mb-4">Assignment Insights</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="border border-gray-200 rounded-md p-4">
              <div className="text-xs uppercase text-gray-500">Total</div>
              <div className="text-3xl font-semibold text-green-900 mt-1">{totalCount}</div>
            </div>
            <div className="border border-gray-200 rounded-md p-4">
              <div className="text-xs uppercase text-gray-500">Assigned</div>
              <div className="text-3xl font-semibold text-green-900 mt-1">{assignedCount}</div>
            </div>
            <div className="border border-gray-200 rounded-md p-4">
              <div className="text-xs uppercase text-gray-500">Accepted</div>
              <div className="text-3xl font-semibold text-green-900 mt-1">{acceptedCount}</div>
            </div>
            <div className="border border-gray-200 rounded-md p-4">
              <div className="text-xs uppercase text-gray-500">Completed</div>
              <div className="text-3xl font-semibold text-green-900 mt-1">{completedCount}</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Tip: Use filters below to narrow down the list, then perform bulk actions.
          </div>
        </div>
      </div>

      {/* Pending Assignments Section */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-yellow-800 mb-4">Pending Assignments (Waiting for Personnel Acceptance)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-yellow-200 rounded-md">
            <thead>
              <tr className="bg-yellow-100 text-yellow-800">
                <th className="px-4 py-2 text-left">Schedule ID</th>
                <th className="px-4 py-2 text-left">Barangay ID</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Start Time</th>
                <th className="px-4 py-2 text-left">End Time</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedulesLoading ? (
                <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
              ) : schedulesError ? (
                <tr><td colSpan={6} className="text-center text-red-600 py-4">{schedulesError}</td></tr>
              ) : schedules.filter(sched => sched.status === 'pending').length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-gray-500">No pending assignments found.</td></tr>
              ) : (
                schedules
                  .filter(sched => sched.status === 'pending')
                  .map((sched) => (
                    <tr key={sched.schedule_id} className="border-b border-yellow-100">
                      <td className="px-4 py-2">{sched.schedule_id}</td>
                      <td className="px-4 py-2">{sched.barangay_id}</td>
                      <td className="px-4 py-2">{sched.scheduled_date}</td>
                      <td className="px-4 py-2">{sched.start_time}</td>
                      <td className="px-4 py-2">{sched.end_time}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                          {sched.status}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmed Schedule List (now based on collection_schedule) */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-green-800 mb-4">Confirmed Scheduled Pickups</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-green-200 rounded-md">
            <thead>
              <tr className="bg-green-100 text-green-800">
                <th className="px-4 py-2 text-left">Schedule ID</th>
                <th className="px-4 py-2 text-left">Barangay ID</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Start Time</th>
                <th className="px-4 py-2 text-left">End Time</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedulesLoading ? (
                <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
              ) : schedulesError ? (
                <tr><td colSpan={6} className="text-center text-red-600 py-4">{schedulesError}</td></tr>
              ) : schedules.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4">No schedules found.</td></tr>
              ) : (
                schedules
                  .filter(sched => sched.status === 'scheduled') // Only show confirmed schedules
                  .map((sched) => (
                    <tr key={sched.schedule_id} className="border-b border-green-100">
                      <td className="px-4 py-2">{sched.schedule_id}</td>
                      <td className="px-4 py-2">{sched.barangay_id}</td>
                      <td className="px-4 py-2">{sched.scheduled_date}</td>
                      <td className="px-4 py-2">{sched.start_time}</td>
                      <td className="px-4 py-2">{sched.end_time}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          sched.status === 'scheduled' ? 'bg-green-100 text-green-800' : 
                          sched.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sched.status}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Assignments Table */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-green-800">All Task Assignments</h2>
            {lastRefresh && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={refreshAssignments}
            disabled={allAssignmentsLoading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {allAssignmentsLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {allAssignmentsLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
        <div className="mb-4 flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-sm text-green-700 mb-1">Filter by Date</label>
            <input
              type="date"
              className="border border-green-200 rounded px-3 py-2"
              value={assignmentDateFilter}
              onChange={e => setAssignmentDateFilter(e.target.value)}
            />
            {assignmentDateFilter && (
              <button
                className="ml-2 text-sm text-green-700 underline"
                onClick={() => setAssignmentDateFilter('')}
              >
                Clear
              </button>
            )}
          </div>
          <div>
            <label className="block text-sm text-green-700 mb-1">Filter by Cluster</label>
            <select
              className="border border-green-200 rounded px-3 py-2"
              value={assignmentClusterFilter}
              onChange={e => setAssignmentClusterFilter(e.target.value)}
            >
              <option value="">All Clusters</option>
              {clusterOptions.map(cluster => (
                <option key={cluster} value={cluster}>{cluster}</option>
              ))}
            </select>
            {assignmentClusterFilter && (
              <button
                className="ml-2 text-sm text-green-700 underline"
                onClick={() => setAssignmentClusterFilter('')}
              >
                Clear
              </button>
            )}
          </div>
          <div>
            <label className="block text-sm text-green-700 mb-1">Status</label>
            <select
              className="border border-green-200 rounded px-3 py-2"
              value={assignmentStatusFilter}
              onChange={e => setAssignmentStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="assigned">Assigned</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-green-700 mb-1">Driver</label>
            <input
              type="text"
              placeholder="Search driver"
              className="border border-green-200 rounded px-3 py-2"
              value={assignmentDriverFilter}
              onChange={e => setAssignmentDriverFilter(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-green-700 mb-1">Truck</label>
            <input
              type="text"
              placeholder="Plate number"
              className="border border-green-200 rounded px-3 py-2"
              value={assignmentTruckFilter}
              onChange={e => setAssignmentTruckFilter(e.target.value)}
            />
          </div>
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-semibold"
            onClick={handleDeleteAllAssignments}
            disabled={filteredAssignments.length === 0}
          >
            Delete All Shown Assignments
          </button>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-green-700">Rows:</label>
            <select className="border border-green-200 rounded px-2 py-1" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        {/* Bulk actions bar */}
        {selectedIds.length > 0 && (
          <div className="mb-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded px-3 py-2">
            <div className="text-sm text-green-800">Selected: {selectedIds.length}</div>
            <button className="text-sm px-3 py-1 rounded border border-green-200 text-green-800 hover:bg-green-50"
              onClick={async () => {
                if (!window.confirm(`Mark ${selectedIds.length} assignment(s) as completed?`)) return;
                for (const id of selectedIds) {
                  await fetch(buildApiUrl('update_assignment.php'), {
                    method: 'POST',
                    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ assignment_id: id, status: 'completed' })
                  });
                }
                setAllAssignments(prev => prev.map(a => selectedIds.includes(a.assignment_id) ? { ...a, status: 'completed' } : a));
                clearSelection();
              }}
            >Complete</button>
            <button className="text-sm px-3 py-1 rounded border border-green-200 text-green-800 hover:bg-green-50"
              onClick={async () => {
                if (!window.confirm(`Cancel ${selectedIds.length} assignment(s)?`)) return;
                for (const id of selectedIds) {
                  await fetch(buildApiUrl('update_assignment.php'), {
                    method: 'POST',
                    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ assignment_id: id, status: 'cancelled' })
                  });
                }
                setAllAssignments(prev => prev.map(a => selectedIds.includes(a.assignment_id) ? { ...a, status: 'cancelled' } : a));
                clearSelection();
              }}
            >Cancel</button>
            <button className="text-sm px-3 py-1 rounded border border-green-200 text-green-800 hover:bg-green-50" onClick={clearSelection}>Clear</button>
          </div>
        )}
        {allAssignmentsLoading ? (
          <div className="text-gray-500">Loading assignments...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-green-200 rounded-md">
              <thead>
                <tr className="bg-green-100 text-green-800">
                  <th className="px-4 py-2">
                    <input type="checkbox" checked={paginatedAssignments.every(a => isSelected(a.assignment_id)) && paginatedAssignments.length>0}
                      onChange={(e) => selectAllOnPage(e.target.checked)} />
                  </th>
                  <th className="px-4 py-2">Barangay</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Time</th>
                  <th className="px-4 py-2">Driver</th>
                  <th className="px-4 py-2">Collectors</th>
                  <th className="px-4 py-2">Truck</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAssignments.map((assignment) => (
                  <tr key={assignment.assignment_id} className="border-b border-green-100">
                    <td className="px-4 py-2">
                      <input type="checkbox" checked={isSelected(assignment.assignment_id)} onChange={() => toggleSelect(assignment.assignment_id)} />
                    </td>
                    <td className="px-4 py-2">{assignment.barangay_name}</td>
                    <td className="px-4 py-2">
                      <input type="date" className="border border-green-200 rounded px-2 py-1 text-sm"
                        defaultValue={assignment.date}
                        onBlur={async (e) => {
                          const v = e.target.value; if (!v || v === assignment.date) return;
                          const before = { date: assignment.date };
                          await fetch(buildApiUrl('update_assignment.php'), {
                            method: 'POST',
                            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                            body: JSON.stringify({ assignment_id: assignment.assignment_id, date: v })
                          });
                          await fetch(buildApiUrl('log_task_event.php'), {
                            method: 'POST',
                            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                            body: JSON.stringify({ assignment_id: assignment.assignment_id, event_type: 'update_date', before, after: { date: v } })
                          });
                          setAllAssignments(prev => prev.map(a => a.assignment_id === assignment.assignment_id ? { ...a, date: v } : a));
                        }} />
                    </td>
                    <td className="px-4 py-2">
                      <input type="time" className="border border-green-200 rounded px-2 py-1 text-sm"
                        defaultValue={assignment.time}
                        onBlur={async (e) => {
                          const v = e.target.value; if (!v || v === assignment.time) return;
                          const before = { time: assignment.time };
                          await fetch(buildApiUrl('update_assignment.php'), {
                            method: 'POST',
                            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                            body: JSON.stringify({ assignment_id: assignment.assignment_id, time: v })
                          });
                          await fetch(buildApiUrl('log_task_event.php'), {
                            method: 'POST',
                            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                            body: JSON.stringify({ assignment_id: assignment.assignment_id, event_type: 'update_time', before, after: { time: v } })
                          });
                          setAllAssignments(prev => prev.map(a => a.assignment_id === assignment.assignment_id ? { ...a, time: v } : a));
                        }} />
                    </td>
                    <td className="px-4 py-2">
                      {assignment.driver
                        ? (
                          <span
                            style={{
                              color: assignment.driver.status === 'declined' ? 'red' : undefined,
                              fontWeight: assignment.driver.status === 'accepted' ? 'bold' : undefined
                            }}
                          >
                            {assignment.driver.name}
                            {assignment.driver.status === 'pending' && <span> (Pending)</span>}
                          </span>
                        )
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-2">
                      {assignment.collectors && assignment.collectors.length > 0
                        ? assignment.collectors.map((collector, idx) => (
                            <span
                              key={collector.name + idx}
                              style={{
                                color: collector.status === 'declined' ? 'red' : undefined,
                                fontWeight: collector.status === 'accepted' ? 'bold' : undefined,
                                marginRight: 4
                              }}
                            >
                              {collector.name}
                              {collector.status === 'pending' && <span> (Pending)</span>}
                              {idx < assignment.collectors.length - 1 && ', '}
                            </span>
                          ))
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-2">{assignment.truck_plate}</td>
                    <td className="px-4 py-2">
                      <select className="border border-green-200 rounded px-2 py-1 text-sm" defaultValue={assignment.status}
                        onChange={async (e) => {
                          const v = e.target.value; if (!v || v === assignment.status) return;
                          const before = { status: assignment.status };
                          await fetch(buildApiUrl('update_assignment.php'), {
                            method: 'POST',
                            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                            body: JSON.stringify({ assignment_id: assignment.assignment_id, status: v })
                          });
                          await fetch(buildApiUrl('log_task_event.php'), {
                            method: 'POST',
                            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                            body: JSON.stringify({ assignment_id: assignment.assignment_id, event_type: 'update_status', before, after: { status: v } })
                          });
                          setAllAssignments(prev => prev.map(a => a.assignment_id === assignment.assignment_id ? { ...a, status: v } : a));
                        }}>
                        <option value="assigned">Assigned</option>
                        <option value="accepted">Accepted</option>
                        <option value="declined">Declined</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-2">
                      <button
                        className="text-sm px-3 py-1 rounded border border-green-200 text-green-800 hover:bg-green-50"
                        onClick={async () => {
                          setHistoryFor(assignment);
                          setHistoryLoading(true);
                          try {
                            const res = await fetch(`${buildApiUrl('get_task_events.php')}?assignment_id=${encodeURIComponent(assignment.assignment_id)}`, {
                              headers: getAuthHeaders(),
                            });
                            const data = await res.json();
                            if (data.success) setHistoryEvents(Array.isArray(data.events) ? data.events : []);
                            else setHistoryEvents([]);
                          } catch (_) {
                            setHistoryEvents([]);
                          } finally {
                            setHistoryLoading(false);
                          }
                        }}
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination controls */}
            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-gray-600">Page {currentPage} of {totalPages} — {filteredAssignments.length} result(s)</div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 rounded border border-green-200 text-green-800 disabled:opacity-50" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>Prev</button>
                <button className="px-3 py-1 rounded border border-green-200 text-green-800 disabled:opacity-50" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Next</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History side panel */}
      {historyFor && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black bg-opacity-30">
          <div className="bg-white w-full max-w-md h-full shadow-xl p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-800">History: {historyFor.barangay_name} — #{historyFor.assignment_id}</h3>
              <button className="text-gray-500 hover:text-green-700" onClick={() => { setHistoryFor(null); setHistoryEvents([]); }}>✕</button>
            </div>
            {historyLoading ? (
              <div className="text-sm text-gray-500">Loading history...</div>
            ) : historyEvents.length === 0 ? (
              <div className="text-sm text-gray-500">No events logged.</div>
            ) : (
              <ul className="space-y-3">
                {historyEvents.map(ev => (
                  <li key={ev.id} className="border border-green-100 rounded p-3 bg-green-50">
                    <div className="text-xs text-gray-600 mb-1">{new Date(ev.created_at).toLocaleString()} • {ev.event_type}</div>
                    <div className="text-xs">
                      {ev.before_json && (
                        <div><span className="font-semibold">Before:</span> <code className="text-gray-700">{ev.before_json}</code></div>
                      )}
                      {ev.after_json && (
                        <div><span className="font-semibold">After:</span> <code className="text-gray-700">{ev.after_json}</code></div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-green-700" onClick={closeModal}><FaTimes size={20} /></button>
            <h2 className="text-xl font-semibold text-green-800 mb-4">Assign Task</h2>
            <form className="flex flex-col gap-4" onSubmit={handleConfirmAssignment}>
              <div>
                <label className="block text-sm text-green-700 mb-1">Select Driver</label>
                <select name="driver" className="w-full border border-green-200 rounded px-3 py-2" disabled={personnelLoading}>
                  <option value="">Select driver</option>
                  {drivers.map(driver => (
                    <option key={driver.id || driver.user_id} value={driver.id || driver.user_id}>{driver.full_name || driver.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-green-700 mb-1">Select Collectors</label>
                <Select
                  isMulti
                  name="collectors"
                  options={collectors.map(collector => ({
                    value: collector.id || collector.user_id,
                    label: collector.full_name || collector.username
                  }))}
                  value={selectedCollectors}
                  onChange={setSelectedCollectors}
                  isDisabled={personnelLoading}
                  classNamePrefix="react-select"
                  placeholder="Select collectors..."
                />
              </div>
              {personnelLoading && (
                <div className="text-xs text-gray-500 mt-2">Loading personnel...</div>
              )}
              {personnelError && (
                <div className="text-xs text-red-600 mt-2">{personnelError}</div>
              )}
              <div>
                <label className="block text-sm text-green-700 mb-1">Select Vehicle</label>
                <select name="truck" className="w-full border border-green-200 rounded px-3 py-2" disabled={trucksLoading}>
                  <option value="">Select truck</option>
                  {trucks.map(truck => (
                    <option key={truck.truck_id} value={truck.truck_id}>
                      {truck.plate_num} - {truck.truck_type} ({truck.capacity}kg) [{truck.status}]
                    </option>
                  ))}
                </select>
                {trucksLoading && (
                  <div className="text-xs text-gray-500 mt-2">Loading trucks...</div>
                )}
                {trucksError && (
                  <div className="text-xs text-red-600 mt-2">{trucksError}</div>
                )}
              </div>
              {/* Replace cluster with barangay in assignment modal */}
              {/* 1. Remove cluster dropdown from the modal form */}
              {/* 2. Add barangay dropdown or use selected barangay */}
              {/* 3. Update handleConfirmAssignment to send barangay_id */}
              <div>
                <label className="block text-sm text-green-700 mb-1">Select Barangay</label>
                <select name="barangay_id" className="w-full border border-green-200 rounded px-3 py-2" value={selected?.barangay_id || ''} onChange={e => setSelected(barangayList.find(b => b.barangay_id === e.target.value))} required>
                  <option value="">Select barangay</option>
                  {barangayList.map(b => (
                    <option key={b.barangay_id} value={b.barangay_id}>{b.barangay_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-green-700 mb-1">Date</label>
                <input type="date" name="date" className="w-full border border-green-200 rounded px-3 py-2" defaultValue={modalData?.sched?.date || ''} />
              </div>
              <div>
                <label className="block text-sm text-green-700 mb-1">Time</label>
                <input type="time" name="time" className="w-full border border-green-200 rounded px-3 py-2" defaultValue={modalData?.sched?.time || ''} />
              </div>
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded mt-2" disabled={assignLoading}>Confirm Assignment</button>
              {assignLoading && (
                <div className="text-xs text-gray-500 mt-2">Assigning...</div>
              )}
              {assignError && (
                <div className="text-xs text-red-600 mt-2">{assignError}</div>
              )}
              {assignSuccess && (
                <div className="text-xs text-green-600 mt-2">{assignSuccess}</div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Auto-Generation Modal */}
      {showAutoGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-blue-700" onClick={closeAutoGenModal}><FaTimes size={20} /></button>
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Auto-Generate Tasks</h2>
            
            <form className="flex flex-col gap-4 mb-6" onSubmit={handleAutoGenerateTasks}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-blue-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    name="start_date" 
                    className="w-full border border-blue-200 rounded px-3 py-2" 
                    min={new Date().toISOString().split('T')[0]}
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm text-blue-700 mb-1">End Date</label>
                  <input 
                    type="date" 
                    name="end_date" 
                    className="w-full border border-blue-200 rounded px-3 py-2" 
                    min={new Date().toISOString().split('T')[0]}
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm text-blue-700 mb-1">Cluster (Optional)</label>
                  <select name="auto_cluster" className="w-full border border-blue-200 rounded px-3 py-2">
                    <option value="">All Clusters</option>
                    {clusterOptions.map(cluster => (
                      <option key={cluster} value={cluster}>{cluster}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Auto-Generation Rules:</h3>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Tasks will be generated for weekdays only (Monday-Friday)</li>
                  <li>• Time slots: 8:00 AM, 10:00 AM, 2:00 PM, 4:00 PM</li>
                  <li>• Each task will have 1 driver and 2 collectors</li>
                  <li>• System will check for personnel and truck availability</li>
                  <li>• Personnel will be automatically notified of assignments</li>
                </ul>
              </div>

              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded mt-2" 
                disabled={autoGenLoading}
              >
                {autoGenLoading ? 'Generating Tasks...' : 'Generate Tasks'}
              </button>
              
              {autoGenLoading && (
                <div className="text-xs text-gray-500 mt-2 text-center">Please wait while generating tasks...</div>
              )}
              {autoGenError && (
                <div className="text-xs text-red-600 mt-2 text-center">{autoGenError}</div>
              )}
              {autoGenSuccess && (
                <div className="text-xs text-green-600 mt-2 text-center font-semibold">{autoGenSuccess}</div>
              )}
            </form>

            {/* Results Section */}
            {autoGenResults && autoGenResults.length > 0 && (
              <div className="border-t border-blue-200 pt-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Generated Tasks:</h3>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-2 py-1 text-left text-blue-700">Date</th>
                        <th className="px-2 py-1 text-left text-blue-700">Time</th>
                        <th className="px-2 py-1 text-left text-blue-700">Driver</th>
                        <th className="px-2 py-1 text-left text-blue-700">Collectors</th>
                        <th className="px-2 py-1 text-left text-blue-700">Truck</th>
                        <th className="px-2 py-1 text-left text-blue-700">Cluster</th>
                      </tr>
                    </thead>
                    <tbody>
                      {autoGenResults.map((task, index) => (
                        <tr key={index} className="border-b border-blue-100">
                          <td className="px-2 py-1">{task.date}</td>
                          <td className="px-2 py-1">{task.time}</td>
                          <td className="px-2 py-1">{task.driver}</td>
                          <td className="px-2 py-1">{task.collectors.join(', ')}</td>
                          <td className="px-2 py-1">{task.truck}</td>
                          <td className="px-2 py-1">{task.cluster}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Predefined Schedule Generation Modal */}
      {showPredefinedGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-purple-700" onClick={closePredefinedGenModal}><FaTimes size={20} /></button>
            <h2 className="text-xl font-semibold text-purple-800 mb-4">Generate Tasks from Predefined Schedules</h2>
            
            <form className="flex flex-col gap-4 mb-6" onSubmit={handlePredefinedGenerateTasks}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-purple-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    name="predefined_start_date" 
                    className="w-full border border-purple-200 rounded px-3 py-2" 
                    min={new Date().toISOString().split('T')[0]}
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm text-purple-700 mb-1">End Date</label>
                  <input 
                    type="date" 
                    name="predefined_end_date" 
                    className="w-full border border-purple-200 rounded px-3 py-2" 
                    min={new Date().toISOString().split('T')[0]}
                    required 
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input id="overwritePredefined" type="checkbox" className="accent-purple-600" checked={predefinedOverwrite} onChange={(e) => setPredefinedOverwrite(e.target.checked)} />
                <label htmlFor="overwritePredefined" className="text-sm text-purple-800">Overwrite existing schedules in range (same barangay & start time)</label>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-purple-800 mb-2">Predefined Schedule Rules:</h3>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• <strong>Daily Priority:</strong> North Centro (6AM, 10AM, 1PM, 4PM) & South Centro (7AM, 11AM, 2PM, 5PM)</li>
                  <li>• <strong>Fixed Days:</strong> Impig (Mon/Wed/Fri), Malubago (Tue/Fri), Tara (Mon/Wed/Fri), Gaongan (Thu), Azucena (Fri)</li>
                  <li>• <strong>Weekly Clusters:</strong> Cluster A (1st week), Cluster B (2nd week), Cluster C (3rd week), Cluster D (4th week)</li>
                  <li>• Tasks will be generated based on predefined schedules for the selected date range</li>
                  <li>• Personnel will be automatically assigned and notified</li>
                </ul>
              </div>

              <button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded mt-2" 
                disabled={predefinedGenLoading}
              >
                {predefinedGenLoading ? 'Generating Tasks...' : 'Generate Tasks from Predefined Schedules'}
              </button>
              
              {predefinedGenLoading && (
                <div className="text-xs text-gray-500 mt-2 text-center">Please wait while generating tasks from predefined schedules...</div>
              )}
              {predefinedGenError && (
                <div className="text-xs text-red-600 mt-2 text-center">{predefinedGenError}</div>
              )}
              {predefinedGenSuccess && (
                <div className="text-xs text-green-600 mt-2 text-center font-semibold">
                  {predefinedGenSuccess}
                  {predefinedGenPreview && (
                    <div className="text-xs text-purple-700 mt-1">
                      {predefinedGenPreview.overwrite ? `Replaced ${predefinedGenPreview.skipped} existing schedule(s).` : `Skipped ${predefinedGenPreview.skipped} duplicate schedule(s).`}
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Results Section */}
            {predefinedGenResults && predefinedGenResults.length > 0 && (
              <div className="border-t border-purple-200 pt-4">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">Generated Tasks from Predefined Schedules:</h3>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-purple-50">
                      <tr>
                        <th className="px-2 py-1 text-left text-purple-700">Date</th>
                        <th className="px-2 py-1 text-left text-purple-700">Time</th>
                        <th className="px-2 py-1 text-left text-purple-700">Barangay</th>
                        <th className="px-2 py-1 text-left text-purple-700">Driver</th>
                        <th className="px-2 py-1 text-left text-purple-700">Collectors</th>
                        <th className="px-2 py-1 text-left text-purple-700">Truck</th>
                        <th className="px-2 py-1 text-left text-purple-700">Assignment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predefinedGenResults.map((task, index) => (
                        <tr key={index} className="border-b border-purple-100">
                          <td className="px-2 py-1">{task.date}</td>
                          <td className="px-2 py-1">{task.time}</td>
                          <td className="px-2 py-1">{task.barangay_name}</td>
                          <td className="px-2 py-1">{task.driver}</td>
                          <td className="px-2 py-1">
                            <div className="text-xs">
                              {task.collectors ? task.collectors.join(', ') : 'N/A'}
                              {task.collector_team && (
                                <div className={`font-semibold mt-1 px-2 py-1 rounded text-xs ${
                                  task.collector_team.includes('Priority') 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {task.collector_team}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1">{task.truck}</td>
                          <td className="px-2 py-1">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              task.assignment_type === 'Priority Assignment' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {task.assignment_type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
