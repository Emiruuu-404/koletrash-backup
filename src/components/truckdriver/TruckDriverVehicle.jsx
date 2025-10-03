import React, { useState } from 'react';
import {
  FiTruck,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiDroplet,
  FiTool,
  FiThermometer,
  FiActivity,
  FiAlertCircle,
  FiCheck,
  FiX
} from 'react-icons/fi';

// Add preOperation checklist items
const preOpChecklist = [
  { id: 1, item: "Engine Oil Level", checked: false },
  { id: 2, item: "Brake Fluid", checked: false },
  { id: 3, item: "Tire Pressure", checked: false },
  { id: 4, item: "Lights and Signals", checked: false },
  { id: 5, item: "Wipers and Washer Fluid", checked: false },
  { id: 6, item: "Hydraulic System", checked: false },
  { id: 7, item: "Fuel Level", checked: false },
  { id: 8, item: "Warning Lights", checked: false }
];

// Sample vehicle data - replace with actual API data later
const initialVehicleData = {
  id: "TRK-005",
  name: "Truck #05",
  type: "Garbage Truck",
  status: "operational",
  lastMaintenance: "2025-06-01",
  nextMaintenance: "2025-07-01",
  fuelLevel: 75,
  mileage: "45,230 km",
  engineHealth: "good",
  tireCondition: "good",
  brakeCondition: "good",
  hydraulicsCondition: "good",
  issues: [
    {
      id: 1,
      type: "warning",
      description: "Left headlight needs replacement",
      reported: "2025-06-13",
      status: "pending"
    }
  ],
  maintenanceHistory: [
    {
      id: 1,
      date: "2025-06-01",
      type: "Regular Maintenance",
      description: "Oil change and general inspection",
      cost: "₱5,000"
    },
    {
      id: 2,
      date: "2025-05-15",
      type: "Repair",
      description: "Break pad replacement",
      cost: "₱8,000"
    }
  ]
};

