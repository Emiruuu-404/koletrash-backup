// Shared schedule data service
export const scheduleData = {
  'Cluster A': {
    'Truck 1': [
      { day: 'Mon', date: 5, events: [
        { time: '9:00', end: '12:00', label: 'SAGRADA FAMILIA', color: 'bg-green-100', border: 'border-green-400', text: 'text-black' },
        { time: '14:00', end: '17:00', label: 'ALDEZAR', color: 'bg-sky-100', border: 'border-blue-400', text: 'text-black' },
      ]},
      { day: 'Tue', date: 6, events: [
        { time: '10:00', end: '13:00', label: 'BULAN', color: 'bg-red-100', border: 'border-red-400', text: 'text-black' },
      ]},
      { day: 'Wed', date: 7, events: [
        { time: '14:00', end: '17:00', label: 'VIGAAN', color: 'bg-yellow-100', border: 'border-orange-300', text: 'text-black' },
      ]},
      { day: 'Thu', date: 8, events: [
        { time: '11:00', end: '14:00', label: 'TULA-TULA', color: 'bg-gray-200', border: 'border-purple-400', text: 'text-black' },
      ]},
      { day: 'Fri', date: 9, events: [
        { time: '9:00', end: '12:00', label: 'SALVACION', color: 'bg-lime-100', border: 'border-yellow-400', text: 'text-black' },
        { time: '14:00', end: '17:00', label: 'ALDEZAR', color: 'bg-green-100', border: 'border-amber-700', text: 'text-black' },
      ]},
    ],
    'Truck 2': [
      { day: 'Mon', date: 5, events: [
        { time: '10:00', end: '13:00', label: 'BAGONG SIRANG', color: 'bg-pink-100', border: 'border-pink-400', text: 'text-black' },
      ]},
      { day: 'Tue', date: 6, events: [
        { time: '13:00', end: '16:00', label: 'CALAGBANGAN', color: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-black' },
      ]},
      { day: 'Wed', date: 7, events: [
        { time: '9:00', end: '12:00', label: 'GAONGAN', color: 'bg-orange-100', border: 'border-orange-400', text: 'text-black' },
      ]},
      { day: 'Thu', date: 8, events: [
        { time: '15:00', end: '17:00', label: 'MALUBAGO', color: 'bg-teal-100', border: 'border-teal-400', text: 'text-black' },
      ]},
      { day: 'Fri', date: 9, events: [
        { time: '11:00', end: '14:00', label: 'SERRANZANA', color: 'bg-fuchsia-100', border: 'border-fuchsia-400', text: 'text-black' },
      ]},
    ],
  },
  'Cluster B': {
    'Truck 1': [
      { day: 'Mon', date: 5, events: [
        { time: '9:00', end: '12:00', label: 'TARA', color: 'bg-green-100', border: 'border-green-400', text: 'text-black' },
      ]},
      { day: 'Tue', date: 6, events: [
        { time: '10:00', end: '13:00', label: 'TIBLE', color: 'bg-red-100', border: 'border-red-400', text: 'text-black' },
      ]},
      { day: 'Wed', date: 7, events: [
        { time: '14:00', end: '17:00', label: 'YABO', color: 'bg-yellow-100', border: 'border-orange-300', text: 'text-black' },
      ]},
      { day: 'Thu', date: 8, events: [
        { time: '11:00', end: '14:00', label: 'MANGGA', color: 'bg-gray-200', border: 'border-purple-400', text: 'text-black' },
      ]},
      { day: 'Fri', date: 9, events: [
        { time: '9:00', end: '12:00', label: 'MANTILA', color: 'bg-lime-100', border: 'border-yellow-400', text: 'text-black' },
      ]},
    ],
    'Truck 2': [
      { day: 'Mon', date: 5, events: [
        { time: '10:00', end: '13:00', label: 'SALANDA', color: 'bg-pink-100', border: 'border-pink-400', text: 'text-black' },
      ]},
      { day: 'Tue', date: 6, events: [
        { time: '13:00', end: '16:00', label: 'MALAGUICO', color: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-black' },
      ]},
      { day: 'Wed', date: 7, events: [
        { time: '9:00', end: '12:00', label: 'MALUBAGO', color: 'bg-orange-100', border: 'border-orange-400', text: 'text-black' },
      ]},
      { day: 'Thu', date: 8, events: [
        { time: '15:00', end: '17:00', label: 'MANANGLE', color: 'bg-teal-100', border: 'border-teal-400', text: 'text-black' },
      ]},
      { day: 'Fri', date: 9, events: [
        { time: '11:00', end: '14:00', label: 'MANGAPO', color: 'bg-fuchsia-100', border: 'border-fuchsia-400', text: 'text-black' },
      ]},
    ],
  },
};

// Barangay coordinates mapping
export const BARANGAY_COORDINATES = {
  "Sagrada Familia": [13.6450, 122.7450],
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

// Function to convert schedule data to route format
export function convertScheduleToRoutes(scheduleData, selectedDate = '2025-05-05') {
  const routes = [];
  
  // Parse the selected date to get day of week and date
  const selectedDateObj = new Date(selectedDate);
  const selectedDay = selectedDateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const selectedDateNum = selectedDateObj.getDate();
  
  Object.entries(scheduleData).forEach(([cluster, trucks]) => {
    Object.entries(trucks).forEach(([truck, schedule]) => {
      schedule.forEach((daySchedule) => {
        // Only process events for the selected date
        if (daySchedule.day === selectedDay && daySchedule.date === selectedDateNum) {
          daySchedule.events.forEach((event) => {
            // Convert barangay name to proper format
            const barangayName = event.label.replace(/_/g, ' ').toLowerCase()
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            // Create route object
            const route = {
              name: `Zone ${Math.floor(Math.random() * 10) + 1} – ${barangayName}`,
              truck: truck.replace(' ', '-'),
              driver: getRandomDriver(),
              barangay: barangayName,
              datetime: `${selectedDate}, ${event.time} - ${event.end}`,
              volume: `${(Math.random() * 3 + 1).toFixed(1)} tons`,
              status: "Scheduled",
              statusColor: { bg: "#dbeafe", color: "#2563eb" },
              coordinates: BARANGAY_COORDINATES[barangayName] || [13.7766, 122.9826],
              collectionPoints: generateCollectionPoints(barangayName, event.time, event.end),
              driverNotes: "",
              complaints: []
            };
            
            routes.push(route);
          });
        }
      });
    });
  });
  
  return routes;
}

// Helper function to get random driver
function getRandomDriver() {
  const drivers = ["John Doe", "Jane Smith", "Carlos Reyes", "Maria Santos", "Pedro Cruz"];
  return drivers[Math.floor(Math.random() * drivers.length)];
}

// Helper function to generate collection points
function generateCollectionPoints(barangayName, startTime, endTime) {
  const points = [];
  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  const duration = endHour - startHour;
  
  for (let i = 0; i < 3; i++) {
    const timeOffset = Math.floor((duration / 3) * i);
    const pointTime = `${startHour + timeOffset}:${i === 0 ? '00' : i === 1 ? '30' : '00'}`;
    
    points.push({
      name: `${barangayName} Point ${i + 1}`,
      time: pointTime,
      volume: `${(Math.random() * 1 + 0.3).toFixed(1)} tons`,
      coordinates: [
        (BARANGAY_COORDINATES[barangayName]?.[0] || 13.7766) + (Math.random() - 0.5) * 0.01,
        (BARANGAY_COORDINATES[barangayName]?.[1] || 122.9826) + (Math.random() - 0.5) * 0.01
      ]
    });
  }
  
  return points;
}

// Function to get all scheduled barangays for a specific date
export function getScheduledBarangays(scheduleData, selectedDate = '2025-05-05') {
  const scheduledBarangays = new Set();
  
  Object.values(scheduleData).forEach(cluster => {
    Object.values(cluster).forEach(truck => {
      truck.forEach(daySchedule => {
        daySchedule.events.forEach(event => {
          const barangayName = event.label.replace(/_/g, ' ').toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          scheduledBarangays.add(barangayName);
        });
      });
    });
  });
  
  return Array.from(scheduledBarangays);
}

// Function to update schedule data
export function updateScheduleData(newScheduleData) {
  Object.assign(scheduleData, newScheduleData);
}

// Function to add new schedule event
export function addScheduleEvent(cluster, truck, day, event) {
  if (!scheduleData[cluster]) {
    scheduleData[cluster] = {};
  }
  if (!scheduleData[cluster][truck]) {
    scheduleData[cluster][truck] = [];
  }
  
  const daySchedule = scheduleData[cluster][truck].find(d => d.day === day);
  if (daySchedule) {
    daySchedule.events.push(event);
  } else {
    scheduleData[cluster][truck].push({
      day,
      date: new Date().getDate(),
      events: [event]
    });
  }
} 
