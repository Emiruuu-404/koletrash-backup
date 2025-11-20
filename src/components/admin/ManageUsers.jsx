import React, { useState, useEffect, useCallback } from "react";
import { FiSearch, FiPlus, FiUser, FiMoreVertical } from "react-icons/fi";
import { buildApiUrl } from "../../config/api.js";

// Environmental theme colors - Tree-inspired palette (same as ManageRoute)
const ENV_COLORS = {
  primary: '#2d5016',      // Deep forest green (tree trunk)
  secondary: '#4a7c59',    // Sage green (mature leaves)
  accent: '#8fbc8f',       // Light sage (new leaves)
  light: '#f8faf5',        // Very light mint (forest mist)
  white: '#ffffff',        // Pure white
  text: '#2c3e50',         // Dark bark
  textLight: '#7f8c8d',    // Light bark
  success: '#27ae60',      // Emerald green (healthy leaves)
  warning: '#f39c12',      // Autumn orange (falling leaves)
  error: '#e74c3c',        // Red (diseased leaves)
  border: '#e8f5e8',       // Light green border (forest floor)
  shadow: 'rgba(45, 80, 22, 0.08)', // Tree-tinted shadow
  bark: '#5d4e37',         // Tree bark brown
  moss: '#9caa7b',         // Moss green
  leaf: '#6b8e23',         // Olive green (leaves)
  soil: '#8b4513'          // Rich soil brown
};

const accountTypes = ["All", "Truck Driver", "Garbage Collector", "Barangay Head", "Resident"];
// Color map for roles using tree palette
const roleColors = {
  "Admin": "bg-purple-800 text-white",
  "Truck Driver": "bg-green-800 text-white",
  "Garbage Collector": "bg-green-600 text-white",
  "Barangay Head": "bg-amber-800 text-white",
  "Resident": "bg-green-300 text-gray-800",
};

const roleDisplay = {
  admin: "Admin",
  truck_driver: "Truck Driver",
  garbage_collector: "Garbage Collector",
  barangay_head: "Barangay Head",
  resident: "Resident"
};


