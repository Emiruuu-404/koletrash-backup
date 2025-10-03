import React, { useState, useEffect } from "react";
import { FiClock, FiCheckCircle, FiXCircle, FiUserCheck } from "react-icons/fi";

const StatusUpdate = ({ userId, currentStatus, onStatusUpdate }) => {
  const [status, setStatus] = useState(currentStatus || 'Off Duty');
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    setStatus(currentStatus || 'Off Duty');
  }, [currentStatus]);

  const updateStatus = async (newStatus) => {
    if (!userId) {
      showStatusMessage("Error: User ID is missing", 'error');
      return;
    }
    
    setIsUpdating(true);
    try {
      const response = await fetch("https://koletrash.systemproj.com/backend/api/update_user_status.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          status: newStatus
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus(newStatus);
        setLastUpdate(new Date().toLocaleTimeString());
        if (onStatusUpdate) {
          onStatusUpdate(newStatus);
        }
        // Show success message
        showStatusMessage(`Status updated to ${newStatus}`, 'success');
      } else {
        showStatusMessage(data.message || "Failed to update status", 'error');
      }
    } catch (error) {
      showStatusMessage("Error updating status: " + error.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const showStatusMessage = (message, type) => {
    // Simple alert for now, can be enhanced with toast notifications
    alert(message);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "On Duty":
        return "bg-green-100 text-green-800 border-green-200";
      case "On Leave":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Off Duty":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "On Duty":
        return <FiCheckCircle className="text-green-600" />;
      case "On Leave":
        return <FiClock className="text-yellow-600" />;
      case "Off Duty":
        return <FiXCircle className="text-red-600" />;
      default:
        return <FiUserCheck className="text-gray-600" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">My Status</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(status)}`}>
          {getStatusIcon(status)}
          <span className="font-medium">{status}</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-600 mb-3">
          Update your current work status:
        </p>
        
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => updateStatus('On Duty')}
            disabled={isUpdating || status === 'On Duty'}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
              status === 'On Duty'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-200'
            } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <FiCheckCircle className="text-green-600" />
            <div className="text-left">
              <div className="font-medium">Check In - On Duty</div>
              <div className="text-xs text-gray-500">Start your work shift</div>
            </div>
          </button>

          <button
            onClick={() => updateStatus('Off Duty')}
            disabled={isUpdating || status === 'Off Duty'}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
              status === 'Off Duty'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-red-50 hover:border-red-200'
            } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <FiXCircle className="text-red-600" />
            <div className="text-left">
              <div className="font-medium">Check Out - Off Duty</div>
              <div className="text-xs text-gray-500">End your work shift</div>
            </div>
          </button>

          <button
            onClick={() => updateStatus('On Leave')}
            disabled={isUpdating || status === 'On Leave'}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
              status === 'On Leave'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-yellow-50 hover:border-yellow-200'
            } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <FiClock className="text-yellow-600" />
            <div className="text-left">
              <div className="font-medium">On Leave</div>
              <div className="text-xs text-gray-500">Taking time off or break</div>
            </div>
          </button>
        </div>

        {lastUpdate && (
          <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
            Last updated: {lastUpdate}
          </div>
        )}

        {isUpdating && (
          <div className="text-xs text-blue-600 mt-2">
            Updating status...
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusUpdate;
