import React from 'react';

export default function BarangaySidebar({
  barangayList,
  selectedBarangays,
  setSelectedBarangays,
  selected,
  setSelected,
  filter,
  setFilter,
  selectedCluster,
  setSelectedCluster,
  barangayLoading,
  barangayError,
  clusterOptions,
  toggleBarangay
}) {
  let filteredBarangays = barangayList;
  if (selectedCluster) {
    filteredBarangays = filteredBarangays.filter(b => b.cluster_id === selectedCluster);
  }
  if (filter.trim() !== '') {
    filteredBarangays = filteredBarangays.filter(b => b.barangay_name.toLowerCase().includes(filter.toLowerCase()));
  }

  return (
    <div className="bg-white rounded-lg border border-green-200 p-5 w-full lg:w-80 flex flex-col">
      <h2 className="text-lg font-medium text-green-800 mb-4">Barangay Selection</h2>
      {/* Cluster Filter Dropdown */}
      <div className="mb-4">
        <label className="block text-sm text-green-700 mb-1">Filter by Cluster</label>
        <select
          className="w-full px-3 py-2 border border-green-200 rounded-md text-sm bg-green-50 text-gray-800 outline-none transition-all duration-200 focus:border-green-800"
          value={selectedCluster}
          onChange={e => setSelectedCluster(e.target.value)}
        >
          <option value="">All Clusters</option>
          {clusterOptions.map(cluster => (
            <option key={cluster} value={cluster}>{cluster}</option>
          ))}
        </select>
      </div>
      {/* Search Bar */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search Barangay"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full px-3 py-2 border border-green-200 rounded-md text-sm bg-green-50 text-gray-800 outline-none transition-all duration-200 focus:border-green-800"
        />
      </div>
      {/* Multi-selectable Barangay List */}
      <div className="flex-1 overflow-y-auto rounded border border-green-200 bg-green-50">
        {barangayLoading && (
          <div className="px-4 py-3 text-gray-500 text-sm text-center">Loading barangays...</div>
        )}
        {barangayError && (
          <div className="px-4 py-3 text-red-600 text-sm text-center">{barangayError}</div>
        )}
        {!barangayLoading && !barangayError && filteredBarangays.length === 0 && (
          <div className="px-4 py-3 text-gray-500 text-sm text-center">No results found</div>
        )}
        {!barangayLoading && !barangayError && filteredBarangays.map(b => {
          const isSelected = selectedBarangays.find(sel => sel.barangay_id === b.barangay_id);
          return (
            <div
              key={b.barangay_id}
              className={`px-4 py-3 cursor-pointer flex flex-col transition-all duration-200 border-b border-green-100 last:border-b-0 ${
                isSelected
                  ? 'bg-green-800 text-white'
                  : 'hover:bg-green-100 text-gray-700'
              }`}
              onClick={() => toggleBarangay(b)}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  className="accent-green-700"
                />
                <span className="text-sm font-semibold">{b.barangay_name}</span>
              </div>
              <div className="text-xs mt-1">
                <div><span className="font-bold">ID:</span> {b.barangay_id}</div>
                <div><span className="font-bold">Cluster:</span> {b.cluster_id || 'N/A'}</div>
                <div><span className="font-bold">Head ID:</span> {b.barangay_head_id || 'N/A'}</div>
                <div><span className="font-bold">Lat:</span> {b.latitude || 'N/A'} <span className="font-bold">Lng:</span> {b.longitude || 'N/A'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 
