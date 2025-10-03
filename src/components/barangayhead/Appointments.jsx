import React from 'react';
import { MdEventAvailable } from 'react-icons/md';
import { FaUser, FaRegCalendarAlt, FaRegClock, FaPhone, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

function getAppointmentRequests() {
  // Sample static data
  return [
    { name: 'Maria Santos', date: 'June 12, 2025', time: '10:00 AM', contact: '09171234567', status: 'Pending' },
    { name: 'Jose Dela Cruz', date: 'June 13, 2025', time: '2:00 PM', contact: '09181234567', status: 'Approved' },
    { name: 'Ana Reyes', date: 'June 14, 2025', time: '9:00 AM', contact: '09191234567', status: 'Declined' },
    { name: 'Pedro Gomez', date: 'June 15, 2025', time: '11:00 AM', contact: '09201234567', status: 'Pending' },
  ];
}

export default function Appointments() {
  const requests = getAppointmentRequests();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-2 py-8 bg-green-50">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          <MdEventAvailable className="text-emerald-600 w-6 h-6" />
          <h1 className="text-xl md:text-2xl font-bold text-emerald-800">Appointment Requests</h1>
        </div>
        <div className="overflow-x-auto rounded-xl shadow border border-green-200 bg-white">
          <table className="min-w-full text-sm text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-green-100 text-green-900">
                <th className="px-4 py-3 border-b border-green-200 font-semibold">Name</th>
                <th className="px-4 py-3 border-b border-green-200 font-semibold">Date</th>
                <th className="px-4 py-3 border-b border-green-200 font-semibold">Time</th>
                <th className="px-4 py-3 border-b border-green-200 font-semibold">Contact</th>
                <th className="px-4 py-3 border-b border-green-200 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item, idx) => (
                <tr key={idx} className="even:bg-green-50 hover:bg-green-100 transition">
                  <td className="px-4 py-3 border-b border-green-100 align-middle">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <FaUser className="text-emerald-600 w-4 h-4" />
                      {item.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-green-100 align-middle">
                    <span className="inline-flex items-center gap-2">
                      <FaRegCalendarAlt className="text-gray-500 w-4 h-4" />
                      {item.date}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-green-100 align-middle">
                    <span className="inline-flex items-center gap-2">
                      <FaRegClock className="text-gray-500 w-4 h-4" />
                      {item.time}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-green-100 align-middle">
                    <span className="inline-flex items-center gap-2">
                      <FaPhone className="text-gray-500 w-4 h-4" />
                      {item.contact}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-green-100 align-middle">
                    {item.status === 'Approved' ? (
                      <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
                        <FaCheckCircle className="w-4 h-4" /> Approved
                      </span>
                    ) : item.status === 'Declined' ? (
                      <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                        <FaTimesCircle className="w-4 h-4" /> Declined
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-yellow-600 font-semibold">
                        <FaRegClock className="w-4 h-4" /> Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