export default function TruckDriverVehicle() {
  const [vehicleData, setVehicleData] = useState(initialVehicleData);
  const [activeTab, setActiveTab] = useState('status');
  const [checklist, setChecklist] = useState(preOpChecklist);
  const [showChecklist, setShowChecklist] = useState(false);
  const [newIssue, setNewIssue] = useState({
    description: '',
    type: 'warning'
  });

  // Handle checklist item toggle
  const handleChecklistItem = (id) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // Handle new issue submission
  const handleNewIssue = (e) => {
    e.preventDefault();
    if (newIssue.description) {
      const issue = {
        id: Date.now(),
        description: newIssue.description,
        type: newIssue.type,
        reported: new Date().toISOString().split('T')[0],
        status: 'pending'
      };
      setVehicleData(prev => ({
        ...prev,
        issues: [issue, ...prev.issues]
      }));
      setNewIssue({ description: '', type: 'warning' });
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'out-of-service':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // Get condition color
  const getConditionColor = (condition) => {
    switch (condition) {
      case 'good':
        return 'text-green-500';
      case 'fair':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Get fuel level color
  const getFuelLevelColor = (level) => {
    if (level > 50) return 'text-green-500';
    if (level > 25) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="p-4 lg:p-6 w-full">
      {/* Header */}
      <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-medium text-gray-900">Vehicle Status</h1>
            <p className="text-sm text-gray-600 mt-1">{vehicleData.name} • {vehicleData.type}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vehicleData.status)} border self-start sm:self-center`}>
            {vehicleData.status.charAt(0).toUpperCase() + vehicleData.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FiDroplet className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Fuel Level</p>
              <p className={`text-lg font-medium ${getFuelLevelColor(vehicleData.fuelLevel)}`}>
                {vehicleData.fuelLevel}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <FiActivity className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Mileage</p>
              <p className="text-lg font-medium text-gray-900">{vehicleData.mileage}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <FiTool className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Next Maintenance</p>
              <p className="text-lg font-medium text-gray-900">{vehicleData.nextMaintenance}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <FiAlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Issues</p>
              <p className="text-lg font-medium text-gray-900">{vehicleData.issues.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100">
          <div className="overflow-x-auto">
            <nav className="flex gap-4 p-4">
              {['status', 'issues', 'maintenance'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap
                    ${activeTab === tab
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="divide-y divide-gray-100">
          {activeTab === 'status' && (
            <>
              {/* Vehicle Conditions */}
              <div className="p-4 lg:p-6">
                <h3 className="font-medium text-gray-900 mb-4">Vehicle Conditions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <FiThermometer className={`w-5 h-5 ${getConditionColor(vehicleData.engineHealth)}`} />
                    <div>
                      <p className="text-sm text-gray-600">Engine Health</p>
                      <p className="font-medium text-gray-900 capitalize">{vehicleData.engineHealth}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <FiTruck className={`w-5 h-5 ${getConditionColor(vehicleData.tireCondition)}`} />
                    <div>
                      <p className="text-sm text-gray-600">Tire Condition</p>
                      <p className="font-medium text-gray-900 capitalize">{vehicleData.tireCondition}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <FiActivity className={`w-5 h-5 ${getConditionColor(vehicleData.brakeCondition)}`} />
                    <div>
                      <p className="text-sm text-gray-600">Brake Condition</p>
                      <p className="font-medium text-gray-900 capitalize">{vehicleData.brakeCondition}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <FiTool className={`w-5 h-5 ${getConditionColor(vehicleData.hydraulicsCondition)}`} />
                    <div>
                      <p className="text-sm text-gray-600">Hydraulics Condition</p>
                      <p className="font-medium text-gray-900 capitalize">{vehicleData.hydraulicsCondition}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pre-operation Checklist */}
              <div className="p-4 lg:p-6">
                <h3 className="font-medium text-gray-900 mb-4">Daily Pre-operation Checklist</h3>
                {!showChecklist ? (
                  <button
                    onClick={() => setShowChecklist(true)}
                    className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                        <FiCheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Start Pre-operation Check</span>
                    </div>
                    <FiCheckCircle className="w-5 h-5 text-green-500" />
                  </button>
                ) : (
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                    {checklist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <button
                          onClick={() => handleChecklistItem(item.id)}
                          className={`w-5 h-5 rounded-md border ${
                            item.checked
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-green-500'
                          } flex items-center justify-center transition-colors`}
                        >
                          {item.checked && <FiCheck className="w-3 h-3" />}
                        </button>
                        <span className={`text-sm ${item.checked ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {item.item}
                        </span>
                      </div>
                    ))}
                    <div className="pt-4 flex gap-2">
                      <button
                        onClick={() => {
                          setShowChecklist(false);
                          setChecklist(prev => prev.map(item => ({ ...item, checked: false })));
                        }}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        Reset & Close
                      </button>
                      <button
                        onClick={() => setShowChecklist(false)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        disabled={!checklist.every(item => item.checked)}
                      >
                        Complete Check
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'issues' && (
            <>
              {/* New Issue Form */}
              <div className="p-4 lg:p-6">
                <form onSubmit={handleNewIssue} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Report New Issue
                    </label>
                    <textarea
                      value={newIssue.description}
                      onChange={(e) => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 h-24 resize-none"
                      placeholder="Describe the issue in detail..."
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <select
                      value={newIssue.type}
                      onChange={(e) => setNewIssue(prev => ({ ...prev, type: e.target.value }))}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white"
                    >
                      <option value="warning">Warning Issue</option>
                      <option value="critical">Critical Issue</option>
                    </select>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex-1 sm:flex-none"
                    >
                      Submit Issue
                    </button>
                  </div>
                </form>
              </div>

              {/* Issues List */}
              {vehicleData.issues.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
                    <FiCheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-500">No active issues reported</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {vehicleData.issues.map(issue => (
                    <div key={issue.id} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          <div className={`p-2 rounded-lg ${
                            issue.type === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
                          }`}>
                            <FiAlertTriangle className={`w-5 h-5 ${
                              issue.type === 'warning' ? 'text-yellow-500' : 'text-red-500'
                            }`} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{issue.description}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                            <span className="text-xs text-gray-500">Reported: {issue.reported}</span>
                            <span className="text-xs text-gray-300">•</span>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              issue.status === 'pending'
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-green-50 text-green-700'
                            }`}>
                              {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'maintenance' && (
            <div className="divide-y divide-gray-100">
              {vehicleData.maintenanceHistory.map(record => (
                <div key={record.id} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <FiTool className="w-5 h-5 text-purple-500" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{record.type}</p>
                        <span className="text-xs text-gray-300">•</span>
                        <p className="text-sm font-medium text-green-600">{record.cost}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{record.description}</p>
                      <p className="text-xs text-gray-500 mt-2">{record.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
