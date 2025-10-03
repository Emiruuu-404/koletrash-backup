import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';

// Import scheduleData from ManageSchedule component
import ManageSchedule from './ManageSchedule';

// Import the conversion function from the service
import { convertScheduleToRoutes } from '../../services/scheduleService';

// Import the schedule data from the data file
import { scheduleData } from '../../data/scheduleData';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Environmental theme colors - Tree-inspired palette
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

// Update the SIPOCOT_CENTER and SIPOCOT_BOUNDS constants
const SIPOCOT_CENTER = [13.7766, 122.9826]; // Sipocot municipality center
const SIPOCOT_BOUNDS = [
  [13.7266, 122.9326], // Southwest bounds
  [13.8266, 123.0326]  // Northeast bounds
];

// API base URL - adjust this to match your backend setup
const API_BASE_URL = 'https://koletrash.systemproj.combackend/api'; // Replace koletrash.systemproj.com with your actual Hostinger domain

// Function to fetch scheduled routes from API (daily generated routes)
const fetchScheduledRoutes = async (date) => {
  try {
    const response = await fetch(`${API_BASE_URL}/get_routes.php?date=${date}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      const routes = (data.routes || []).map((r) => {
        const start = r.start_time ? String(r.start_time).slice(0,5) : '00:00';
        const end = r.end_time ? String(r.end_time).slice(0,5) : '00:00';
        return {
          id: r.id,
          name: `${r.cluster_id || ''} - ${r.barangay_name || 'Route'}`.trim(),
          truck: r.plate_num || 'Unassigned Truck',
          driver: r.team_id ? `Team ${r.team_id}` : 'Unassigned Driver',
          barangay: r.barangay_name || 'N/A',
          datetime: `${r.date}, ${start} - ${end}`,
          volume: (r.capacity_used_kg ? (Number(r.capacity_used_kg)/1000).toFixed(1) : '0.0') + ' tons',
          status: (r.status || 'scheduled').replace(/\b\w/g, c => c.toUpperCase()),
          statusColor: { bg: 'bg-green-50', color: 'text-green-800' },
          coordinates: BARANGAY_COORDINATES[r.barangay_name] || [13.7766, 122.9826],
          collectionPoints: [],
          driverNotes: '',
          complaints: [],
          latitude: null,
          longitude: null,
          locationName: r.barangay_name || 'Main Area',
          source: r.source
        };
      });
      return routes;
    } else {
      console.error('API Error:', data.message);
      throw new Error(data.message || 'Failed to fetch routes');
    }
  } catch (error) {
    console.error('Error fetching scheduled routes:', error);
    throw error;
  }
};

// Fetch full route details including ordered stops
const fetchRouteDetails = async (routeId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/get_route_details.php?id=${routeId}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to load route details');
    return data.route;
  } catch (e) {
    console.error('Error fetching route details:', e);
    throw e;
  }
};

// Update the ROUTES constant to include phone numbers
const ROUTES = [
  {
    name: "Zone 1 – Maligaya St.",
    truck: "Truck-001",
    driver: "John Doe",
    driverPhone: "+63 912 345 6789", // Add phone number
    barangay: "Sagrada Familia",
    datetime: "2025-01-20, 08:00 - 12:00",
    volume: "2.5 tons",
    status: "Scheduled",
    statusColor: { bg: ENV_COLORS.light, color: ENV_COLORS.primary },
    coordinates: [13.7766, 122.9826], // Sagrada Familia
    collectionPoints: [
      { name: "Maligaya St. Corner", time: "08:00", volume: "0.8 tons", coordinates: [13.7768, 122.9828] },
      { name: "Maligaya St. Middle", time: "09:30", volume: "0.9 tons", coordinates: [13.7770, 122.9830] },
      { name: "Maligaya St. End", time: "11:00", volume: "0.8 tons", coordinates: [13.7772, 122.9832] }
    ],
    driverNotes: "Heavy traffic at Maligaya St. Middle.",
    complaints: ["Resident at #12 Maligaya St. reported missed pickup last week."]
  },
  {
    name: "Zone 2 – Aldezar Ave.",
    truck: "Truck-002",
    driver: "Jane Smith",
    driverPhone: "+63 912 345 6790",
    barangay: "Aldezar",
    datetime: "2025-01-20, 09:00 - 13:00",
    volume: "3.2 tons",
    status: "In Progress",
    statusColor: { bg: '#fff3cd', color: ENV_COLORS.warning },
    coordinates: [13.8000, 122.9500], // Aldezar
    collectionPoints: [
      { name: "Aldezar Ave. Start", time: "09:00", volume: "1.1 tons", coordinates: [13.8002, 122.9502] },
      { name: "Aldezar Ave. Center", time: "10:30", volume: "1.0 tons", coordinates: [13.8004, 122.9504] },
      { name: "Aldezar Ave. End", time: "12:00", volume: "1.1 tons", coordinates: [13.8006, 122.9506] }
    ],
    driverNotes: "All bins accessible.",
    complaints: []
  },
  {
    name: "Zone 3 – Bulan Rd.",
    truck: "Truck-003",
    driver: "Carlos Reyes",
    driverPhone: "+63 912 345 6791",
    barangay: "Bulan",
    datetime: "2025-01-20, 10:00 - 14:00",
    volume: "1.8 tons",
    status: "Completed",
    statusColor: { bg: '#d4edda', color: ENV_COLORS.success },
    coordinates: [13.7500, 122.9550], // Bulan
    collectionPoints: [
      { name: "Bulan Rd. Entrance", time: "10:00", volume: "0.6 tons", coordinates: [13.7502, 122.9552] },
      { name: "Bulan Rd. Middle", time: "11:30", volume: "0.6 tons", coordinates: [13.7504, 122.9554] },
      { name: "Bulan Rd. Exit", time: "13:00", volume: "0.6 tons", coordinates: [13.7506, 122.9556] }
    ],
    driverNotes: "Route completed smoothly.",
    complaints: []
  },
  {
    name: "Zone 4 – Biglaan St.",
    truck: "Truck-001",
    driver: "John Doe",
    driverPhone: "+63 912 345 6789",
    barangay: "Biglaan",
    datetime: "2025-01-20, 14:00 - 18:00",
    volume: "2.1 tons",
    status: "Missed",
    statusColor: { bg: '#f8d7da', color: ENV_COLORS.error },
    coordinates: [13.7700, 122.9950], // Biglaan
    collectionPoints: [
      { name: "Biglaan St. Corner", time: "14:00", volume: "0.7 tons", coordinates: [13.7702, 122.9952] },
      { name: "Biglaan St. Middle", time: "15:30", volume: "0.7 tons", coordinates: [13.7704, 122.9954] },
      { name: "Biglaan St. End", time: "17:00", volume: "0.7 tons", coordinates: [13.7706, 122.9956] }
    ],
    driverNotes: "Blocked road at Biglaan St. End.",
    complaints: ["Resident at #5 Biglaan St. reported missed pickup."]
  },
  {
    name: "Zone 5 – Salvacion Blvd.",
    truck: "Truck-002",
    driver: "Jane Smith",
    driverPhone: "+63 912 345 6790",
    barangay: "Salvacion",
    datetime: "2025-01-20, 15:00 - 19:00",
    volume: "2.8 tons",
    status: "Scheduled",
    statusColor: { bg: ENV_COLORS.light, color: ENV_COLORS.primary },
    coordinates: [13.6350, 122.7250], // Salvacion
    collectionPoints: [
      { name: "Salvacion Blvd. Start", time: "15:00", volume: "0.9 tons", coordinates: [13.6352, 122.7252] },
      { name: "Salvacion Blvd. Center", time: "16:30", volume: "0.9 tons", coordinates: [13.6354, 122.7254] },
      { name: "Salvacion Blvd. End", time: "18:00", volume: "1.0 tons", coordinates: [13.6356, 122.7256] }
    ],
    driverNotes: "Expecting rain in the afternoon.",
    complaints: []
  }
];

const DRIVERS = ["All", "John Doe", "Jane Smith", "Carlos Reyes"];
const STATUSES = ["All", "Scheduled", "In Progress", "Completed", "Missed"];
const BARANGAYS = ["All", "Sagrada Familia", "Aldezar", "Bulan", "Biglaan", "Salvacion", "Alteza", "Anib", "Awayan", "Azucena", "Bagong Sirang", "Binahian", "Bolo Norte", "Bolo Sur", "Bulawan", "Cabuyao", "Caima", "Calagbangan", "Calampinay", "Carayrayan", "Cotmo", "Gabi", "Gaongan", "Impig", "Lipilip", "Lubigan Jr.", "Lubigan Sr.", "Malaguico", "Malubago", "Manangle", "Mangapo", "Mangga", "Manlubang", "Mantila", "North Centro (Poblacion)", "North Villazar", "Salanda", "San Isidro", "San Vicente", "Serranzana", "South Centro (Poblacion)", "South Villazar", "Taisan", "Tara", "Tible", "Tula-tula", "Vigaan", "Yabo"];

// Extended coordinates for Sipocot barangays
const BARANGAY_COORDINATES = {
  "Sagrada Familia": [13.8142517, 122.9986921],
  "Aldezar": [13.8000, 122.9500],
  "Bulan": [13.7500, 122.9550],
  "Biglaan": [13.7700, 122.9950],
  "Salvacion": [13.6350, 122.7250],
  "Alteza": [13.7900, 122.9600],
  "Anib": [13.7850, 122.9700],
  "Awayan": [13.7800, 122.9800],
  "Azucena": [13.7750, 122.9900],
  "Bagong Sirang": [13.7700, 122.9950],
  "Binahian": [13.7650, 122.9850],
  "Bolo Norte": [13.7600, 122.9750],
  "Bolo Sur": [13.7550, 122.9650],
  "Bulawan": [13.7450, 122.9450],
  "Cabuyao": [13.7400, 122.9350],
  "Caima": [13.7350, 122.9250],
  "Calagbangan": [13.7300, 122.9150],
  "Calampinay": [13.7250, 122.9050],
  "Carayrayan": [13.7200, 122.8950],
  "Cotmo": [13.7150, 122.8850],
  "Gabi": [13.7100, 122.8750],
  "Gaongan": [13.7766, 122.9826],
  "Impig": [13.7050, 122.8650],
  "Lipilip": [13.7000, 122.8550],
  "Lubigan Jr.": [13.6950, 122.8450],
  "Lubigan Sr.": [13.6900, 122.8350],
  "Malaguico": [13.6850, 122.8250],
  "Malubago": [13.6800, 122.8150],
  "Manangle": [13.6750, 122.8050],
  "Mangapo": [13.6700, 122.7950],
  "Mangga": [13.6650, 122.7850],
  "Manlubang": [13.6600, 122.7750],
  "Mantila": [13.6550, 122.7650],
  "North Centro (Poblacion)": [13.7760, 122.9830],
  "North Villazar": [13.6500, 122.7550],
  "Salanda": [13.6400, 122.7350],
  "San Isidro": [13.6300, 122.7150],
  "San Vicente": [13.6250, 122.7050],
  "Serranzana": [13.6200, 122.6950],
  "South Centro (Poblacion)": [13.7755, 122.9820],
  "South Villazar": [13.6150, 122.6850],
  "Taisan": [13.6100, 122.6750],
  "Tara": [13.6050, 122.6650],
  "Tible": [13.6000, 122.6550],
  "Tula-tula": [13.5950, 122.6450],
  "Vigaan": [13.5900, 122.6350],
  "Yabo": [13.5850, 122.6250]
};

const MODAL_WIDTH = 540;
const MODAL_HEIGHT = 420;

// Enhanced map configuration
const MAP_CONFIG = {
  center: [13.7766, 122.9826], // Sipocot center
  zoom: 13,
  minZoom: 10,
  maxZoom: 18,
  bounds: [
    [13.7266, 122.9326], // Southwest bounds
    [13.8266, 123.0326]  // Northeast bounds
  ]
};

// Map tile options
const MAP_TILES = {
  street: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  terrain: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
};

// Enhanced truck icon with better styling
const createTruckIcon = (status, isMoving = false) => {
  const colors = {
    'Scheduled': '#3b82f6',
    'In Progress': '#f59e0b',
    'Completed': '#10b981',
    'Missed': '#ef4444'
  };
  
  return L.divIcon({
    html: `<div style="
      background-color: ${colors[status] || '#3b82f6'};
      width: 32px;
      height: 24px;
      border-radius: 6px;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: bold;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      transform: ${isMoving ? 'scale(1.1)' : 'scale(1)'};
      transition: all 0.3s ease;
      position: relative;
    ">
      🚛
      ${isMoving ? '<div style="position:absolute;top:-8px;right:-8px;width:16px;height:16px;background:red;border-radius:50%;animation:pulse 1s infinite;"></div>' : ''}
    </div>
    <style>
      @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    </style>`,
    className: 'enhanced-truck-marker',
    iconSize: [32, 24],
    iconAnchor: [16, 12]
  });
};

// Enhanced collection point icon
const createCollectionPointIcon = (type, volume) => {
  const colors = {
    'start': '#10b981',
    'middle': '#f59e0b',
    'end': '#ef4444'
  };
  
  const size = Math.max(16, Math.min(24, volume * 8)); // Size based on volume
  
  return L.divIcon({
    html: `<div style="
      background-color: ${colors[type] || '#10b981'};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 2px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: ${size * 0.4}px;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">📦</div>`,
    className: 'collection-point-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

// Enhanced component for live truck tracking
function AnimatedTruck({ positions, isActive, selectedRoute }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [eta, setEta] = useState(null);
  const [speed, setSpeed] = useState(0);
  
  useEffect(() => {
    if (!isActive || positions.length === 0) {
      setIsAnimating(false);
      return;
    }
    
    setIsAnimating(true);
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % positions.length;
        return next;
      });
      
      // Simulate real-time updates
      setSpeed(Math.floor(Math.random() * 40) + 20); // 20-60 km/h
      setEta(new Date(Date.now() + Math.random() * 300000).toLocaleTimeString()); // Random ETA
    }, 2000); // Update every 2 seconds
    
    return () => {
      clearInterval(interval);
      setIsAnimating(false);
    };
  }, [isActive, positions.length]);
  
  if (!isActive || positions.length === 0 || !isAnimating) return null;
  
  const currentPosition = positions[currentIndex];
  const nextIndex = (currentIndex + 1) % positions.length;
  const nextPosition = positions[nextIndex];
  
  // Calculate rotation angle based on movement direction
  const angle = Math.atan2(
    nextPosition[0] - currentPosition[0],
    nextPosition[1] - currentPosition[1]
  ) * 180 / Math.PI;
  
  return (
    <Marker
      position={currentPosition}
      icon={createTruckIcon(selectedRoute.status, true)}
    >
      <Popup>
        <div className="min-w-[200px]">
          <h4 className="m-0 mb-2 text-sm font-semibold text-green-800">🚛 Live Truck Tracking</h4>
          <div className="space-y-1 text-xs">
            <p className="m-0">
              <strong>Driver:</strong> {selectedRoute?.driver}
            </p>
            <p className="m-0">
              <strong>Status:</strong> {selectedRoute?.status}
            </p>
            <p className="m-0">
              <strong>Current Point:</strong> {currentIndex + 1} of {positions.length}
            </p>
            <p className="m-0">
              <strong>Speed:</strong> {speed} km/h
            </p>
            <p className="m-0">
              <strong>ETA:</strong> {eta}
            </p>
            <p className="m-0">
              <strong>Route:</strong> {selectedRoute?.barangay}
            </p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// Component to handle map bounds updates
function MapBoundsUpdater({ bounds }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [bounds, map]);
  
  return null;
}

