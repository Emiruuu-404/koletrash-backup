import React, { useEffect, useState } from 'react';

function MyAssignments({ userId }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://koletrash.systemproj.com/backend/api/get_my_assignments.php?user_id=${userId}&role=collector`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setAssignments(data.assignments);
        setLoading(false);
      });
  }, [userId]);

  const respond = (assignment_id, response_status) => {
    fetch('https://koletrash.systemproj.com/backend/api/respond_assignment.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignment_id, user_id: userId, response_status, role: 'collector' }),
    })
      .then(res => res.json())
      .then(() => {
        setAssignments(assignments.filter(a => a.assignment_id !== assignment_id));
      });
  };

  if (loading) return <div className="p-6 text-gray-600">Loading assignments...</div>;

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-green-800">My Assignments</h2>
      </div>
      {assignments.length === 0 ? (
        <div className="bg-green-50 border border-green-100 text-green-800 rounded-xl p-4">No pending assignments.</div>
      ) : (
        <ul className="grid gap-4">
          {assignments.map(a => (
            <li key={a.assignment_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-700">Task for cluster <span className="font-semibold text-green-800">{a.cluster_id}</span></p>
                  <p className="text-sm text-gray-600">{a.date} at {a.time}</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors" onClick={() => respond(a.assignment_id, 'confirmed')}>Confirm</button>
                  <button className="px-4 py-2 border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors" onClick={() => respond(a.assignment_id, 'declined')}>Decline</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MyAssignments; 
