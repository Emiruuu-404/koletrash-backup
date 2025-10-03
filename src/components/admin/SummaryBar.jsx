import React from 'react';
import { FiUser, FiCalendar, FiClock, FiCheckCircle, FiTrash2 } from 'react-icons/fi';

export default function SummaryBar({ selectedSchedule, onAssign }) {
  return (
    <div className="w-full flex items-center justify-between bg-green-50 py-6 px-8 mb-8">
      {/* Left: Info Columns */}
      <div className="flex flex-1 items-start gap-20">
        {/* Column 1 */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <FiUser className="w-6 h-6 text-green-800" />
            <div>
              <div className="text-base text-green-900 font-semibold leading-tight">
                {selectedSchedule?.driver || <span className="text-gray-400">No driver selected</span>}
              </div>
              <div className="text-xs text-green-700 font-normal">Truck Driver</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FiUser className="w-6 h-6 text-green-800" />
            <div>
              <div className="text-base text-green-900 font-semibold leading-tight">
                {selectedSchedule?.collectors?.[0] || <span className="text-gray-400">No collector</span>}
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
                {selectedSchedule?.collectors?.[1] || <span className="text-gray-400">No collector</span>}
              </div>
              <div className="text-xs text-green-700 font-normal">Garbage Collector 2</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FiUser className="w-6 h-6 text-green-800" />
            <div>
              <div className="text-base text-green-900 font-semibold leading-tight">
                {selectedSchedule?.collectors?.[2] || <span className="text-gray-400">No collector</span>}
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
                {selectedSchedule?.waste_collected || <span className="text-gray-400">N/A</span>}
              </div>
              <div className="text-xs text-green-700 font-normal">Total Waste Collected</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FiCheckCircle className="w-6 h-6 text-green-800" />
            <div>
              <div className="text-base text-green-900 font-semibold leading-tight">
                {selectedSchedule?.status || <span className="text-gray-400">No status</span>}
              </div>
              <div className="text-xs text-green-700 font-normal">COLLECTION STATUS</div>
            </div>
          </div>
        </div>
      </div>
      {/* Right: Assign Button */}
      <div className="flex-shrink-0 ml-8 flex flex-col gap-2 items-end">
        <button
          className="bg-green-500 hover:bg-green-600 text-green-900 font-semibold px-8 py-2 rounded transition text-base shadow-none focus:outline-none focus:ring-2 focus:ring-green-700 disabled:opacity-50"
          onClick={onAssign}
        >
          Assign
        </button>
      </div>
    </div>
  );
} 
