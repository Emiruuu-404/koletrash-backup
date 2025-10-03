import React from 'react';
import { MdAssessment } from 'react-icons/md';
import { FaRegCalendarAlt, FaRegClock, FaRecycle, FaTrashAlt, FaLeaf, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

function getCollectionReports() {
  // Sample static data
  return [
    { date: 'June 10, 2025', type: 'Basura', collected: true, volume: '12 bags', remarks: 'On time', icon: <FaTrashAlt className="text-emerald-600 w-4 h-4" /> },
    { date: 'June 12, 2025', type: 'Recyclables', collected: true, volume: '8 bags', remarks: 'On time', icon: <FaRecycle className="text-blue-500 w-4 h-4" /> },
    { date: 'June 14, 2025', type: 'Biodegradable', collected: false, volume: '0', remarks: 'Missed', icon: <FaLeaf className="text-green-600 w-4 h-4" /> },
    { date: 'June 15, 2025', type: 'Special/Bulky', collected: true, volume: '2 items', remarks: 'Late', icon: <FaRegCalendarAlt className="text-yellow-500 w-4 h-4" /> },
  ];
}

export default function CollectionReports() {
  const reports = getCollectionReports();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-2 py-8 bg-green-50">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          <MdAssessment className="text-emerald-600 w-6 h-6" />
          <h1 className="text-xl md:text-2xl font-bold text-emerald-800">Collection Reports</h1>
        </div>
        <div className="overflow-x-auto rounded-xl shadow border border-green-200 bg-white">
          <table className="min-w-full text-sm text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-green-100 text-green-900">
                <th className="px-4 py-3 border-b border-green-200 font-semibold">Date</th>
                <th className="px-4 py-3 border-b border-green-200 font-semibold">Type</th>
                <th className="px-4 py-3 border-b border-green-200 font-semibold">Collected</th>
                <th className="px-4 py-3 border-b border-green-200 font-semibold">Volume</th>
                <th className="px-4 py-3 border-b border-green-200 font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((item, idx) => (
                <tr key={idx} className="even:bg-green-50 hover:bg-green-100 transition">
                  <td className="px-4 py-3 border-b border-green-100 align-middle">{item.date}</td>
                  <td className="px-4 py-3 border-b border-green-100 align-middle">
                    <span className="inline-flex items-center gap-2 font-medium">
                      {item.icon}
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-green-100 align-middle">
                    {item.collected ? (
                      <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
                        <FaCheckCircle className="w-4 h-4" /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                        <FaTimesCircle className="w-4 h-4" /> No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 border-b border-green-100 align-middle">{item.volume}</td>
                  <td className="px-4 py-3 border-b border-green-100 align-middle">{item.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