// Add this component near your other map-related components
function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

// Component to handle map tile updates
function MapTileController({ tileType }) {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      // Remove existing tile layer
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          map.removeLayer(layer);
        }
      });
      
      // Add new tile layer
      const newTileLayer = L.tileLayer(MAP_TILES[tileType], {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
      newTileLayer.addTo(map);
    }
  }, [map, tileType]);
  
  return null;
}

const ManageRoute = () => {
  const [scheduledRoutes, setScheduledRoutes] = useState([]);
  const [manualRoutes, setManualRoutes] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [driver, setDriver] = useState("All");
  const [barangay, setBarangay] = useState("All");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Set to today's date
  const [modalRoute, setModalRoute] = useState(null);
  const [modalTab, setModalTab] = useState('details');
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [formRoute, setFormRoute] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [assignData, setAssignData] = useState({ trucks: [], teams: [] });
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ id: null, truck_id: '', team_id: '' });
  const [mapCenter, setMapCenter] = useState([13.7766, 122.9826]);
  const [mapZoom, setMapZoom] = useState(13);
  const [mapBounds, setMapBounds] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [mapTile, setMapTile] = useState('street');
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch scheduled routes from API whenever date changes
  useEffect(() => {
    const loadScheduledRoutes = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const routes = await fetchScheduledRoutes(date);
        setScheduledRoutes(routes);
      } catch (err) {
        setError(`Failed to load scheduled routes: ${err.message}`);
        console.error('Error loading routes:', err);
        // Set empty array as fallback
        setScheduledRoutes([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadScheduledRoutes();
  }, [date]);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const routes = await fetchScheduledRoutes(date);
      setScheduledRoutes(routes);
    } catch (err) {
      setError(`Failed to refresh routes: ${err.message}`);
      console.error('Error refreshing routes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate daily routes for selected date
  const handleRegenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/regenerate_routes.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, policy: 'preserve_manual', scope: 'all' })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Regenerate failed');
      await handleRefresh();
    } catch (err) {
      setError(`Failed to regenerate routes: ${err.message}`);
      console.error('Error regenerating routes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Assignment helpers
  async function openAssign() {
    if (!selectedRoute?.id) return;
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/get_assignment_options.php`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to load assignment options');
      setAssignData({ trucks: data.trucks || [], teams: data.teams || [] });
      setAssignForm({ id: selectedRoute.id, truck_id: selectedRoute.truck_id || '', team_id: selectedRoute.team_id || '' });
      setShowAssign(true);
    } catch (e) {
      setError(`Failed to load assignment options: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function submitAssign(e) {
    e?.preventDefault?.();
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/update_route_assignment.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to update assignment');
      setShowAssign(false);
      await handleRefresh();
    } catch (e) {
      setError(`Failed to update assignment: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle map tile change
  const handleMapTileChange = (tileType) => {
    setMapTile(tileType);
  };

  // Load assignment options once
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/get_assignment_options.php`);
        const data = await res.json();
        if (data.success) setAssignData({ trucks: data.trucks || [], teams: data.teams || [] });
      } catch (e) {
        console.error('Failed to load assignment options', e);
      }
    })();
  }, []);

  // Combine scheduled and manual routes for display
  const allRoutes = [...scheduledRoutes, ...manualRoutes];

  // Filter routes by search, status, driver, barangay, and date
  const filteredRoutes = allRoutes.filter(route =>
    (route.name.toLowerCase().includes(search.toLowerCase()) ||
      route.driver.toLowerCase().includes(search.toLowerCase())) &&
    (status === "All" || route.status === status) &&
    (driver === "All" || route.driver === driver) &&
    (barangay === "All" || route.barangay === barangay) &&
    (route.datetime.startsWith(date))
  );

  // Function to handle route row click
  const handleRouteClick = async (route) => {
    setSelectedRoute(route);
    setModalRoute(route);
    setModalTab('details');
    setShowAnimation(false); // Reset animation when selecting new route
    
    // If this is a generated route with id, load its ordered stops
    if (route?.id) {
      try {
        setIsDetailsLoading(true);
        const full = await fetchRouteDetails(route.id);
        // Map backend stops to collectionPoints expected by UI
        const points = (full.stops || [])
          .filter(s => s.lat !== null && s.lng !== null)
          .sort((a, b) => (a.seq || 0) - (b.seq || 0))
          .map((s, idx) => ({
            name: s.name || `Stop ${s.seq || idx + 1}`,
            time: s.window_start ? String(s.window_start).slice(0,5) : '',
            volume: s.planned_volume_kg ? (Number(s.planned_volume_kg)/1000).toFixed(1) + ' tons' : '0.0 tons',
            coordinates: [parseFloat(s.lat), parseFloat(s.lng)]
          }));
        const merged = {
          ...route,
          collectionPoints: points,
        };
        setSelectedRoute(merged);
        setModalRoute(merged);
        // Auto-zoom to stops if available
        if (points.length > 0) {
          const bounds = L.latLngBounds(points.map(pt => pt.coordinates));
          setMapBounds(bounds);
          setMapZoom(15);
          setMapCenter(points[0].coordinates);
        }
      } catch (err) {
        setError(`Failed to load route details: ${err.message}`);
      } finally {
        setIsDetailsLoading(false);
      }
    }

    // Use actual coordinates from collection_point table if available
    if (route.latitude && route.longitude) {
      const actualCoords = [parseFloat(route.latitude), parseFloat(route.longitude)];
      setMapCenter(actualCoords);
      setMapZoom(16); // Higher zoom for specific location
      
      // Calculate bounds for collection points if they have real coordinates
      if (route.collectionPoints && route.collectionPoints.length > 0) {
        const pointsWithRealCoords = route.collectionPoints.filter(pt => 
          pt.coordinates && Array.isArray(pt.coordinates) && pt.coordinates.length === 2
        );
        
        if (pointsWithRealCoords.length > 0) {
          const bounds = L.latLngBounds(pointsWithRealCoords.map(pt => pt.coordinates));
          setMapBounds(bounds);
        } else {
          // Fallback to barangay coordinates if no real collection point coordinates
          const barangayCoords = BARANGAY_COORDINATES[route.barangay];
          if (barangayCoords) {
            setMapCenter(barangayCoords);
            setMapZoom(15);
          }
        }
      }
    } else {
      // Fallback to barangay coordinates if no collection point coordinates
      const barangayCoords = BARANGAY_COORDINATES[route.barangay];
      if (barangayCoords) {
        setMapCenter(barangayCoords);
        setMapZoom(15);
      }
    }
  };

  // Function to handle barangay click
  const handleBarangayClick = (route, e) => {
    e.stopPropagation(); // Prevent triggering the row click
    
    // Use actual coordinates from collection_point table if available
    if (route.latitude && route.longitude) {
      const actualCoords = [parseFloat(route.latitude), parseFloat(route.longitude)];
      setSelectedRoute(route);
      setMapCenter(actualCoords);
      setMapZoom(16); // Higher zoom level for specific location
      
      // Optional: Add a timeout to allow the map to settle
      setTimeout(() => {
        if (route.collectionPoints?.length > 0) {
          const pointsWithRealCoords = route.collectionPoints.filter(pt => 
            pt.coordinates && Array.isArray(pt.coordinates) && pt.coordinates.length === 2
          );
          
          if (pointsWithRealCoords.length > 0) {
            const bounds = L.latLngBounds(pointsWithRealCoords.map(pt => pt.coordinates));
            setMapBounds(bounds);
          }
        }
      }, 500);
    } else {
      // Fallback to barangay coordinates
      const barangayCoords = BARANGAY_COORDINATES[route.barangay];
      if (barangayCoords) {
        setSelectedRoute(route);
        setMapCenter(barangayCoords);
        setMapZoom(16); // Higher zoom level for barangay view
        
        // Optional: Add a timeout to allow the map to settle
        setTimeout(() => {
          if (route.collectionPoints?.length > 0) {
            const bounds = L.latLngBounds(route.collectionPoints.map(pt => pt.coordinates));
            setMapBounds(bounds);
          }
        }, 500);
      }
    }
  };

  // Function to clear route selection
  const clearRouteSelection = () => {
    setSelectedRoute(null);
    setMapCenter([13.7766, 122.9826]);
    setMapZoom(13);
    setMapBounds(null);
    setShowAnimation(false); // Stop animation when clearing
  };

  // Function to toggle animation
  const toggleAnimation = () => {
    if (selectedRoute && selectedRoute.collectionPoints && selectedRoute.collectionPoints.length > 0) {
      setShowAnimation(!showAnimation);
    }
  };

  // Function to get route statistics
  const getRouteStats = () => {
    if (!selectedRoute) return null;
    
    const totalPoints = selectedRoute.collectionPoints.length;
    const totalVolume = selectedRoute.collectionPoints.reduce((sum, pt) => 
      sum + parseFloat(pt.volume), 0
    );
    const avgTimePerPoint = totalPoints > 0 ? 
      Math.round((new Date(`2025-01-20 ${selectedRoute.datetime.split(', ')[1].split(' - ')[1]}`) - 
                 new Date(`2025-01-20 ${selectedRoute.datetime.split(', ')[1].split(' - ')[0]}`)) / 
                 (totalPoints * 60000)) : 0;

    return {
      totalPoints,
      totalVolume: totalVolume.toFixed(1),
      avgTimePerPoint,
      driver: selectedRoute.driver,
      truck: selectedRoute.truck
    };
  };

  // --- Add/Edit Route Modal Logic ---
  // Only allow add/edit for manual routes
  const emptyRoute = {
    name: '',
    truck: '',
    driver: DRIVERS[0],
    barangay: BARANGAYS[0],
    datetime: date + ', 08:00 - 12:00',
    volume: '',
    status: STATUSES[0],
    coordinates: [13.7766, 122.9826],
    collectionPoints: [],
    driverNotes: '',
    complaints: []
  };

  function openAddRoute() {
    setFormMode('add');
    setFormRoute({ ...emptyRoute });
    setShowForm(true);
  }
  function openEditRoute(route) {
    // Only allow edit for manual routes
    if (manualRoutes.includes(route)) {
      setFormMode('edit');
      setFormRoute({ ...route });
      setShowForm(true);
    }
  }
  function closeForm() {
    setShowForm(false);
    setFormRoute(null);
  }
  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormRoute(r => ({ ...r, [name]: value }));
  }
  function handleFormSubmit(e) {
    e.preventDefault();
    if (formMode === 'add') {
      setManualRoutes(rs => [
        ...rs,
        {
          ...formRoute,
          coordinates: BARANGAY_COORDINATES[formRoute.barangay] || [13.7766, 122.9826],
          statusColor: getStatusColor(formRoute.status),
          collectionPoints: formRoute.collectionPoints || [],
          complaints: formRoute.complaints || [],
        }
      ]);
    } else if (formMode === 'edit') {
      setManualRoutes(rs => rs.map(r =>
        r === modalRoute ? {
          ...formRoute,
          coordinates: BARANGAY_COORDINATES[formRoute.barangay] || [13.7766, 122.9826],
          statusColor: getStatusColor(formRoute.status),
          collectionPoints: formRoute.collectionPoints || [],
          complaints: formRoute.complaints || [],
        } : r
      ));
      setModalRoute({ ...formRoute, coordinates: BARANGAY_COORDINATES[formRoute.barangay] || [13.7766, 122.9826], statusColor: getStatusColor(formRoute.status) });
    }
    closeForm();
  }

  // --- Delete Logic ---
  function handleDeleteRoute() {
    // Only allow delete for manual routes
    if (manualRoutes.includes(modalRoute)) {
      setManualRoutes(rs => rs.filter(r => r !== modalRoute));
      setModalRoute(null);
      setShowDeleteConfirm(false);
    }
  }

  // --- Assign Truck/Team ---
  function openAssign(route){
    setAssignForm({ id: route.id, truck_id: route.truck_id || '', team_id: route.team_id || '' });
    setShowAssign(true);
  }
  function closeAssign(){ setShowAssign(false); }
  async function submitAssign(e){
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/update_route_assignment.php`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to update assignment');
      setShowAssign(false);
      await handleRefresh();
    } catch (err) {
      setError(`Failed to update assignment: ${err.message}`);
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case "Scheduled": return { bg: 'bg-green-50', color: 'text-green-800' };
      case "In Progress": return { bg: 'bg-yellow-100', color: 'text-yellow-700' };
      case "Completed": return { bg: 'bg-green-100', color: 'text-green-700' };
      case "Missed": return { bg: 'bg-red-100', color: 'text-red-700' };
      default: return { bg: 'bg-gray-100', color: 'text-gray-800' };
    }
  }

  // Export to CSV
  function exportToCSV() {
    const headers = ['Location', 'Truck', 'Driver', 'Barangay', 'Date & Time', 'Volume', 'Status'];
    const rows = filteredRoutes.map(r => [
      r.locationName || 'Main Area', 
      r.truck, 
      r.driver, 
      r.barangay, 
      r.datetime, 
      r.volume, 
      r.status
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => '"' + (cell || '') + '"').join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'routes.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Print
  function printTable() {
    const printContent = document.getElementById('route-table-print').outerHTML;
    const win = window.open('', '', 'width=900,height=700');
    win.document.write('<html><head><title>Print Route Schedule</title>');
    win.document.write('<style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f1f5f9}</style>');
    win.document.write('</head><body>');
    win.document.write('<h2>Route Schedule - ' + date + '</h2>');
    win.document.write('<p>Generated on: ' + new Date().toLocaleString() + '</p>');
    win.document.write(printContent);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  }

  // Live Status Update (simulate)
  function randomStatus() {
    const statuses = ['Scheduled', 'In Progress', 'Completed', 'Missed'];
    setManualRoutes(rs => rs.map(r => {
      if (Math.random() < 0.3) {
        const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
        return { ...r, status: newStatus, statusColor: getStatusColor(newStatus) };
      }
      return r;
    }));
  }

  return (
    <div className="p-6 max-w-full overflow-x-auto bg-emerald-50 min-h-screen font-sans">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl text-green-800 mb-2 font-normal tracking-tight">
          Route Management
      </h1>
        <p className="text-sm md:text-base lg:text-lg text-gray-600 m-0 font-normal">
          Sustainable waste collection with real-time route management
        </p>
      </div>

      {/* Action Buttons - Minimal Design */}
      <div className="flex gap-3 my-6 flex-wrap justify-start">
        <button onClick={openAddRoute} className="px-5 py-2.5 bg-green-700 text-white border-none rounded-md font-medium cursor-pointer text-sm min-w-fit transition-all duration-200 hover:bg-green-600">
          Add Route
        </button>
        <button
          onClick={handleRegenerate}
          disabled={isLoading}
          className={`px-5 py-2.5 text-white border-none rounded-md font-medium cursor-pointer text-sm min-w-fit transition-all duration-200 ${
            isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-600'
          }`}
        >
          {isLoading ? 'Working…' : 'Regenerate'}
        </button>
        <button onClick={exportToCSV} className="px-5 py-2.5 bg-green-700 text-white border-none rounded-md font-medium cursor-pointer text-sm min-w-fit transition-all duration-200 hover:bg-green-600">
          Export CSV
        </button>
        <button onClick={printTable} className="px-5 py-2.5 bg-green-700 text-white border-none rounded-md font-medium cursor-pointer text-sm min-w-fit transition-all duration-200 hover:bg-green-600">
          Print
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <span className="text-red-800 text-sm">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Filters - Minimal Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 items-center justify-center p-4 bg-white rounded-lg border border-gray-200">
        <div className="relative w-full">
        <input
          type="text"
          placeholder="Search routes, drivers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
            className="w-full pl-3 pr-3 py-2 rounded-md border border-gray-200 text-sm bg-white text-gray-800 outline-none transition-all duration-200 focus:border-green-800"
          />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm bg-white text-gray-800 outline-none cursor-pointer transition-all duration-200 focus:border-green-800">
          <option>All</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={driver} onChange={e => setDriver(e.target.value)} className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm bg-white text-gray-800 outline-none cursor-pointer transition-all duration-200 focus:border-green-800">
          <option>All</option>
          {DRIVERS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={barangay} onChange={e => setBarangay(e.target.value)} className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm bg-white text-gray-800 outline-none cursor-pointer transition-all duration-200 focus:border-green-800">
          <option>All</option>
          {BARANGAYS.map(b => <option key={b}>{b}</option>)}
        </select>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm bg-white text-gray-800 outline-none transition-all duration-200 focus:border-green-800"
        />
      </div>

      {/* Summary Cards - Minimal Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
          <div className="text-sm text-gray-600 mb-2">Total Routes</div>
          <div className="text-2xl font-normal text-green-800">
            {isLoading ? '...' : filteredRoutes.length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
          <div className="text-sm text-gray-600 mb-2">Completed</div>
          <div className="text-2xl font-normal text-green-600">
            {isLoading ? '...' : filteredRoutes.filter(r => r.status === "Completed").length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
          <div className="text-sm text-gray-600 mb-2">Missed</div>
          <div className="text-2xl font-normal text-red-500">
            {isLoading ? '...' : filteredRoutes.filter(r => r.status === "Missed").length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
          <div className="text-sm text-gray-600 mb-2">Volume (tons)</div>
          <div className="text-2xl font-normal text-green-600">
            {isLoading ? '...' : filteredRoutes.reduce((sum, r) => {
              const volume = parseFloat(r.volume) || 0;
              return sum + volume;
            }, 0).toFixed(1)}
          </div>
        </div>
      </div>

      {/* Main Content: Table + Map Panel - Minimal Design */}
      <div className="flex gap-5 flex-col lg:flex-row">
        <div className="flex-2 min-w-0">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-lg mb-4 text-green-800 font-medium">Route Schedule</h2>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <div id="route-table-print" className="min-w-full">
                <table className="w-full border-collapse min-w-[700px] text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="p-3 text-left font-medium text-gray-800 text-xs w-[15%] min-w-[120px]">Location</th>
                      <th className="p-3 text-left font-medium text-gray-800 text-xs w-[12%] min-w-[100px]">Truck</th>
                      <th className="p-3 text-left font-medium text-gray-800 text-xs w-[15%] min-w-[120px]">Driver</th>
                      <th className="p-3 text-left font-medium text-gray-800 text-xs w-[15%] min-w-[120px]">Barangay</th>
                      <th className="p-3 text-left font-medium text-gray-800 text-xs w-[18%] min-w-[140px]">Date & Time</th>
                      <th className="p-3 text-left font-medium text-gray-800 text-xs w-[10%] min-w-[80px]">Volume</th>
                      <th className="p-3 text-left font-medium text-gray-800 text-xs w-[15%] min-w-[110px]">Status</th>
                      <th className="p-3 text-left font-medium text-gray-800 text-xs w-[10%] min-w-[80px]">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500 text-sm">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-2"></div>
                            Loading scheduled routes...
                          </div>
                        </td>
                      </tr>
                    ) : filteredRoutes.length > 0 ? (
                      filteredRoutes.map((route, idx) => (
                        <tr 
                          key={idx} 
                          onClick={() => handleRouteClick(route)} 
                          className={`cursor-pointer border-b border-green-200 transition-all duration-200 ${
                            selectedRoute === route ? 'bg-green-50' : 'hover:bg-green-50'
                          }`}
                        >
                          <td className="p-3 text-blue-600 font-medium">
                            <div className="truncate max-w-[120px]" title={route.locationName || 'Main Area'}>
                              {route.locationName || 'Main Area'}
                            </div>
                          </td>
                          <td className="p-3 text-gray-600">
                            <div className="truncate max-w-[100px]" title={route.truck}>
                              {route.truck}
                            </div>
                          </td>
                          <td className="p-3 text-gray-800">
                            <div className="truncate max-w-[120px]" title={route.driver}>
                              {route.driver}
                            </div>
                          </td>
                          <td 
                            className="p-3 cursor-pointer text-green-800 underline font-medium hover:text-green-600 transition-colors duration-200"
                            onClick={(e) => handleBarangayClick(route, e)}
                          >
                            <div className="truncate max-w-[120px]" title={route.barangay}>
                              {route.barangay}
                            </div>
                          </td>
                          <td className="p-3 text-gray-600">
                            <div className="truncate max-w-[140px]" title={route.datetime}>
                              {route.datetime}
                            </div>
                          </td>
                          <td className="p-3 text-gray-800 font-medium">
                            <div className="truncate max-w-[80px]" title={route.volume}>
                              {route.volume}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              route.status === "Scheduled" ? "bg-green-50 text-green-800" :
                              route.status === "In Progress" ? "bg-yellow-100 text-yellow-700" :
                              route.status === "Completed" ? "bg-green-100 text-green-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {route.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${route.source === 'manual' ? 'bg-gray-100 text-gray-700' : 'bg-blue-50 text-blue-700'}`}>
                              {route.source === 'manual' ? 'Manual' : 'Generated'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500 text-sm">
                          {scheduledRoutes.length === 0 && manualRoutes.length === 0 
                            ? 'No routes found for the selected date.' 
                            : 'No routes match the current filters.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Map Panel - Enhanced Design */}
        <div className="flex-1 min-w-0 lg:min-w-[300px]">
          <div className="bg-white rounded-lg border border-green-200 p-5 h-fit">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg m-0 text-green-800 font-medium">Interactive Map</h2>
                <div className="flex gap-2 flex-wrap">
                  {/* Map Controls */}
                  <select 
                    value={mapTile}
                    onChange={(e) => handleMapTileChange(e.target.value)}
                    className="px-3 py-1.5 bg-green-50 text-gray-800 border border-green-200 rounded text-xs cursor-pointer transition-all duration-200 focus:border-green-800"
                  >
                    <option value="street">Street View</option>
                    <option value="satellite">Satellite</option>
                    <option value="terrain">Terrain</option>
                  </select>
                  

                  
                  {selectedRoute && (
                    <button 
                      onClick={clearRouteSelection}
                      className="px-3 py-1.5 bg-green-50 text-gray-800 border border-green-200 rounded text-xs cursor-pointer transition-all duration-200 hover:bg-green-100"
                    >
                      Clear
                    </button>
                  )}
                  {selectedRoute && selectedRoute.collectionPoints && selectedRoute.collectionPoints.length > 0 && (
                    <button 
                      onClick={toggleAnimation}
                      className={`px-3 py-1.5 border border-green-200 rounded text-xs cursor-pointer transition-all duration-200 ${
                        showAnimation 
                          ? 'bg-green-600 text-white' 
                          : 'bg-green-50 text-gray-800 hover:bg-green-100'
                      }`}
                    >
                      {showAnimation ? 'Stop' : 'Animate'}
                    </button>
                  )}
                  <button 
                    onClick={() => setMapZoom(13)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-xs cursor-pointer transition-all duration-200 hover:bg-blue-100"
                  >
                    Reset View
                  </button>
                </div>
              </div>

              <div className="h-80 rounded-md overflow-hidden border border-green-200 relative">
                <MapContainer 
                  center={MAP_CONFIG.center}
                  zoom={MAP_CONFIG.zoom}
                  className="h-full w-full"
                  maxBounds={MAP_CONFIG.bounds}
                  minZoom={MAP_CONFIG.minZoom}
                  maxZoom={MAP_CONFIG.maxZoom}
                >
                  <MapTileController tileType={mapTile} />
                  
                  {/* Main Sipocot Marker */}
                  <Marker position={MAP_CONFIG.center}>
                    <Popup>
                      <div className="p-2.5 text-center font-sans">
                        <h3 className="m-0 mb-1 text-green-800">Sipocot</h3>
                        <p className="m-0 text-gray-800">Camarines Sur</p>
                      </div>
                    </Popup>
                  </Marker>



                  {/* Barangay Markers */}
                  {Object.entries(BARANGAY_COORDINATES).map(([name, coords]) => (
                    <CircleMarker
                      key={name}
                      center={coords}
                      radius={4}
                      pathOptions={{
                        color: '#2d5016',
                        fillColor: '#27ae60',
                        fillOpacity: 0.6,
                        weight: 1
                      }}
                    >
                      <Popup>
                        <div className="p-2 text-center min-w-[150px]">
                          <strong className="text-green-800">{name}</strong>
                          <p className="m-1 text-xs text-gray-800">
                            Barangay of Sipocot
                          </p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}

                  {/* Route Lines and Collection Points */}
                  {selectedRoute?.collectionPoints?.map((point, index, points) => (
                    <React.Fragment key={index}>
                      <Marker 
                        position={point.coordinates}
                        icon={createCollectionPointIcon(
                          point.name.includes('Start') ? 'start' : 
                          point.name.includes('End') ? 'end' : 'middle', 
                          parseFloat(point.volume) || 0
                        )}
                      >
                        <Popup>
                          <div className="p-2.5 min-w-[200px] font-sans">
                            <h4 className="m-0 mb-2 text-green-800">{point.name}</h4>
                            <p className="m-1 text-gray-800">
                              <strong>Time:</strong> {point.time}
                            </p>
                            <p className="m-1 text-gray-800">
                              <strong>Volume:</strong> {point.volume}
                            </p>
                            <p className="m-1 text-gray-600 text-xs">
                              <strong>Coordinates:</strong> {point.coordinates[0].toFixed(6)}, {point.coordinates[1].toFixed(6)}
                            </p>
                            {selectedRoute.latitude && selectedRoute.longitude && (
                              <p className="m-1 text-blue-600 text-xs">
                                <strong>Collection Point:</strong> {selectedRoute.locationName || 'Main Area'}
                              </p>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                      
                      {index < points.length - 1 && (
                        <Polyline
                          positions={[point.coordinates, points[index + 1].coordinates]}
                          pathOptions={{
                            color: '#2d5016',
                            weight: 3,
                            opacity: 0.7,
                            dashArray: '5, 10'
                          }}
                        />
                      )}
                    </React.Fragment>
                  ))}

                  {/* Live Truck Tracking */}
                  {showAnimation && selectedRoute && (
                    <AnimatedTruck 
                      positions={selectedRoute.collectionPoints.map(pt => pt.coordinates)}
                      isActive={showAnimation}
                      selectedRoute={selectedRoute}
                    />
                  )}

                  {/* Map Bounds Controller */}
                  <MapBoundsUpdater bounds={mapBounds} />
                  <MapController center={mapCenter} zoom={mapZoom} />
                  
                  {/* Selected Barangay Highlight */}
                  {selectedRoute && BARANGAY_COORDINATES[selectedRoute.barangay] && (
                    <CircleMarker
                      center={BARANGAY_COORDINATES[selectedRoute.barangay]}
                      radius={8}
                      pathOptions={{
                        color: '#2d5016',
                        fillColor: '#27ae60',
                        fillOpacity: 0.8,
                        weight: 2
                      }}
                    >
                      <Popup>
                        <div className="text-center">
                          <strong>{selectedRoute.barangay}</strong>
                          <p className="m-1">Barangay of Sipocot</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  )}

                  {/* Actual Collection Point Location (if available) */}
                  {selectedRoute && selectedRoute.latitude && selectedRoute.longitude && (
                    <CircleMarker
                      center={[parseFloat(selectedRoute.latitude), parseFloat(selectedRoute.longitude)]}
                      radius={12}
                      pathOptions={{
                        color: '#3b82f6',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.9,
                        weight: 3
                      }}
                    >
                      <Popup>
                        <div className="text-center min-w-[200px]">
                          <strong className="text-blue-800">📍 Collection Point</strong>
                          <p className="m-1 text-sm">{selectedRoute.locationName || 'Main Area'}</p>
                          <p className="m-1 text-xs text-gray-600">
                            Coordinates: {parseFloat(selectedRoute.latitude).toFixed(6)}, {parseFloat(selectedRoute.longitude).toFixed(6)}
                          </p>
                          <p className="m-1 text-xs text-gray-600">
                            Barangay: {selectedRoute.barangay}
                          </p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  )}
                </MapContainer>

                {/* Live Tracking Status Overlay */}
                {showAnimation && selectedRoute && (
                  <div className="absolute top-2 right-2 bg-white bg-opacity-90 p-2 rounded-lg border border-green-200">
                    <div className="text-xs text-green-800 font-medium">🚛 Live Tracking</div>
                    <div className="text-xs text-gray-600">{selectedRoute.driver}</div>
                  </div>
                )}
              </div>

              {/* Enhanced Map Legend */}
              <div className="mt-3 p-3 bg-green-50 rounded-md text-xs">
                <div className="font-medium mb-1.5 text-gray-800">Legend:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-3 bg-green-600 rounded-sm"></div>
                    <span className="text-gray-800">Start Point</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-3 bg-orange-500 rounded-sm"></div>
                    <span className="text-gray-800">Middle Point</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-3 bg-red-500 rounded-sm"></div>
                    <span className="text-gray-800">End Point</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-3 bg-green-400 rounded-sm"></div>
                    <span className="text-gray-800">Moving Truck</span>
                  </div>
                </div>
                

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {modalRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
          onClick={() => setModalRoute(null)}
        >
          <div
            className="bg-white rounded-xl shadow-lg min-w-[340px] max-w-full w-full sm:w-[540px] max-h-[80vh] relative flex flex-col overflow-hidden border border-green-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b border-green-200 flex">
              <button
                onClick={() => setModalTab('details')}
                className={`flex-1 py-3 border-none font-medium text-sm cursor-pointer transition-all duration-200 ${
                  modalTab === 'details' 
                    ? 'bg-white text-green-800 border-b-2 border-green-800' 
                    : 'bg-transparent text-gray-500 border-b-2 border-transparent'
                }`}
              >Details</button>
              <button
                onClick={() => setModalTab('notes')}
                className={`flex-1 py-3 border-none font-medium text-sm cursor-pointer transition-all duration-200 ${
                  modalTab === 'notes' 
                    ? 'bg-white text-green-800 border-b-2 border-green-800' 
                    : 'bg-transparent text-gray-500 border-b-2 border-transparent'
                }`}
              >Complaints/Notes</button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              {modalTab === 'details' && (
                <div>
                  {isDetailsLoading && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">Loading route details…</div>
                  )}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <div className="font-medium mb-1 text-gray-500 text-xs">Route Name</div>
                      <div className="text-gray-800 text-sm">{modalRoute.name}</div>
                    </div>
                    <div>
                      <div className="font-medium mb-1 text-gray-500 text-xs">Status</div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        modalRoute.status === "Scheduled" ? "bg-green-50 text-green-800" :
                        modalRoute.status === "In Progress" ? "bg-yellow-100 text-yellow-700" :
                        modalRoute.status === "Completed" ? "bg-green-100 text-green-700" :
                        "bg-red-100 text-red-700"
                      }`}>{modalRoute.status}</span>
                    </div>
                    <div>
                      <div className="font-medium mb-1 text-gray-500 text-xs">Location</div>
                      <div className="text-gray-800 text-sm">{modalRoute.locationName || 'Main Area'}</div>
                    </div>
                    <div>
                      <div className="font-medium mb-1 text-gray-500 text-xs">Truck</div>
                      <div className="text-gray-800 text-sm">{modalRoute.truck}</div>
                    </div>
                    <div>
                      <div className="font-medium mb-1 text-gray-500 text-xs">Driver</div>
                      <div className="text-gray-800 text-sm">{modalRoute.driver}</div>
                    </div>
                    <div>
                      <div className="font-medium mb-1 text-gray-500 text-xs">Barangay</div>
                      <div className="text-gray-800 text-sm">{modalRoute.barangay}</div>
                    </div>
                    <div>
                      <div className="font-medium mb-1 text-gray-500 text-xs">Date & Time</div>
                      <div className="text-gray-800 text-sm">{modalRoute.datetime}</div>
                    </div>
                    <div>
                      <div className="font-medium mb-1 text-gray-500 text-xs">Total Volume</div>
                      <div className="text-gray-800 text-sm">{modalRoute.volume}</div>
                    </div>
                    {modalRoute.latitude && modalRoute.longitude && (
                      <div>
                        <div className="font-medium mb-1 text-gray-500 text-xs">Collection Point Coordinates</div>
                        <div className="text-gray-800 text-sm">
                          {parseFloat(modalRoute.latitude).toFixed(6)}, {parseFloat(modalRoute.longitude).toFixed(6)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="font-medium my-5 text-gray-800 text-sm">Collection Points</div>
                  <table className="w-full border-collapse mb-2 text-xs">
                    <thead>
                      <tr className="bg-green-50 border-b border-green-200">
                        <th className="p-1.5 text-left font-medium text-gray-800">Point</th>
                        <th className="p-1.5 text-left font-medium text-gray-800">Time</th>
                        <th className="p-1.5 text-left font-medium text-gray-800">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalRoute.collectionPoints.map((pt, i) => (
                        <tr key={i} className="border-b border-green-200">
                          <td className="p-1.5 text-gray-800">{pt.name}</td>
                          <td className="p-1.5 text-gray-600">{pt.time}</td>
                          <td className="p-1.5 text-gray-800">{pt.volume}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {modalTab === 'notes' && (
                <div>
                  {modalRoute.driverNotes && (
                    <div className="mb-4">
                      <div className="font-medium mb-1 text-gray-800 text-sm">Driver Notes</div>
                      <div className="text-gray-800 text-sm p-3 bg-green-50 rounded-md border border-green-200">{modalRoute.driverNotes}</div>
                    </div>
                  )}
                  {modalRoute.complaints && modalRoute.complaints.length > 0 ? (
                    <div>
                      <div className="font-medium mb-1 text-gray-800 text-sm">Resident Complaints</div>
                      <ul className="m-0 pl-4">
                        {modalRoute.complaints.map((c, i) => (
                          <li key={i} className="text-gray-800 text-sm mb-1">{c}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm p-3 bg-green-50 rounded-md border border-green-200">
                      No resident complaints.
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="border-t border-green-200 p-4 text-right bg-green-50 flex gap-2 justify-end">
              {manualRoutes.includes(modalRoute) && (
                <>
                  <button className="px-4 py-2 bg-green-600 text-white border-none rounded-md font-medium text-xs cursor-pointer transition-all duration-200 hover:bg-green-800" onClick={() => openEditRoute(modalRoute)}>Edit</button>
                  <button className="px-4 py-2 bg-red-500 text-white border-none rounded-md font-medium text-xs cursor-pointer transition-all duration-200 hover:bg-orange-500" onClick={() => setShowDeleteConfirm(true)}>Delete</button>
                </>
              )}
              {/* Assignment happens in Task Management; hide manual Assign here */}
              <button className="px-5 py-2 bg-green-800 text-white border-none rounded-md font-medium text-xs cursor-pointer transition-all duration-200 hover:bg-green-600" onClick={() => setModalRoute(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Route Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
          onClick={closeForm}
        >
          <form
            className="bg-white rounded-xl shadow-lg min-w-[340px] max-w-full w-full sm:w-[540px] max-h-[80vh] relative flex flex-col overflow-hidden p-6 gap-4 border border-green-200"
            onClick={e => e.stopPropagation()}
            onSubmit={handleFormSubmit}
          >
            <h2 className="text-lg mb-2 text-green-800 font-medium">{formMode === 'add' ? 'Add Route' : 'Edit Route'}</h2>
            <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-y-auto">
              <div className="flex-1">
                <div className="mb-3">
                  <label className="block mb-1 font-medium text-xs text-gray-800">Route Name</label>
                  <input 
                    name="name" 
                    value={formRoute.name} 
                    onChange={handleFormChange} 
                    required 
                    className="w-full px-3 py-2 rounded-md border border-green-200 mt-0.5 text-sm bg-green-50 text-gray-800 outline-none transition-all duration-200 focus:border-green-800"
                  />
                </div>
                <div className="mb-3">
                  <label className="block mb-1 font-medium text-xs text-gray-800">Truck</label>
                  <input 
                    name="truck" 
                    value={formRoute.truck} 
                    onChange={handleFormChange} 
                    required 
                    className="w-full px-3 py-2 rounded-md border border-green-200 mt-0.5 text-sm bg-green-50 text-gray-800 outline-none transition-all duration-200 focus:border-green-800"
                  />
                </div>
                <div className="mb-3">
                  <label className="block mb-1 font-medium text-xs text-gray-800">Driver</label>
                  <select 
                    name="driver" 
                    value={formRoute.driver} 
                    onChange={handleFormChange} 
                    className="w-full px-3 py-2 rounded-md border border-green-200 mt-0.5 text-sm bg-green-50 text-gray-800 outline-none cursor-pointer transition-all duration-200 focus:border-green-800"
                  >
                    {DRIVERS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block mb-1 font-medium text-xs text-gray-800">Barangay</label>
                  <select 
                    name="barangay" 
                    value={formRoute.barangay} 
                    onChange={handleFormChange} 
                    className="w-full px-3 py-2 rounded-md border border-green-200 mt-0.5 text-sm bg-green-50 text-gray-800 outline-none cursor-pointer transition-all duration-200 focus:border-green-800"
                  >
                    {BARANGAYS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block mb-1 font-medium text-xs text-gray-800">Date & Time</label>
                  <input 
                    name="datetime" 
                    value={formRoute.datetime} 
                    onChange={handleFormChange} 
                    required 
                    className="w-full px-3 py-2 rounded-md border border-green-200 mt-0.5 text-sm bg-green-50 text-gray-800 outline-none transition-all duration-200 focus:border-green-800"
                  />
                </div>
                <div className="mb-3">
                  <label className="block mb-1 font-medium text-xs text-gray-800">Total Volume (tons)</label>
                  <input 
                    name="volume" 
                    value={formRoute.volume} 
                    onChange={handleFormChange} 
                    required 
                    className="w-full px-3 py-2 rounded-md border border-green-200 mt-0.5 text-sm bg-green-50 text-gray-800 outline-none transition-all duration-200 focus:border-green-800"
                  />
                </div>
                <div className="mb-3">
                  <label className="block mb-1 font-medium text-xs text-gray-800">Status</label>
                  <select 
                    name="status" 
                    value={formRoute.status} 
                    onChange={handleFormChange} 
                    className="w-full px-3 py-2 rounded-md border border-green-200 mt-0.5 text-sm bg-green-50 text-gray-800 outline-none cursor-pointer transition-all duration-200 focus:border-green-800"
                  >
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-3">
                  <label className="block mb-1 font-medium text-xs text-gray-800">Driver Notes</label>
                  <textarea 
                    name="driverNotes" 
                    value={formRoute.driverNotes} 
                    onChange={handleFormChange} 
                    className="w-full px-3 py-2 rounded-md border border-green-200 mt-0.5 min-h-[60px] text-sm bg-green-50 text-gray-800 outline-none resize-y transition-all duration-200 focus:border-green-800"
                  />
                </div>
                <div className="mb-3">
                  <label className="block mb-1 font-medium text-xs text-gray-800">Complaints (comma separated)</label>
                  <input 
                    name="complaints" 
                    value={formRoute.complaints?.join(', ') || ''} 
                    onChange={e => setFormRoute(r => ({ ...r, complaints: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} 
                    className="w-full px-3 py-2 rounded-md border border-green-200 mt-0.5 text-sm bg-green-50 text-gray-800 outline-none transition-all duration-200 focus:border-green-800"
                  />
                </div>
                <div className="mb-3">
                  <label className="block mb-1 font-medium text-xs text-gray-800">Collection Points (format: Name|Time|Volume, one per line)</label>
                  <textarea
                    name="collectionPoints"
                    value={formRoute.collectionPoints?.map(pt => `${pt.name}|${pt.time}|${pt.volume}`).join('\n') || ''}
                    onChange={e => setFormRoute(r => ({
                      ...r,
                      collectionPoints: e.target.value.split('\n').map(line => {
                        const [name, time, volume] = line.split('|').map(s => s && s.trim());
                        return name && time && volume ? { name, time, volume } : null;
                      }).filter(Boolean)
                    }))}
                    className="w-full px-3 py-2 rounded-md border border-green-200 mt-0.5 min-h-[80px] text-sm bg-green-50 text-gray-800 outline-none resize-y transition-all duration-200 focus:border-green-800"
                  />
                </div>
              </div>
            </div>
            <div className="border-t border-green-200 pt-4 text-right bg-green-50 -m-6 px-6">
              <button 
                type="button" 
                className="px-4 py-2 bg-gray-500 text-white border-none rounded-md font-medium text-xs cursor-pointer mr-2 transition-all duration-200 hover:bg-gray-600"
                onClick={closeForm}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-5 py-2 bg-green-600 text-white border-none rounded-md font-medium text-xs cursor-pointer transition-all duration-200 hover:bg-green-800"
              >
                {formMode === 'add' ? 'Add Route' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div className="bg-white rounded-xl shadow-lg min-w-[300px] max-w-full w-full sm:w-[340px] p-6 relative border border-green-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-base mb-3 text-red-500 font-medium">Delete Route?</h3>
            <p className="mb-5 text-gray-500 text-sm">Are you sure you want to delete this route? This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 bg-gray-500 text-white border-none rounded-md font-medium text-xs cursor-pointer transition-all duration-200 hover:bg-gray-600" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="px-5 py-2 bg-red-500 text-white border-none rounded-md font-medium text-xs cursor-pointer transition-all duration-200 hover:bg-orange-500" onClick={handleDeleteRoute}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {showAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" onClick={() => setShowAssign(false)}>
          <form className="bg-white rounded-xl shadow-lg min-w-[340px] w-full sm:w-[520px] p-6 border border-green-200" onClick={e => e.stopPropagation()} onSubmit={submitAssign}>
            <h3 className="text-lg mb-4 text-green-800 font-medium">Assign Truck / Team</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700">Truck</label>
                <select className="w-full px-3 py-2 rounded-md border border-green-200 text-sm bg-green-50 text-gray-800" value={assignForm.truck_id} onChange={(e) => setAssignForm(f => ({ ...f, truck_id: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {assignData.trucks.map(t => (
                    <option key={t.truck_id} value={t.truck_id}>{t.plate_num}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700">Team</label>
                <select className="w-full px-3 py-2 rounded-md border border-green-200 text-sm bg-green-50 text-gray-800" value={assignForm.team_id} onChange={(e) => setAssignForm(f => ({ ...f, team_id: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {assignData.teams.map(t => (
                    <option key={t.team_id} value={t.team_id}>Team {t.team_id}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="px-4 py-2 bg-gray-500 text-white rounded-md text-xs" onClick={() => setShowAssign(false)}>Cancel</button>
              <button type="submit" className="px-5 py-2 bg-green-600 text-white rounded-md text-xs">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// Add a PhoneTracking component
const PhoneTracking = ({ driverInfo }) => {
  const [location, setLocation] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState('idle');
  const [error, setError] = useState(null);

  const startTracking = () => {
    setTrackingStatus('tracking');
    // Simulate phone GPS updates
    // In a real app, this would come from the driver's phone
    const simulateDriverMovement = () => {
      const baseLocation = BARANGAY_COORDINATES[driverInfo.barangay];
      return {
        lat: baseLocation[0] + (Math.random() - 0.5) * 0.001,
        lng: baseLocation[1] + (Math.random() - 0.5) * 0.001,
        timestamp: new Date().toLocaleTimeString(),
        speed: Math.round(Math.random() * 40), // km/h
        accuracy: Math.round(Math.random() * 10 + 5) // meters
      };
    };

    const interval = setInterval(() => {
      setLocation(simulateDriverMovement());
    }, 3000);

    return () => clearInterval(interval);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="m-0 mb-1">Driver: {driverInfo.driver}</h3>
          <p className="m-0 text-gray-800">
            <span role="img" aria-label="phone">📱</span> {driverInfo.driverPhone}
          </p>
        </div>
        <button
          onClick={() => startTracking()}
          className={`px-4 py-2 text-white border-none rounded-md cursor-pointer transition-all duration-200 ${
            trackingStatus === 'tracking' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {trackingStatus === 'tracking' ? 'Stop Tracking' : 'Start Tracking'}
        </button>
      </div>

      {location && (
        <div className="bg-green-50 p-3 rounded-lg mb-4">
          <div className="mb-2">
            <strong>Last Updated:</strong> {location.timestamp}
          </div>
          <div className="mb-1">
            <strong>Location:</strong> {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </div>
          <div className="mb-1">
            <strong>Speed:</strong> {location.speed} km/h
          </div>
          <div>
            <strong>Accuracy:</strong> ±{location.accuracy}m
          </div>
        </div>
      )}

      <div className="h-80 rounded-lg overflow-hidden">
        <MapContainer
          center={SIPOCOT_CENTER}
          zoom={14}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          {location && (
            <Marker 
              position={[location.lat, location.lng]}
              icon={L.divIcon({
                html: `<div class="bg-green-600 w-6 h-6 rounded-full border-3 border-white shadow-md flex items-center justify-center">📱</div>`,
                className: 'phone-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}
            >
              <Popup>
                <div className="text-center">
                  <strong>{driverInfo.driver}</strong>
                  <br />
                  Speed: {location.speed} km/h
                  <br />
                  Updated: {location.timestamp}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

// Update your LiveTracking component to include phone tracking
const LiveTracking = () => {
  const [selectedDriver, setSelectedDriver] = useState(null);

  return (
    <div>
      <h2 className="mb-4">Live Driver Tracking</h2>
      
      {!selectedDriver ? (
        <div className="grid gap-3">
          {ROUTES.map((route, index) => (
            <div 
              key={index}
              className="p-3 bg-white rounded-lg border border-green-200 cursor-pointer hover:bg-green-50 transition-colors duration-200"
              onClick={() => setSelectedDriver(route)}
            >
              <div className="font-bold">{route.driver}</div>
              <div className="text-gray-800 text-sm">
                {route.truck} - {route.barangay}
              </div>
              <div className="text-green-800 text-sm">
                📱 {route.driverPhone}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <PhoneTracking driverInfo={selectedDriver} />
      )}
    </div>
  );
};



export default ManageRoute;