export default function ManageUsers() {
  const [search, setSearch] = useState("");
  const [accountType, setAccountType] = useState("All");
  const [cluster, setCluster] = useState("All");
  const [clusterOptions, setClusterOptions] = useState(["All"]);
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "Truck Driver", // default
    firstname: "",
    lastname: "",
    birthdate: "",
    gender: "",
    status: "",
    barangay_id: ""
  });
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete' | 'deactivate', user }
  const [actionLoading, setActionLoading] = useState(false);

  // Helper function to get auth token
  const getAuthToken = () => {
    try {
      return localStorage.getItem('access_token');
    } catch {
      return null;
    }
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(buildApiUrl("get_all_users.php"), {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        const nonAdmins = Array.isArray(data.users) ? data.users.filter(u => u.user_type !== 'admin') : [];
        setUsers(nonAdmins);
      } else {
        alert(data.message || "Failed to fetch users.");
      }
    } catch (err) {
      alert("Error fetching users.");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch clusters for barangay head and resident filtering
  useEffect(() => {
    async function fetchClusters() {
      try {
        const res = await fetch(buildApiUrl('get_clusters.php'), {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        let options = [];
        if (Array.isArray(data?.clusters)) {
          // Accept either array of strings or array of objects with cluster_id
          options = data.clusters.map(c => typeof c === 'string' ? c : (c.cluster_id || c.name || '')).filter(Boolean);
        }
        setClusterOptions(["All", ...Array.from(new Set(options))]);
      } catch (err) {
        // Fallback keeps only "All"
        setClusterOptions(["All"]);
      }
    }
    fetchClusters();
  }, []);

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.username && u.username.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase()));
    const matchesType = accountType === "All" || (u.user_type && roleDisplay[u.user_type] === accountType);
    
    // Cluster filtering only applies to residents and barangay heads (not staff)
    const isResidentOrBgyHead = u.user_type === 'resident' || u.user_type === 'barangay_head';
    const matchesCluster = cluster === "All" || !isResidentOrBgyHead || (u.cluster_id === cluster || u.barangay === cluster);
    
    return matchesSearch && matchesType && matchesCluster;
  });

  const onlineUsers = users.filter(u => u.online_status === 'online');
  const offlineUsers = users.filter(u => u.online_status === 'offline' || !u.online_status);

  const handleDeactivateUser = async (user) => {
    setActionLoading(true);
    try {
      const res = await fetch(buildApiUrl("deactivate_user.php"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ user_id: user.id })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, online_status: 'offline' } : u));
      } else {
        alert(data.message || "Failed to deactivate user.");
      }
    } catch (err) {
      alert("Error deactivating user.");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
      setOpenMenuUserId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    setActionLoading(true);
    try {
      const res = await fetch(buildApiUrl("delete_account.php"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ user_id: user.id })
      });
      const data = await res.json();
      if (data.status === "success" || data.success) {
        setUsers(prev => prev.filter(u => u.id !== user.id));
      } else {
        alert(data.message || "Failed to delete user.");
      }
    } catch (err) {
      alert("Error deleting user.");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
      setOpenMenuUserId(null);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'delete') {
      await handleDeleteUser(confirmAction.user);
    } else if (confirmAction.type === 'deactivate') {
      await handleDeactivateUser(confirmAction.user);
    }
  };

  const actionCopy = {
    delete: {
      title: "Delete account",
      description: "This permanently removes the user and their profile data."
    },
    deactivate: {
      title: "Deactivate account",
      description: "This will force the user offline until they log back in."
    }
  };

  const openActionConfirm = (type, user) => {
    setOpenMenuUserId(null);
    setConfirmAction({ type, user });
  };


  return (
    <div className="p-6 max-w-full overflow-x-auto bg-emerald-50 min-h-screen font-sans">
      {/* Header removed - using global admin header */}

      {/* Action Buttons - Minimal Design */}
      <div className="flex gap-3 my-3 flex-wrap justify-start">
        <button
          className="px-4 py-2 bg-green-800 text-white border-none rounded-lg font-medium cursor-pointer text-sm min-w-fit transition-all duration-200 flex items-center gap-2 hover:bg-green-600"
          onClick={() => setShowModal(true)}
        >
          <FiPlus className="text-base" />
          Create Account
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 items-center flex-wrap justify-center p-4 bg-white rounded-lg border border-gray-200">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-200 text-sm bg-white text-gray-800 outline-none transition-all duration-200 focus:border-green-800"
          />
        </div>
        <select 
          value={accountType} 
          onChange={(e) => setAccountType(e.target.value)} 
          className="px-3 py-2 rounded-md border border-gray-200 text-sm min-w-fit bg-white text-gray-800 outline-none cursor-pointer transition-all duration-200 focus:border-green-800"
        >
          {accountTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        {(
          accountType === 'Barangay Head' || accountType === 'Resident'
        ) && (
          <select 
            value={cluster} 
            onChange={(e) => setCluster(e.target.value)} 
            className="px-3 py-2 rounded-md border border-gray-200 text-sm min-w-fit bg-white text-gray-800 outline-none cursor-pointer transition-all duration-200 focus:border-green-800"
          >
            {clusterOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Summary Cards - Minimal Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
        <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
          <div className="text-sm text-gray-600 mb-2">Total Users</div>
          <div className="text-2xl font-normal text-green-800">
            {loadingUsers ? "Loading..." : filteredUsers.length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
          <div className="text-sm text-gray-600 mb-2">Users Online</div>
          <div className="text-2xl font-normal text-green-600">
            {loadingUsers ? "Loading..." : onlineUsers.length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
          <div className="text-sm text-gray-600 mb-2">Users Offline</div>
          <div className="text-2xl font-normal text-red-500">
            {loadingUsers ? "Loading..." : offlineUsers.length}
          </div>
        </div>
      </div>

      {/* Main Content: User Cards */}
      <div className="flex gap-5 flex-col lg:flex-row">
        {/* User Cards */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-lg mb-4 text-green-800 font-medium">
              Users
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 transition-all duration-200 text-center hover:bg-green-50 relative"
                >
                  {/* Action menu trigger */}
                  <button
                    className="absolute right-2 top-2 p-1 rounded hover:bg-gray-100 border-0 bg-transparent cursor-pointer"
                    onClick={() => setOpenMenuUserId(openMenuUserId === user.id ? null : user.id)}
                    aria-label="Manage user"
                  >
                    <FiMoreVertical />
                  </button>
                  {openMenuUserId === user.id && (
                    <div className="absolute right-2 top-8 bg-white border border-gray-200 rounded shadow z-10 text-left w-40">
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-0 bg-transparent cursor-pointer"
                        onClick={() => openActionConfirm('deactivate', user)}
                      >
                        Deactivate
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 border-0 bg-transparent cursor-pointer"
                        onClick={() => openActionConfirm('delete', user)}
                      >
                        Delete Account
                      </button>
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mx-auto mb-3 ${
                    roleColors[roleDisplay[user.user_type]] || 'bg-gray-400 text-white'
                  }`}>
                    <FiUser />
                  </div>
                  <div className="font-medium text-sm text-gray-800 mb-1">
                    {user.full_name}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {user.email}
                  </div>
                  <div className="text-sm text-gray-800 mb-2">
                    {roleDisplay[user.user_type] || user.user_type}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {user.barangay}
                  </div>
                  
                  <div className="mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.online_status === "online"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {user.online_status === "online" ? "Online" : "Offline"}
                    </span>
                  </div>
                  
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {actionCopy[confirmAction.type]?.title || "Confirm action"}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {actionCopy[confirmAction.type]?.description || "Are you sure you want to continue?"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-semibold ${
                  confirmAction.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
                onClick={handleConfirmAction}
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : (confirmAction.type === 'delete' ? 'Delete Account' : 'Deactivate User')}
              </button>
              <button
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                onClick={() => setConfirmAction(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-green-900">Create Account</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                // Send POST request to your backend API
                try {
                  const res = await fetch(buildApiUrl("register_personnel.php"), {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(form),
                  });
                  const data = await res.json();
                  if (data.success) {
                    alert("Account created!");
                    setShowModal(false);
                    // Optionally refresh user list here
                  } else {
                    alert(data.message || "Failed to create account.");
                  }
                } catch (err) {
                  alert("Error creating account.");
                }
              }}
            >
              {/* Personal Information Section */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-green-800 border-b border-gray-200 pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      className="w-full p-2 border border-gray-300 rounded"
                      name="firstname"
                      placeholder="First Name"
                      value={form.firstname}
                      onChange={e => setForm({ ...form, firstname: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      className="w-full p-2 border border-gray-300 rounded"
                      name="lastname"
                      placeholder="Last Name"
                      value={form.lastname}
                      onChange={e => setForm({ ...form, lastname: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
                    <input
                      className="w-full p-2 border border-gray-300 rounded"
                      name="birthdate"
                      type="date"
                      value={form.birthdate}
                      onChange={e => setForm({ ...form, birthdate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded"
                      name="gender"
                      value={form.gender}
                      onChange={e => setForm({ ...form, gender: e.target.value })}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input
                      className="w-full p-2 border border-gray-300 rounded"
                      name="contact_num"
                      placeholder="Contact Number"
                      value={form.contact_num}
                      onChange={e => setForm({ ...form, contact_num: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      className="w-full p-2 border border-gray-300 rounded"
                      name="address"
                      placeholder="Address"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full p-2 border rounded"
                      name="status"
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="">Select Status</option>
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="on_leave">On Leave</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barangay ID</label>
                    <input
                      className="w-full p-2 border rounded"
                      name="barangay_id"
                      placeholder="Barangay ID"
                      value={form.barangay_id}
                      onChange={e => setForm({ ...form, barangay_id: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              {/* Account Information Section */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-green-800 border-b border-gray-200 pb-2">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      className="w-full p-2 border border-gray-300 rounded"
                      name="username"
                      placeholder="Username"
                      value={form.username}
                      onChange={e => setForm({ ...form, username: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      className="w-full p-2 border border-gray-300 rounded"
                      name="email"
                      type="email"
                      placeholder="Email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      className="w-full p-2 border border-gray-300 rounded"
                      name="password"
                      type="password"
                      placeholder="Password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded"
                      name="role"
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      required
                    >
                      <option value="admin">Admin</option>
                      <option value="truck_driver">Truck Driver</option>
                      <option value="garbage_collector">Garbage Collector</option>
                      <option value="barangay_head">Barangay Head</option>
                      <option value="resident">Resident</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-6">
                <button
                  type="button"
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-700 text-white rounded hover:bg-green-800"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
