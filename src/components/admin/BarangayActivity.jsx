import React, { useState, useEffect } from 'react';

function Snackbar({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-green-800 text-white px-8 py-3.5 rounded-lg font-semibold text-base shadow-lg z-50">
      {message}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="w-8 h-8 border-4 border-green-200 border-t-green-800 rounded-full animate-spin" />
    </div>
  );
}

export default function BarangayActivity() {
  console.log('BarangayActivity component rendering');
  
  const [selectedBarangay, setSelectedBarangay] = useState('All');
  const [activityType, setActivityType] = useState('All');
  const [status, setStatus] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedBarangayData, setSelectedBarangayData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [showExportModal, setShowExportModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdvisoryModal, setShowAdvisoryModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalTab, setModalTab] = useState('details');
  const [isMobile, setIsMobile] = useState(false);

  // Form states for modals
  const [activityForm, setActivityForm] = useState({
    barangay: '',
    activityType: '',
    description: '',
    date: '',
    time: '',
    volume: '',
    status: 'Scheduled',
    notes: ''
  });

  const [advisoryForm, setAdvisoryForm] = useState({
    subject: '',
    message: '',
    targetBarangay: 'All',
    priority: 'Normal',
    sendTo: 'All Captains'
  });

  // Check screen size for mobile responsiveness
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mock notifications
  useEffect(() => {
    const mockNotifications = [
      { id: 1, type: 'warning', message: 'Bulan barangay has low compliance rate', time: '2 hours ago' },
      { id: 2, type: 'info', message: 'New waste collection schedule updated', time: '4 hours ago' },
      { id: 3, type: 'success', message: 'Segregation campaign completed successfully', time: '1 day ago' }
    ];
    setNotifications(mockNotifications);
  }, []);

  const BARANGAYS = ['Sagrada Familia', 'Aldezar', 'Bulan', 'Biglaan', 'Salvacion', 'North Centro', 'South Centro', 'Priority Area'];
  const ACTIVITY_TYPES = ['All', 'Segregation', 'Special Pickup', 'IEC Event', 'Complaints', 'Reports'];
  const STATUS_OPTIONS = ['All', 'Ongoing', 'Completed', 'Scheduled'];
  const PRIORITY_OPTIONS = ['Low', 'Normal', 'High', 'Urgent'];
  const SEND_TO_OPTIONS = ['All Captains', 'Specific Barangay', 'All Residents', 'Department Heads'];

  // Mock barangay data
  const MOCK_BARANGAY_DATA = [
    {
      id: 1,
      name: 'Sagrada Familia',
      lastCollection: '2025-05-10',
      nextPickup: '2025-05-13',
      segregationRate: 85,
      complaints: 3,
      reports: 12,
      status: 'Active',
      population: 1250,
      households: 312,
      wastePerDay: 2.1,
      complianceRate: 92,
      contactPerson: 'Barangay Captain Maria Santos',
      contactNumber: '0912-345-6789',
      address: 'Sagrada Familia Street, Zone 1',
      recentActivities: [
        { date: '2025-05-10', type: 'Collection', description: 'Regular waste collection completed' },
        { date: '2025-05-08', type: 'IEC Event', description: 'Waste segregation awareness campaign' },
        { date: '2025-05-05', type: 'Complaint', description: 'Resolved improper disposal issue' }
      ]
    },
    {
      id: 2,
      name: 'Aldezar',
      lastCollection: '2025-05-09',
      nextPickup: '2025-05-12',
      segregationRate: 92,
      complaints: 1,
      reports: 15,
      status: 'Active',
      population: 980,
      households: 245,
      wastePerDay: 1.8,
      complianceRate: 95,
      contactPerson: 'Barangay Captain Juan Dela Cruz',
      contactNumber: '0912-345-6790',
      address: 'Aldezar Avenue, Zone 2',
      recentActivities: [
        { date: '2025-05-09', type: 'Collection', description: 'Regular waste collection completed' },
        { date: '2025-05-07', type: 'Special Pickup', description: 'Bulky waste collection service' },
        { date: '2025-05-04', type: 'IEC Event', description: 'Composting workshop conducted' }
      ]
    },
    {
      id: 3,
      name: 'Bulan',
      lastCollection: '2025-05-08',
      nextPickup: '2025-05-11',
      segregationRate: 78,
      complaints: 5,
      reports: 8,
      status: 'Warning',
      population: 1560,
      households: 390,
      wastePerDay: 2.8,
      complianceRate: 78,
      contactPerson: 'Barangay Captain Pedro Reyes',
      contactNumber: '0912-345-6791',
      address: 'Bulan Road, Zone 3',
      recentActivities: [
        { date: '2025-05-08', type: 'Collection', description: 'Regular waste collection completed' },
        { date: '2025-05-06', type: 'Complaint', description: 'Multiple complaints about improper disposal' },
        { date: '2025-05-03', type: 'Warning', description: 'Notice sent for non-compliance' }
      ]
    },
    {
      id: 4,
      name: 'Biglaan',
      lastCollection: '2025-05-07',
      nextPickup: '2025-05-10',
      segregationRate: 88,
      complaints: 2,
      reports: 10,
      status: 'Active',
      population: 890,
      households: 223,
      wastePerDay: 1.6,
      complianceRate: 88,
      contactPerson: 'Barangay Captain Ana Garcia',
      contactNumber: '0912-345-6792',
      address: 'Biglaan Street, Zone 4',
      recentActivities: [
        { date: '2025-05-07', type: 'Collection', description: 'Regular waste collection completed' },
        { date: '2025-05-05', type: 'IEC Event', description: 'Recycling workshop for residents' },
        { date: '2025-05-02', type: 'Special Pickup', description: 'Hazardous waste collection' }
      ]
    },
    {
      id: 5,
      name: 'Salvacion',
      lastCollection: '2025-05-06',
      nextPickup: '2025-05-09',
      segregationRate: 95,
      complaints: 0,
      reports: 18,
      status: 'Active',
      population: 1120,
      households: 280,
      wastePerDay: 2.0,
      complianceRate: 98,
      contactPerson: 'Barangay Captain Roberto Lim',
      contactNumber: '0912-345-6793',
      address: 'Salvacion Boulevard, Zone 5',
      recentActivities: [
        { date: '2025-05-06', type: 'Collection', description: 'Regular waste collection completed' },
        { date: '2025-05-04', type: 'IEC Event', description: 'Zero waste workshop' },
        { date: '2025-05-01', type: 'Special Pickup', description: 'E-waste collection drive' }
      ]
    }
  ];

  // Calculate summary statistics
  const totalWaste = MOCK_BARANGAY_DATA.reduce((sum, barangay) => sum + barangay.wastePerDay, 0);
  const avgCompliance = Math.round(MOCK_BARANGAY_DATA.reduce((sum, barangay) => sum + barangay.complianceRate, 0) / MOCK_BARANGAY_DATA.length);
  const totalComplaints = MOCK_BARANGAY_DATA.reduce((sum, barangay) => sum + barangay.complaints, 0);
  const activeBarangays = MOCK_BARANGAY_DATA.filter(barangay => barangay.status === 'Active').length;

  // Filter data based on search and filters
  const filteredData = MOCK_BARANGAY_DATA.filter(barangay => {
    const matchesSearch = barangay.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         barangay.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBarangay = selectedBarangay === 'All' || barangay.name === selectedBarangay;
    const matchesActivity = activityType === 'All' || true; // Simplified for demo
    const matchesStatus = status === 'All' || barangay.status === status;
    return matchesSearch && matchesBarangay && matchesActivity && matchesStatus;
  });

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  function clearFilters() {
    setSelectedBarangay('All');
    setActivityType('All');
    setStatus('All');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    setCurrentPage(1);
  }

  function openModal(barangay) {
    setSelectedBarangayData(barangay);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedBarangayData(null);
  }

  function exportData() {
    setShowExportModal(true);
  }

  function closeExportModal() {
    setShowExportModal(false);
  }

  function getNotificationIcon(type) {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      case 'info': return 'ℹ';
      default: return '•';
    }
  }

  function getNotificationColor(type) {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      case 'error': return 'bg-red-100 text-red-700';
      case 'info': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Warning': return 'bg-yellow-100 text-yellow-700';
      case 'Inactive': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  function getStatusTextColor(status) {
    switch (status) {
      case 'Active': return 'text-green-700';
      case 'Warning': return 'text-yellow-700';
      case 'Inactive': return 'text-red-700';
      default: return 'text-gray-700';
    }
  }

  function exportToCSV() {
    const headers = ['Barangay Name', 'Last Collection', 'Next Pickup', 'Segregation Rate', 'Complaints', 'Status'];
    const rows = filteredData.map(b => [b.name, b.lastCollection, b.nextPickup, b.segregationRate + '%', b.complaints, b.status]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => '"' + (cell || '') + '"').join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'barangay-activity.csv';
    a.click();
    URL.revokeObjectURL(url);
    setSnackbar('Data exported to CSV successfully!');
  }

  function printTable() {
    const printContent = document.getElementById('barangay-table-print').outerHTML;
    const win = window.open('', '', 'width=900,height=700');
    win.document.write('<html><head><title>Print Barangay Activity</title>');
    win.document.write('<style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f1f5f9}</style>');
    win.document.write('</head><body>');
    win.document.write(printContent);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
    setSnackbar('Printing initiated...');
  }

  function handleAddActivity() {
    setShowAddModal(true);
  }

  function handleSendAdvisory() {
    setShowAdvisoryModal(true);
  }

  function handleExportCSV() {
    exportToCSV();
  }

  function handlePrint() {
    setShowPrintConfirm(true);
  }

  function handleExportData() {
    exportData();
  }

  function handleNotice() {
    setSnackbar('Notice sent successfully!');
  }

  function handleReport() {
    setSnackbar('Report generated successfully!');
  }

  function handleClearAll() {
    setShowClearConfirm(true);
  }

  function confirmClearAll() {
    clearFilters();
    setShowClearConfirm(false);
    setSnackbar('All filters cleared!');
  }

  function confirmPrint() {
    printTable();
    setShowPrintConfirm(false);
  }

  function handleExportFormat(format) {
    setSnackbar(`Data exported in ${format} format!`);
    setShowExportModal(false);
  }

  function handleActivityFormChange(e) {
    const { name, value } = e.target;
    setActivityForm(prev => ({ ...prev, [name]: value }));
  }

  function handleAdvisoryFormChange(e) {
    const { name, value } = e.target;
    setAdvisoryForm(prev => ({ ...prev, [name]: value }));
  }

  function handleActivitySubmit(e) {
    e.preventDefault();
    setSnackbar('Activity logged successfully!');
    setShowAddModal(false);
    setActivityForm({
      barangay: '',
      activityType: '',
      description: '',
      date: '',
      time: '',
      volume: '',
      status: 'Scheduled',
      notes: ''
    });
  }

  function handleAdvisorySubmit(e) {
    e.preventDefault();
    setSnackbar('Advisory sent successfully!');
    setShowAdvisoryModal(false);
    setAdvisoryForm({
      subject: '',
      message: '',
      targetBarangay: 'All',
      priority: 'Normal',
      sendTo: 'All Captains'
    });
  }

  function closeAddModal() {
    setShowAddModal(false);
    setActivityForm({
      barangay: '',
      activityType: '',
      description: '',
      date: '',
      time: '',
      volume: '',
      status: 'Scheduled',
      notes: ''
    });
  }

  function closeAdvisoryModal() {
    setShowAdvisoryModal(false);
    setAdvisoryForm({
      subject: '',
      message: '',
      targetBarangay: 'All',
      priority: 'Normal',
      sendTo: 'All Captains'
    });
  }

  return (
    <div className="p-6 max-w-full overflow-x-auto bg-green-50 min-h-screen font-sans">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl text-green-800 mb-2 font-normal tracking-tight">
          Barangay Activity Overview
        </h1>
        <p className="text-sm md:text-base lg:text-lg text-gray-600 m-0 font-normal">
          Monitor, analyze, and manage barangay-level waste activities and compliance.
        </p>
      </div>

      {/* Action Buttons - Minimal Design */}
      <div className="flex gap-3 my-6 flex-wrap justify-start">
        <button 
          onClick={handleAddActivity}
          className="px-5 py-2.5 bg-green-800 text-white border-none rounded-lg font-medium cursor-pointer text-sm min-w-fit transition-all duration-200 hover:bg-green-600"
        >
          Log New Activity
        </button>
        <button 
          onClick={handleSendAdvisory}
          className="px-5 py-2.5 bg-green-600 text-white border-none rounded-lg font-medium cursor-pointer text-sm min-w-fit transition-all duration-200 hover:bg-green-500"
        >
          Send Advisory
        </button>
        <button 
          onClick={handleExportCSV}
          className="px-5 py-2.5 bg-green-400 text-white border-none rounded-lg font-medium cursor-pointer text-sm min-w-fit transition-all duration-200 hover:bg-green-300"
        >
          Export CSV
        </button>
        <button 
          onClick={handlePrint}
          className="px-5 py-2.5 bg-amber-800 text-white border-none rounded-lg font-medium cursor-pointer text-sm min-w-fit transition-all duration-200 hover:bg-amber-700"
        >
          Print
        </button>
        <button 
          onClick={handleExportData}
          className="px-5 py-2.5 bg-purple-600 text-white border-none rounded-lg font-medium cursor-pointer text-sm min-w-fit transition-all duration-200 hover:bg-purple-500"
        >
          Export Data
        </button>
      </div>

      {/* Filters - Minimal Design */}
      <div className="flex gap-3 mb-6 items-center justify-center p-4 bg-white rounded-lg border border-green-200 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search barangays, contact persons..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-green-200 text-sm bg-green-50 text-gray-800 outline-none transition-all duration-200 focus:border-green-800"
          />
        </div>
        <select 
          value={selectedBarangay} 
          onChange={e => setSelectedBarangay(e.target.value)} 
          className="flex-1 min-w-[150px] px-3 py-2 rounded-md border border-green-200 text-sm bg-green-50 text-gray-800 outline-none cursor-pointer transition-all duration-200 focus:border-green-800"
        >
          <option value="All">All Barangays</option>
          {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select 
          value={activityType} 
          onChange={e => setActivityType(e.target.value)} 
          className="flex-1 min-w-[150px] px-3 py-2 rounded-md border border-green-200 text-sm bg-green-50 text-gray-800 outline-none cursor-pointer transition-all duration-200 focus:border-green-800"
        >
          {ACTIVITY_TYPES.map(type => <option key={type}>{type}</option>)}
        </select>
        <select 
          value={status} 
          onChange={e => setStatus(e.target.value)} 
          className="flex-1 min-w-[150px] px-3 py-2 rounded-md border border-green-200 text-sm bg-green-50 text-gray-800 outline-none cursor-pointer transition-all duration-200 focus:border-green-800"
        >
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="flex-1 min-w-[140px] px-3 py-2 rounded-md border border-green-200 text-sm bg-green-50 text-gray-800 outline-none transition-all duration-200 focus:border-green-800"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="flex-1 min-w-[140px] px-3 py-2 rounded-md border border-green-200 text-sm bg-green-50 text-gray-800 outline-none transition-all duration-200 focus:border-green-800"
        />
      </div>

      {/* Summary Cards - Minimal Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="bg-white p-5 rounded-lg border border-green-200 text-center">
          <div className="text-sm text-gray-600 mb-2">Total Waste/Day</div>
          <div className="text-2xl font-normal text-green-800">{totalWaste.toFixed(1)} tons</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-green-200 text-center">
          <div className="text-sm text-gray-600 mb-2">Avg Compliance</div>
          <div className="text-2xl font-normal text-green-600">{avgCompliance}%</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-green-200 text-center">
          <div className="text-sm text-gray-600 mb-2">Total Complaints</div>
          <div className="text-2xl font-normal text-red-500">{totalComplaints}</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-green-200 text-center">
          <div className="text-sm text-gray-600 mb-2">Active Barangays</div>
          <div className="text-2xl font-normal text-purple-600">{activeBarangays}/{MOCK_BARANGAY_DATA.length}</div>
        </div>
      </div>

      {/* Main Content: Table Panel - Minimal Design */}
      <div className="flex gap-5 flex-col lg:flex-row">
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg border border-green-200 p-5">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h2 className="text-lg m-0 text-green-800 font-medium">Barangay Activity Data</h2>
              <span className="text-xs text-gray-500">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
              </span>
            </div>
            <div className="overflow-x-auto">
              <div id="barangay-table-print">
                <table className="w-full border-collapse min-w-[600px] text-sm">
                  <thead>
                    <tr className="bg-green-50 border-b-2 border-green-200">
                      <th className="p-2 text-left font-medium text-gray-800 text-xs">Barangay Name</th>
                      <th className="p-2 text-left font-medium text-gray-800 text-xs">Last Collection</th>
                      <th className="p-2 text-left font-medium text-gray-800 text-xs">Next Pickup</th>
                      <th className="p-2 text-left font-medium text-gray-800 text-xs">Segregation Rate</th>
                      <th className="p-2 text-left font-medium text-gray-800 text-xs">Complaints</th>
                      <th className="p-2 text-left font-medium text-gray-800 text-xs">Status</th>
                      <th className="p-2 text-left font-medium text-gray-800 text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((barangay, idx) => (
                      <tr 
                        key={barangay.id} 
                        className={`cursor-pointer border-b border-green-200 transition-all duration-200 ${
                          idx % 2 === 0 ? 'bg-green-50' : 'hover:bg-green-50'
                        }`}
                      >
                        <td className="p-2 text-gray-800 font-medium">{barangay.name}</td>
                        <td className="p-2 text-gray-600">{barangay.lastCollection}</td>
                        <td className="p-2 text-gray-600">{barangay.nextPickup}</td>
                        <td className="p-2 text-gray-800">{barangay.segregationRate}%</td>
                        <td className="p-2 text-gray-800">{barangay.complaints}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            barangay.status === "Active" ? "bg-green-100 text-green-700" :
                            barangay.status === "Warning" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {barangay.status}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1 flex-wrap">
                            <button 
                              onClick={() => openModal(barangay)}
                              className="px-2 py-1 bg-green-600 text-white border-none rounded text-xs cursor-pointer transition-all duration-200 hover:bg-green-700"
                            >
                              View
                            </button>
                            <button 
                              onClick={handleNotice}
                              className="px-2 py-1 bg-blue-600 text-white border-none rounded text-xs cursor-pointer transition-all duration-200 hover:bg-blue-700"
                            >
                              Notice
                            </button>
                            <button 
                              onClick={handleReport}
                              className="px-2 py-1 bg-purple-600 text-white border-none rounded text-xs cursor-pointer transition-all duration-200 hover:bg-purple-700"
                            >
                              Report
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {currentData.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-gray-500 text-sm">
                          No barangay data found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-4 border-t border-green-200 flex justify-center items-center gap-2 flex-wrap">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded border text-xs transition-all duration-200 ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded border text-xs transition-all duration-200 ${
                      currentPage === page 
                        ? 'bg-green-800 text-white border-green-800' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded border text-xs transition-all duration-200 ${
                    currentPage === totalPages 
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Snackbar */}
      <Snackbar message={snackbar} onClose={() => setSnackbar('')} />
    </div>
  );
} 
