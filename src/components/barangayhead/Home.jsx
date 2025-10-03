import React, { useEffect, useState } from 'react';

export default function Home() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  const fullName = user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : '';
  const role = user?.role || 'Barangay Head';
  return (
    <div>
      <div style={{marginBottom: 16}}>
        <div style={{fontWeight: 'bold', fontSize: 20}}>{fullName}</div>
        <div style={{color: '#888'}}>{role}</div>
      </div>
      {/* Add your content here */}
    </div>
  );
}
