import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = "pk.eyJ1IjoibWF0YWRldnMiLCJhIjoiY21mNmdhc3YyMGcxdzJrb21xZm80c3NpbCJ9.R0nU8Ip_9RCo-Q2aWxAbXA";

/* ─── Mock Data ─── */
const STATIONS = [
  // ── Shell (13) ──
  { id:  1, name: "Shell Robinsons Mobility Station",  brand: "Shell",    barangay: "Ermita",          officer: "Ricardo Santos",   capacity: 180000, dispensed: 5420, lat: 10.3025851, lng: 123.9110295, status: "Online"  },
  { id:  2, name: "Shell – Osmeña Blvd / Jones Ave",   brand: "Shell",    barangay: "Lorega",          officer: "Gemma Reyes",      capacity: 150000, dispensed: 4610, lat: 10.3039010, lng: 123.8950550, status: "Online"  },
  { id:  3, name: "Shell – N. Escario St",             brand: "Shell",    barangay: "Camputhaw",       officer: "Manuel Flores",    capacity: 120000, dispensed: 3480, lat: 10.3176340, lng: 123.8944090, status: "Online"  },
  { id:  4, name: "Shell – Gorordo Ave",               brand: "Shell",    barangay: "Lahug",           officer: "Carla Villanueva", capacity: 130000, dispensed: 3750, lat: 10.3203694, lng: 123.8994126, status: "Online"  },
  { id:  5, name: "Shell – F. Cabahug St",             brand: "Shell",    barangay: "Kasambagan",      officer: "Jose Magbanua",    capacity: 140000, dispensed: 4120, lat: 10.3248960, lng: 123.9155940, status: "Online"  },
  { id:  6, name: "Shell – Banilad",                   brand: "Shell",    barangay: "Banilad",         officer: "Nora Aquino",      capacity: 130000, dispensed: 3890, lat: 10.3446170, lng: 123.9121940, status: "Online"  },
  { id:  7, name: "Shell Talamban Highlands",          brand: "Shell",    barangay: "Talamban",        officer: "Andres Castillo",  capacity: 160000, dispensed: 4780, lat: 10.3567474, lng: 123.9149518, status: "Online"  },
  { id:  8, name: "Shell – Katipunan St",              brand: "Shell",    barangay: "Labangon",        officer: "Edna Bautista",    capacity: 110000, dispensed: 3210, lat: 10.3004390, lng: 123.8746030, status: "Online"  },
  { id:  9, name: "Shell – Basak Pardo",               brand: "Shell",    barangay: "Basak Pardo",     officer: "Victor Ocampo",    capacity: 100000, dispensed: 2950, lat: 10.2882290, lng: 123.8638870, status: "Online"  },
  { id: 10, name: "Shell – Mambaling",                 brand: "Shell",    barangay: "Mambaling",       officer: "Liza Pangilinan",  capacity: 110000, dispensed: 3140, lat: 10.2875180, lng: 123.8792190, status: "Online"  },
  { id: 11, name: "Shell NRA",                         brand: "Shell",    barangay: "NRA",             officer: "Bobby Soriano",    capacity: 150000, dispensed: 4380, lat: 10.3161410, lng: 123.9287640, status: "Online"  },
  { id: 12, name: "Shell – MJ Cuenco Ave, Carreta",    brand: "Shell",    barangay: "Carreta",         officer: "Felicitas Cruz",   capacity: 100000, dispensed: 2870, lat: 10.3097020, lng: 123.9080780, status: "Offline" },
  { id: 13, name: "Shell – Talamban Rd (Upper)",       brand: "Shell",    barangay: "Talamban",        officer: "Ramon Diaz",       capacity: 120000, dispensed: 3560, lat: 10.3743450, lng: 123.9189170, status: "Online"  },
  // ── Petron (10) ──
  { id: 14, name: "Petron – Pope John Paul II Ave",    brand: "Petron",   barangay: "Apas",            officer: "Maria Dela Cruz",  capacity: 130000, dispensed: 3820, lat: 10.3255071, lng: 123.9074359, status: "Online"  },
  { id: 15, name: "Petron – N. Escario (Guadalupe)",   brand: "Petron",   barangay: "Guadalupe",       officer: "Carlos Reyes",     capacity: 120000, dispensed: 3450, lat: 10.3176040, lng: 123.8965360, status: "Online"  },
  { id: 16, name: "Petron – F. Cabahug St",            brand: "Petron",   barangay: "Kasambagan",      officer: "Ana Torres",       capacity: 120000, dispensed: 3310, lat: 10.3254869, lng: 123.9165870, status: "Online"  },
  { id: 17, name: "Petron – R. Duterte St, Banawa",    brand: "Petron",   barangay: "Banawa",          officer: "Luis Santos",      capacity: 100000, dispensed: 2780, lat: 10.3156699, lng: 123.8842890, status: "Online"  },
  { id: 18, name: "Petron – V Rama Ave",               brand: "Petron",   barangay: "Luz",             officer: "Rosa Fernandez",   capacity: 110000, dispensed: 3020, lat: 10.3169054, lng: 123.8852611, status: "Online"  },
  { id: 19, name: "Petron – B. Rodriguez St",          brand: "Petron",   barangay: "Cogon Ramos",     officer: "Jorge Bautista",   capacity: 100000, dispensed: 2640, lat: 10.3083407, lng: 123.8893030, status: "Online"  },
  { id: 20, name: "Petron – South Cebu City",          brand: "Petron",   barangay: "Pardo",           officer: "Celia Gomez",      capacity:  90000, dispensed: 2190, lat: 10.2967202, lng: 123.8868959, status: "Online"  },
  { id: 21, name: "Petron – Near Fuente (Central)",    brand: "Petron",   barangay: "Cogon Ramos",     officer: "Dante Villanueva", capacity: 130000, dispensed: 3680, lat: 10.3131564, lng: 123.9127650, status: "Online"  },
  { id: 22, name: "Petron – Punta Princesa",           brand: "Petron",   barangay: "Punta Princesa",  officer: "Elena Magno",      capacity:  95000, dispensed: 2510, lat: 10.2978993, lng: 123.8698921, status: "Online"  },
  { id: 23, name: "Petron – Tisa",                     brand: "Petron",   barangay: "Tisa",            officer: "Alfred Cruz",      capacity:  90000, dispensed: 2340, lat: 10.3013564, lng: 123.8720431, status: "Offline" },
  // ── Caltex (6) ──
  { id: 24, name: "Caltex – Landers Cebu",             brand: "Caltex",   barangay: "Apas",            officer: "Nena Castillo",    capacity: 140000, dispensed: 3920, lat: 10.3210638, lng: 123.9103713, status: "Online"  },
  { id: 25, name: "Caltex – T. Padilla / MJ Cuenco",   brand: "Caltex",   barangay: "Carreta",         officer: "Pedro Ocampo",     capacity: 110000, dispensed: 2980, lat: 10.3021098, lng: 123.9064052, status: "Online"  },
  { id: 26, name: "Caltex – Magallanes St",            brand: "Caltex",   barangay: "Parian",          officer: "Mercy Ramos",      capacity:  90000, dispensed: 2240, lat: 10.2932211, lng: 123.8957413, status: "Online"  },
  { id: 27, name: "Caltex – Cebu South Rd",            brand: "Caltex",   barangay: "Basak",           officer: "Tony Soriano",     capacity: 100000, dispensed: 2610, lat: 10.2832112, lng: 123.8588417, status: "Online"  },
  { id: 28, name: "Caltex – Filimon Sotto Dr",         brand: "Caltex",   barangay: "Cogon Ramos",     officer: "Beth Aquino",      capacity:  85000, dispensed: 2080, lat: 10.3150129, lng: 123.9015140, status: "Online"  },
  { id: 29, name: "Caltex – Tres de Abril St",         brand: "Caltex",   barangay: "Punta Princesa",  officer: "Glen Pangilinan",  capacity:  80000, dispensed: 1870, lat: 10.2978418, lng: 123.8844870, status: "Online"  },
  // ── Phoenix (2) ──
  { id: 30, name: "Phoenix Petroleum – Banilad",       brand: "Phoenix",  barangay: "Banilad",         officer: "Fe Navarro",       capacity:  95000, dispensed: 2450, lat: 10.3354793, lng: 123.9110667, status: "Online"  },
  { id: 31, name: "Phoenix – Mambaling",               brand: "Phoenix",  barangay: "Mambaling",       officer: "Gil Padilla",      capacity:  80000, dispensed: 1920, lat: 10.2895116, lng: 123.8781982, status: "Online"  },
  // ── Sea Oil (2) ──
  { id: 32, name: "SEAOIL – Tres de Abril St",         brand: "Sea Oil",  barangay: "Punta Princesa",  officer: "Lita Mendoza",     capacity:  85000, dispensed: 2130, lat: 10.2966476, lng: 123.8755522, status: "Online"  },
  { id: 33, name: "SeaOil – Bacalso Ave",              brand: "Sea Oil",  barangay: "Duljo-Fatima",    officer: "Ernesto Lopez",    capacity:  80000, dispensed: 1780, lat: 10.2987601, lng: 123.8938398, status: "Online"  },
  // ── Flying V (2) ──
  { id: 34, name: "Flying V – Pit-os",                 brand: "Flying V", barangay: "Pit-os",          officer: "Mariz Bacalso",    capacity:  75000, dispensed: 1640, lat: 10.3960743, lng: 123.9218555, status: "Online"  },
  { id: 35, name: "Flying V – Tugas",                  brand: "Flying V", barangay: "Tugas",           officer: "Rene Jaca",        capacity:  70000, dispensed: 1480, lat: 10.2743392, lng: 123.8568358, status: "Online"  },
  // ── Diatoms (2) ──
  { id: 36, name: "Diatoms Fuel – Tisa",               brand: "Diatoms",  barangay: "Tisa",            officer: "Luz Catalan",      capacity:  70000, dispensed: 1560, lat: 10.2998279, lng: 123.8742939, status: "Online"  },
  { id: 37, name: "Diatoms Fuel – P. Del Rosario St",  brand: "Diatoms",  barangay: "Pahina Central",  officer: "Boy Sanchez",      capacity:  65000, dispensed: 1390, lat: 10.3011824, lng: 123.9001353, status: "Online"  },
  // ── Independent / Other (17) ──
  { id: 38, name: "Fueltech Philippines",              brand: "Other",    barangay: "Tinago",          officer: "Vic Tan",          capacity:  60000, dispensed: 1210, lat: 10.3088927, lng: 123.9188045, status: "Online"  },
  { id: 39, name: "Unioil – Lahug",                    brand: "Other",    barangay: "Lahug",           officer: "Amy Uy",           capacity:  70000, dispensed: 1580, lat: 10.3306989, lng: 123.8978075, status: "Online"  },
  { id: 40, name: "Total – Basak Pardo",               brand: "Other",    barangay: "Basak Pardo",     officer: "Pete Go",          capacity:  65000, dispensed: 1320, lat: 10.2890730, lng: 123.8667544, status: "Online"  },
  { id: 41, name: "Rephil – Pardo",                    brand: "Other",    barangay: "Pardo",           officer: "Gina Dy",          capacity:  60000, dispensed: 1180, lat: 10.2772790, lng: 123.8528685, status: "Online"  },
  { id: 42, name: "Triune Gasoline Station",           brand: "Other",    barangay: "Sudlon",          officer: "Bert Lim",         capacity:  55000, dispensed:  980, lat: 10.3273451, lng: 123.8897226, status: "Online"  },
  { id: 43, name: "C3 Fuels – Labangon",               brand: "Other",    barangay: "Labangon",        officer: "Ines Cu",          capacity:  55000, dispensed: 1020, lat: 10.3038213, lng: 123.8774881, status: "Online"  },
  { id: 44, name: "Geminie Gas Station",               brand: "Other",    barangay: "Talamban",        officer: "Rex Ko",           capacity:  60000, dispensed: 1150, lat: 10.3780830, lng: 123.9197880, status: "Online"  },
  { id: 45, name: "Gas Up – Cebu South Rd",            brand: "Other",    barangay: "Quiot Pardo",     officer: "May Ng",           capacity:  65000, dispensed: 1280, lat: 10.2775470, lng: 123.8536222, status: "Online"  },
  { id: 46, name: "JSY Gasoline Station",              brand: "Other",    barangay: "Kalunasan",       officer: "Sol Yu",           capacity:  50000, dispensed:  890, lat: 10.2926469, lng: 123.8840626, status: "Offline" },
  { id: 47, name: "SGD Gas Station",                   brand: "Other",    barangay: "Sirao",           officer: "Art Sia",          capacity:  55000, dispensed:  960, lat: 10.3997749, lng: 123.9210498, status: "Online"  },
  { id: 48, name: "2010 Gas Station",                  brand: "Other",    barangay: "Busay",           officer: "Dan Chua",         capacity:  50000, dispensed:  870, lat: 10.3462289, lng: 123.8937715, status: "Online"  },
  { id: 49, name: "LKB Gas Station",                   brand: "Other",    barangay: "Sudlon",          officer: "Ed Ong",           capacity:  50000, dispensed:  840, lat: 10.3750034, lng: 123.8527869, status: "Online"  },
  { id: 50, name: "SALLEVER Fuel Stop",                brand: "Other",    barangay: "Agsungot",        officer: "Flo Tan",          capacity:  45000, dispensed:  720, lat: 10.4366961, lng: 123.9045320, status: "Online"  },
  { id: 51, name: "Cogon Gas Station",                 brand: "Other",    barangay: "Cogon Pardo",     officer: "Paz Lee",          capacity:  55000, dispensed:  990, lat: 10.2780982, lng: 123.8581071, status: "Online"  },
  { id: 52, name: "Aura Fuels Inc",                    brand: "Other",    barangay: "Luz",             officer: "Roy Sy",           capacity:  60000, dispensed: 1100, lat: 10.3213223, lng: 123.8840814, status: "Online"  },
  { id: 53, name: "Light Fuels – North Reclamation",   brand: "Other",    barangay: "NRA",             officer: "Kim Yap",          capacity:  65000, dispensed: 1240, lat: 10.3253554, lng: 123.9385335, status: "Online"  },
  { id: 54, name: "Oh My Gas Marketing",               brand: "Other",    barangay: "Talamban",        officer: "Len Po",           capacity:  60000, dispensed: 1060, lat: 10.3816738, lng: 123.9207148, status: "Online"  },
];

const RESIDENTS = [
  { id: 1,  name: "Rico Blanco",         plate: "GAE-1234", barangay: "Mabolo",      vehicle: "Car",        remaining: 5.0,  used: 15.0, status: "Active" },
  { id: 2,  name: "Maria Clara Santos",  plate: "YHM-8890", barangay: "Lahug",       vehicle: "Car",        remaining: 0.0,  used: 20.0, status: "Maxed"  },
  { id: 3,  name: "Juan Dela Cruz",      plate: "ABC-5678", barangay: "Banilad",     vehicle: "Motorcycle", remaining: 11.5, used: 8.5,  status: "Active" },
  { id: 4,  name: "Lorna Villanueva",    plate: "PQR-3310", barangay: "Guadalupe",   vehicle: "Truck",      remaining: 9.5,  used: 10.5, status: "Active" },
  { id: 5,  name: "Ramon Castillo",      plate: "STU-7721", barangay: "Capitol Site",vehicle: "Car",        remaining: 2.0,  used: 18.0, status: "Active" },
  { id: 6,  name: "Ana Reyes",           plate: "XYZ-9900", barangay: "Ermita",      vehicle: "Car",        remaining: 8.0,  used: 12.0, status: "Active" },
  { id: 7,  name: "Carlos Fernandez",    plate: "LMN-4412", barangay: "Talamban",    vehicle: "Motorcycle", remaining: 0.0,  used: 20.0, status: "Maxed"  },
  { id: 8,  name: "Grace Tolentino",     plate: "VWX-6650", barangay: "Tisa",        vehicle: "Truck",      remaining: 5.0,  used: 15.0, status: "Active" },
  { id: 9,  name: "Eduardo Mendoza",     plate: "BCD-1133", barangay: "Kasambagan",  vehicle: "Motorcycle", remaining: 11.0, used: 9.0,  status: "Active" },
  { id: 10, name: "Felisa Bautista",     plate: "EFG-2244", barangay: "Basak Pardo", vehicle: "Truck",      remaining: 0.0,  used: 20.0, status: "Maxed"  },
  { id: 11, name: "Rommel Aquino",       plate: "HIJ-5566", barangay: "Mabolo",      vehicle: "Car",        remaining: 5.5,  used: 14.5, status: "Active" },
  { id: 12, name: "Teresita Magbanua",   plate: "KLM-8877", barangay: "Banilad",     vehicle: "Car",        remaining: 9.0,  used: 11.0, status: "Active" },
  { id: 13, name: "Bernardo Ocampo",     plate: "NOP-1122", barangay: "Guadalupe",   vehicle: "Motorcycle", remaining: 3.0,  used: 17.0, status: "Active" },
  { id: 14, name: "Shirley Pangilinan",  plate: "QRS-4455", barangay: "Lahug",       vehicle: "Truck",      remaining: 0.0,  used: 20.0, status: "Maxed"  },
  { id: 15, name: "Vicente Soriano",     plate: "TUV-7788", barangay: "Capitol Site",vehicle: "Motorcycle", remaining: 13.5, used: 6.5,  status: "Active" },
  { id: 16, name: "Dolores Ramos",       plate: "WXY-6633", barangay: "Talamban",    vehicle: "Truck",      remaining: 20.0, used: 0.0,  status: "New"    },
  { id: 17, name: "Alfredo Cruz",        plate: "ZAB-1100", barangay: "Tisa",        vehicle: "Car",        remaining: 14.0, used: 6.0,  status: "Active" },
  { id: 18, name: "Marites Gomez",       plate: "CDE-7744", barangay: "Ermita",      vehicle: "Motorcycle", remaining: 7.5,  used: 12.5, status: "Active" },
];

const RECENT_TXN = [
  { id: 1, resident: "Rico Blanco",        station: "Shell – Fuente Osmeña", plate: "GAE-1234", liters: 15.0, type: "Regular", pricePerLiter: 63.15, time: "10:24 AM", date: "Today"     },
  { id: 2, resident: "Maria Clara Santos", station: "Petron – Jones Ave",    plate: "YHM-8890", liters: 20.0, type: "Diesel",  pricePerLiter: 56.85, time: "09:45 AM", date: "Today"     },
  { id: 3, resident: "Juan Dela Cruz",     station: "Caltex – Lahug",        plate: "ABC-5678", liters: 8.5,  type: "Premium", pricePerLiter: 67.25, time: "08:12 AM", date: "Today"     },
  { id: 4, resident: "Lorna Villanueva",   station: "Shell – Mabolo",        plate: "PQR-3310", liters: 10.5, type: "Regular", pricePerLiter: 63.15, time: "07:10 AM", date: "Today"     },
  { id: 5, resident: "Ramon Castillo",     station: "Phoenix – Banilad",     plate: "STU-7721", liters: 18.0, type: "Premium", pricePerLiter: 66.75, time: "06:58 AM", date: "Today"     },
  { id: 6, resident: "Ana Reyes",          station: "Petron – Guadalupe",    plate: "XYZ-9900", liters: 12.0, type: "Regular", pricePerLiter: 62.75, time: "03:30 PM", date: "Yesterday" },
  { id: 7, resident: "Carlos Fernandez",   station: "Shell – Talamban",      plate: "LMN-4412", liters: 20.0, type: "Diesel",  pricePerLiter: 57.25, time: "01:15 PM", date: "Yesterday" },
  { id: 8, resident: "Grace Tolentino",    station: "Sea Oil – Pardo",       plate: "VWX-6650", liters: 15.0, type: "Diesel",  pricePerLiter: 56.25, time: "11:40 AM", date: "Yesterday" },
];

const BRAND_PRICES: Record<string, { label: string; price: number }[]> = {
  Shell: [
    { label: "FuelSave Diesel",       price: 57.25 },
    { label: "FuelSave Unleaded (91)", price: 63.15 },
    { label: "V-Power Nitro+ (95)",    price: 67.50 },
    { label: "V-Power Racing (97)",    price: 71.00 },
  ],
  Petron: [
    { label: "Diesel Max",            price: 56.85 },
    { label: "Xtra Advance (91)",     price: 62.75 },
    { label: "Blaze 100 (95)",        price: 66.95 },
  ],
  Caltex: [
    { label: "Diesel",                price: 57.10 },
    { label: "Regular (91)",          price: 62.95 },
    { label: "Silver (95)",           price: 67.25 },
  ],
  Phoenix: [
    { label: "Diesel",                price: 56.50 },
    { label: "Super Unleaded (91)",   price: 62.50 },
    { label: "Premium (95)",          price: 66.75 },
  ],
  "Sea Oil": [
    { label: "Diesel",                price: 56.25 },
    { label: "Regular (91)",          price: 62.25 },
    { label: "Premium (95)",          price: 66.50 },
  ],
  "Flying V": [
    { label: "Diesel",                price: 56.00 },
    { label: "Regular (91)",          price: 62.00 },
  ],
  Diatoms: [
    { label: "Diesel",                price: 55.75 },
    { label: "Regular (91)",          price: 61.75 },
  ],
  Other: [
    { label: "Diesel",                price: 55.50 },
    { label: "Regular (91)",          price: 61.50 },
  ],
};

const BRAND_COLORS = {
  Shell:      { bg: "#fff3e0", text: "#e65100", dot: "#f57c00" },
  Petron:     { bg: "#e3f2fd", text: "#1565c0", dot: "#1976d2" },
  Caltex:     { bg: "#fce4ec", text: "#c62828", dot: "#e53935" },
  Phoenix:    { bg: "#f3e5f5", text: "#6a1b9a", dot: "#8e24aa" },
  "Sea Oil":  { bg: "#e8f5e9", text: "#2e7d32", dot: "#43a047" },
  "Flying V": { bg: "#fff8e1", text: "#f57f17", dot: "#fbc02d" },
  Diatoms:    { bg: "#e0f2f1", text: "#00695c", dot: "#00897b" },
  Other:      { bg: "#f5f5f5", text: "#424242", dot: "#757575" },
};

const NAV_ITEMS = [
  { id: "overview",      icon: "dashboard",          label: "Overview"      },
  { id: "heatmap",       icon: "map",                label: "Heatmap"       },
  { id: "allocation",    icon: "local_gas_station",  label: "Allocation"    },
  { id: "residents",     icon: "groups",             label: "Residents"     },
  { id: "stations",      icon: "store",              label: "Stations"      },
  { id: "transactions",  icon: "receipt_long",       label: "Transactions"  },
  { id: "analytics",     icon: "bar_chart",          label: "Analytics"     },
];

const TREND_DATA = [
  { label: "Mon", value: 2840 },
  { label: "Tue", value: 3180 },
  { label: "Wed", value: 2650 },
  { label: "Thu", value: 3920 },
  { label: "Fri", value: 4310 },
  { label: "Sat", value: 3760 },
  { label: "Sun", value: 4150 },
];

const fuelBadgeClass = (type: string) =>
  type === "Diesel" ? "badge-diesel" : type === "Premium" ? "badge-premium" : "badge-regular";

const statusBadgeClass = (s: string) =>
  s === "Maxed" ? "badge-maxed" : s === "New" ? "badge-new"
  : s === "Online" ? "badge-online" : s === "Offline" ? "badge-offline" : "badge-active";

const brandBadgeClass = (brand: string) =>
  ({ Shell: "badge-brand-shell", Petron: "badge-brand-petron", Caltex: "badge-brand-caltex",
     Phoenix: "badge-brand-phoenix", "Sea Oil": "badge-brand-seaoil",
     "Flying V": "badge-brand-shell", Diatoms: "badge-brand-seaoil", Other: "badge-active" })[brand] ?? "badge-active";

const brandKey = (brand: string) => brand.toLowerCase().replace(/\s/g, "");

export default function AdminDashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("overview");
  const [stationFilter, setStationFilter] = useState("All");
  const [heatmapFilter, setHeatmapFilter] = useState("All");
  const [residentSearch, setResidentSearch] = useState("");
  const [residentPage, setResidentPage] = useState(1);
  const RESIDENTS_PER_PAGE = 10;

  const [stationSearch, setStationSearch] = useState("");
  const [stationPage, setStationPage] = useState(1);
  const STATIONS_PER_PAGE = 10;

  const [allocStationPage, setAllocStationPage] = useState(1);
  const [allocResidentPage, setAllocResidentPage] = useState(1);
  const ALLOC_PER_PAGE = 10;

  const [txAllPage, setTxAllPage] = useState(1);
  const [txResidentPage, setTxResidentPage] = useState(1);
  const [txStationPage, setTxStationPage] = useState(1);
  const TX_PER_PAGE = 10;
  const [txFilter, setTxFilter] = useState("All");
  const [txViewBy, setTxViewBy] = useState("All");
  const [txStationBrand, setTxStationBrand] = useState("All");
  const [txDrawerStation, setTxDrawerStation] = useState<{ name: string; brand: string; txns: typeof RECENT_TXN } | null>(null);
  const [txDrawerFilter, setTxDrawerFilter] = useState("All");
  const [allocDrawerStationId, setAllocDrawerStationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const mapRef   = useRef(null);
  const mapInst  = useRef(null);

  // Reusable pagination bar
  const PaginationBar = ({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
      .reduce<(number | "…")[]>((acc, p, i, arr) => {
        if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
        acc.push(p);
        return acc;
      }, []);
    return (
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Page <span className="font-bold text-slate-600">{page}</span> of <span className="font-bold text-slate-600">{totalPages}</span>
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <span className="material-symbols-outlined text-[15px]">chevron_left</span>
          </button>
          {pages.map((p, idx) =>
            p === "…" ? (
              <span key={`e${idx}`} className="w-7 h-7 flex items-center justify-center text-xs text-slate-400">…</span>
            ) : (
              <button key={p} onClick={() => onPage(p as number)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold border transition-all ${
                  page === p ? "bg-[#003366] text-white border-[#003366]" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}>{p}</button>
            )
          )}
          <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <span className="material-symbols-outlined text-[15px]">chevron_right</span>
          </button>
        </div>
      </div>
    );
  };

  const totalDispensed  = STATIONS.reduce((s, st) => s + st.dispensed,  0);
  const onlineStations  = STATIONS.filter(s => s.status === "Online").length;
  const maxedResidents  = RESIDENTS.filter(r => r.status === "Maxed").length;
  const weeklyQuota     = RESIDENTS.length * 20;
  const totalUsed       = RESIDENTS.reduce((s, r) => s + r.used, 0);
  const utilizationPct  = Math.min(100, Math.round((totalUsed / weeklyQuota) * 100));

  /* ── Mapbox init (heatmap page or overview) ── */
  useEffect(() => {
    if (activePage !== "heatmap" && activePage !== "overview") return;
    const el = mapRef.current;
    if (!el || mapInst.current) return;

    const map = new mapboxgl.Map({
      container: el,
      style:  "mapbox://styles/mapbox/light-v11",
      center: [123.9000, 10.3157],
      zoom:   11.5,
      interactive: true,
    });
    mapInst.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      const geojson = {
        type: "FeatureCollection",
        features: STATIONS.map(s => ({
          type: "Feature",
          properties: {
            name: s.name,
            brand: s.brand,
            dispensed: s.dispensed,
            intensity: s.dispensed / 1000,
            status: s.status,
            prices: JSON.stringify(BRAND_PRICES[s.brand] ?? BRAND_PRICES.Other),
          },
          geometry: { type: "Point", coordinates: [s.lng, s.lat] },
        })),
      };

      map.addSource("stations", { type: "geojson", data: geojson as any });

      map.addLayer({
        id: "heat",
        type: "heatmap",
        source: "stations",
        paint: {
          "heatmap-weight":     ["interpolate", ["linear"], ["get", "intensity"], 0, 0, 6, 1],
          "heatmap-intensity":  ["interpolate", ["linear"], ["zoom"], 10, 1, 14, 2],
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0,   "rgba(0,51,102,0)",
            0.2, "rgba(0,100,200,0.45)",
            0.5, "rgba(255,180,0,0.7)",
            0.8, "rgba(255,80,0,0.85)",
            1,   "rgba(200,20,20,1)",
          ],
          "heatmap-radius":  ["interpolate", ["linear"], ["zoom"], 10, 30, 14, 55],
          "heatmap-opacity": 0.78,
        },
      });

      map.addLayer({
        id: "circles",
        type: "circle",
        source: "stations",
        paint: {
          "circle-radius":       7,
          "circle-color":        "#003366",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.on("click", "circles", (e) => {
        const feature = e.features?.[0] as any;
        if (!feature) return;
        const { name, brand, dispensed, status, prices: pricesRaw } = feature.properties || {};
        const coords = feature.geometry?.coordinates?.slice();
        if (!coords) return;
        const prices: { label: string; price: number }[] = JSON.parse(pricesRaw || "[]");
        const statusColor = status === "Online" ? "#2e7d32" : "#c62828";
        const priceRows = prices.map(p =>
          `<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-bottom:1px solid #f1f5f9">
            <span style="color:#555;font-size:11px">${p.label}</span>
            <span style="color:#003366;font-weight:700;font-size:12px;margin-left:12px">₱${p.price.toFixed(2)}/L</span>
          </div>`
        ).join("");
        new mapboxgl.Popup({ offset: 14, closeButton: true, maxWidth: "240px" })
          .setLngLat(coords)
          .setHTML(`
            <div style="font:13px/1.5 system-ui,sans-serif;padding:2px 0">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <strong style="color:#003366;font-size:13px;flex:1">${name}</strong>
                <span style="font-size:10px;font-weight:700;color:${statusColor};background:${status === "Online" ? "#e8f5e9" : "#ffebee"};padding:2px 7px;border-radius:99px">${status}</span>
              </div>
              <span style="color:#888;font-size:11px">${brand}</span>
              <div style="margin:8px 0 6px;background:#fff3e0;border-radius:6px;padding:4px 8px;display:inline-block">
                <span style="color:#e65100;font-weight:700;font-size:12px">⛽ ${dispensed.toLocaleString()} L dispensed</span>
              </div>
              <div style="border-top:2px solid #003366;padding-top:6px;margin-top:2px">
                <div style="font-size:10px;font-weight:700;color:#003366;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Fuel Prices</div>
                ${priceRows}
              </div>
            </div>`)
          .addTo(map);
      });

      map.on("mouseenter", "circles", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "circles", () => { map.getCanvas().style.cursor = ""; });
    });

    return () => { map.remove(); mapInst.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage]);

  /* ── Sync heatmap brand filter → Mapbox layer filter ── */
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !map.isStyleLoaded()) return;
    const f = heatmapFilter === "All" ? null : ["==", ["get", "brand"], heatmapFilter];
    if (map.getLayer("circles")) map.setFilter("circles", f);
    if (map.getLayer("heat"))    map.setFilter("heat",    f);
  }, [heatmapFilter]);

  const brandList        = ["All", ...Object.keys(BRAND_COLORS)];
  const filteredStations = stationFilter === "All" ? STATIONS : STATIONS.filter(s => s.brand === stationFilter);

  /* ── Sidebar nav item ── */
  const NavItem = ({ item }) => (
    <button
      onClick={() => setActivePage(item.id)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
        activePage === item.id
          ? "bg-[#003366] text-white"
          : "text-slate-500 hover:bg-slate-100 hover:text-[#003366]"
      }`}
    >
      <span className={`material-symbols-outlined text-[20px] ${activePage === item.id ? "icon-filled" : "icon-outline"}`}>
        {item.icon}
      </span>
      {sidebarOpen && <span>{item.label}</span>}
    </button>
  );

  /* ── Stat card ── */
  const StatCard = ({ icon, label, value, sub, iconVariant }: { icon: string; label: string; value: string | number; sub: string; iconVariant: string }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 stat-icon-${iconVariant}-bg`}>
        <span className={`material-symbols-outlined icon-filled text-[22px] stat-icon-${iconVariant}-text`}>{icon}</span>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
        <p className="text-2xl font-black font-headline text-[#003366] leading-none">{value}</p>
        <p className="text-xs text-slate-400 mt-1">{sub}</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden font-[system-ui,sans-serif]">

      {/* ═══ SIDEBAR ═══ */}
      <aside
        className={`flex flex-col bg-white border-r border-slate-100 shadow-sm transition-all duration-200 shrink-0 ${sidebarOpen ? "w-[220px]" : "w-[68px]"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-[#003366] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-yellow-400 icon-filled icon-base">local_gas_station</span>
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-[#003366] font-black text-sm leading-tight truncate">A.G.A.S</p>
              <p className="text-slate-400 text-[10px] font-medium">CMS Admin</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => <NavItem key={item.id} item={item} />)}
        </nav>

        {/* Collapse toggle + Logout */}
        <div className="px-3 py-4 border-t border-slate-100 space-y-1">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-100 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">
              {sidebarOpen ? "chevron_left" : "chevron_right"}
            </span>
            {sidebarOpen && <span>Collapse</span>}
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-50 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-6 py-3.5 flex items-center justify-between shadow-sm shrink-0">
          <div>
            <h1 className="text-base font-black text-[#003366]">
              {activePage === "overview" ? "A.G.A.S Admin Overview" : NAV_ITEMS.find(n => n.id === activePage)?.label || "Overview"}
            </h1>
            <p className="text-xs text-slate-400">Cebu City A.G.A.S · March 30, 2026</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
              System Live
            </span>
            <div className="w-9 h-9 rounded-full bg-[#003366] flex items-center justify-center">
              <span className="material-symbols-outlined text-white icon-filled icon-base">admin_panel_settings</span>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ══ OVERVIEW ══ */}
          {activePage === "overview" && (() => {
            const remainingSupply = weeklyQuota - totalUsed;
            const trendMax = Math.max(...TREND_DATA.map(d => d.value));
            const W = 300, H = 100, pad = 10;
            const pts = TREND_DATA.map((d, i) => {
              const x = pad + (i / (TREND_DATA.length - 1)) * (W - pad * 2);
              const y = H - pad - ((d.value / trendMax) * (H - pad * 2));
              return `${x},${y}`;
            });
            const linePath = `M ${pts.join(" L ")}`;
            const areaPath = `M ${pts[0]} L ${pts.join(" L ")} L ${pad + (W - pad * 2)},${H - pad} L ${pad},${H - pad} Z`;
            return (
            <div className="space-y-5">

              {/* ── 5 Stat cards ── */}
              <div className="grid grid-cols-5 gap-4">
                <StatCard icon="groups"                label="Total Residents"    value={RESIDENTS.length}                         sub={`${maxedResidents} maxed quota`}                iconVariant="navy"   />
                <StatCard icon="store"                 label="Active Stations"    value={`${onlineStations} / ${STATIONS.length}`} sub={`${STATIONS.length - onlineStations} offline`}  iconVariant="green"  />
                <StatCard icon="local_fire_department" label="Total Dispensed"    value={`${totalDispensed.toLocaleString()} L`}   sub="Weekly growth trend: +5%"                       iconVariant="orange" />
                <StatCard icon="bar_chart"             label="Quota Utilization"  value={`${utilizationPct}% Used`}                sub={`${(weeklyQuota - totalUsed).toLocaleString()} L remaining`} iconVariant="purple" />
                <StatCard icon="water_drop"            label="Remaining Supply"   value={`${remainingSupply.toLocaleString()} L`}  sub="available this week"                            iconVariant="navy"   />
              </div>

              {/* ── Main two-column layout ── */}
              <div className="grid grid-cols-5 gap-5">

                {/* LEFT — Heatmap + Transactions */}
                <div className="col-span-3 flex flex-col gap-5">

                  {/* Heatmap */}
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                    <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-[#003366]">Station Heatmap</p>
                        <p className="text-xs text-slate-400">Fuel dispensing intensity across Cebu City</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5">
                        <span className="text-[10px] text-slate-400 font-bold mr-1">Fuel Consumption Intensity</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> <span>Low</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block ml-1.5" /> <span>Mid</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block ml-1.5" /> <span>High</span>
                      </div>
                    </div>
                    <div ref={mapRef} className="h-[280px]" />
                  </div>

                  {/* Real-time Transactions */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-[#003366]">Real-time Transactions</p>
                        <p className="text-xs text-slate-400">Latest fuel dispensing activity</p>
                      </div>
                      <button onClick={() => setActivePage("transactions")} className="text-xs font-bold text-[#003366] hover:underline flex items-center gap-1">
                        View All <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <th className="text-left px-5 py-2.5">Resident</th>
                          <th className="text-left px-5 py-2.5">Station</th>
                          <th className="text-left px-5 py-2.5">Fuel Type</th>
                          <th className="text-right px-5 py-2.5">Liters</th>
                          <th className="text-right px-5 py-2.5">Total Paid</th>
                          <th className="text-right px-5 py-2.5">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {RECENT_TXN.slice(0, 6).map((tx, i) => (
                          <tr key={tx.id} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-blue-50/30 transition-colors`}>
                            <td className="px-5 py-2.5 font-bold text-slate-800 text-xs">{tx.resident}</td>
                            <td className="px-5 py-2.5 text-slate-500 text-xs truncate max-w-[140px]">{tx.station}</td>
                            <td className="px-5 py-2.5">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${fuelBadgeClass(tx.type)}`}>{tx.type}</span>
                            </td>
                            <td className="px-5 py-2.5 text-right font-black text-[#003366] text-xs">{tx.liters.toFixed(1)} L</td>
                            <td className="px-5 py-2.5 text-right font-black text-green-700 text-xs">₱{(tx.liters * tx.pricePerLiter).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="px-5 py-2.5 text-right text-xs text-slate-400">{tx.date} · {tx.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RIGHT — Allocation + Trends */}
                <div className="col-span-2 flex flex-col gap-5">

                  {/* Weekly Allocation */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
                    <div>
                      <p className="text-sm font-black text-[#003366]">Weekly Allocation</p>
                      <p className="text-xs text-slate-400">Quota consumed vs. remaining</p>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="relative w-24 h-24 shrink-0">
                        <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#003366" strokeWidth="4"
                            strokeDasharray={`${utilizationPct * 0.879} 87.9`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg font-black text-[#003366] leading-none">{utilizationPct}%</span>
                          <span className="text-[9px] text-slate-400 font-bold">Used</span>
                          <span className="text-[8px] text-slate-400">{weeklyQuota.toLocaleString()} L</span>
                          <span className="text-[8px] text-slate-400">Total Quota</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        {Object.entries(BRAND_COLORS).filter(([brand]) => {
                          const tot = STATIONS.filter(s => s.brand === brand).reduce((a, s) => a + s.dispensed, 0);
                          return tot > 0;
                        }).map(([brand]) => {
                          const tot = STATIONS.filter(s => s.brand === brand).reduce((a, s) => a + s.dispensed, 0);
                          const pct = Math.round((tot / totalDispensed) * 100);
                          const bk  = brandKey(brand);
                          return (
                            <div key={brand}>
                              <div className="flex justify-between text-[10px] font-bold mb-0.5">
                                <span className={`brand-text-${bk} flex items-center gap-1`}>
                                  <span className={`w-2 h-2 rounded-full inline-block brand-dot-${bk}`} />{brand}
                                </span>
                                <span className="text-slate-400">{(tot/1000).toFixed(1)}k L · {pct}%</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full brand-fill-${bk}`} ref={(el) => { if (el) el.style.width = `${pct}%`; }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Consumption Trends */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-[#003366]">Consumption Trends</p>
                        <p className="text-xs text-slate-400">Daily fuel dispensed this week (L)</p>
                      </div>
                      <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-full">+5% vs last week</span>
                    </div>
                    {(() => {
                      const CW = 460, CH = 150, pL = 38, pR = 8, pT = 18, pB = 28;
                      const cW = CW - pL - pR, cH = CH - pT - pB;
                      const mn  = Math.min(...TREND_DATA.map(d => d.value)) * 0.93;
                      const mx  = trendMax * 1.06;
                      const tx  = (i: number) => pL + (i / (TREND_DATA.length - 1)) * cW;
                      const ty  = (v: number) => pT + cH - ((v - mn) / (mx - mn)) * cH;
                      const bw  = Math.floor(cW / TREND_DATA.length * 0.45);
                      const baseline = pT + cH;
                      const grids = [mn, mn + (mx-mn)*0.33, mn + (mx-mn)*0.66, mx].map(Math.round);
                      const lp  = `M ${TREND_DATA.map((d,i) => `${tx(i)},${ty(d.value)}`).join(" L ")}`;
                      const ap  = `M ${tx(0)},${baseline} L ${TREND_DATA.map((d,i) => `${tx(i)},${ty(d.value)}`).join(" L ")} L ${tx(TREND_DATA.length-1)},${baseline} Z`;
                      const pk  = TREND_DATA.reduce((a,b) => b.value > a.value ? b : a);
                      return (
                        <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full" style={{ height: 160 }}>
                          <defs>
                            <linearGradient id="ovTrendGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#003366" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#003366" stopOpacity="0.03" />
                            </linearGradient>
                          </defs>
                          {/* Gridlines */}
                          {grids.map((v, gi) => (
                            <g key={gi}>
                              <line x1={pL} y1={ty(v)} x2={CW - pR} y2={ty(v)}
                                stroke={gi === 0 ? "#94a3b8" : "#e2e8f0"}
                                strokeWidth={gi === 0 ? 1 : 0.8}
                                strokeDasharray={gi === 0 ? "none" : "3 3"} />
                              <text x={pL - 4} y={ty(v) + 3.5} textAnchor="end"
                                fontSize="8" fill="#94a3b8" fontWeight="600">
                                {v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
                              </text>
                            </g>
                          ))}
                          {/* Bars from baseline */}
                          {TREND_DATA.map((d,i) => (
                            <rect key={i} x={tx(i) - bw/2} y={ty(d.value)}
                              width={bw} height={baseline - ty(d.value)} rx="2"
                              fill={d.label === pk.label ? "#003366" : "#dde6f0"} />
                          ))}
                          {/* Area fill */}
                          <path d={ap} fill="url(#ovTrendGrad)" />
                          {/* Line */}
                          <path d={lp} fill="none" stroke="#003366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          {/* Dots */}
                          {TREND_DATA.map((d,i) => (
                            <circle key={i} cx={tx(i)} cy={ty(d.value)} r="3"
                              fill={d.label === pk.label ? "#f59e0b" : "#003366"}
                              stroke="#fff" strokeWidth="1.5" />
                          ))}
                          {/* Value labels */}
                          {TREND_DATA.map((d,i) => (
                            <text key={i} x={tx(i)} y={ty(d.value) - 6} textAnchor="middle"
                              fontSize="7.5" fill="#003366" fontWeight="800">
                              {(d.value/1000).toFixed(1)}k
                            </text>
                          ))}
                          {/* X-axis labels */}
                          {TREND_DATA.map((d,i) => (
                            <text key={i} x={tx(i)} y={CH - 4} textAnchor="middle"
                              fontSize="9" fill="#64748b" fontWeight="700">
                              {d.label}
                            </text>
                          ))}
                        </svg>
                      );
                    })()}
                  </div>

                </div>
              </div>
            </div>
            );
          })()}

          {/* ══ HEATMAP ══ */}
          {activePage === "heatmap" && (
            <div className="flex gap-4 h-[calc(100vh-140px)]">

              {/* ── Map column ── */}
              <div className="flex-1 flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 min-w-0">
                {/* Header + legend */}
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div>
                    <p className="text-sm font-black text-[#003366]">Station Heatmap · Cebu City</p>
                    <p className="text-xs text-slate-400">Click a station marker for dispensing details</p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Low</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /> Mid</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> High</span>
                  </div>
                </div>

                {/* Brand filter chips */}
                <div className="px-5 py-2.5 border-b border-slate-100 flex gap-2 shrink-0 overflow-x-auto">
                  {["All", ...Object.keys(BRAND_COLORS)].map(b => {
                    const active = heatmapFilter === b;
                    const ck = active ? `chip-active-${brandKey(b)}` : "bg-white text-slate-500 border-slate-200";
                    return (
                      <button
                        key={b}
                        onClick={() => setHeatmapFilter(b)}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${ck}`}
                      >
                        {b !== "All" && (
                          <span className={`w-2 h-2 rounded-full inline-block ${active ? "bg-white" : `brand-dot-${brandKey(b)}`}`} />
                        )}
                        {b}
                      </button>
                    );
                  })}
                </div>

                {/* Map */}
                <div ref={mapRef} className="flex-1" />
              </div>

              {/* ── Brand stats panel ── */}
              <div className="w-64 flex flex-col gap-3 overflow-y-auto shrink-0">
                {/* Total card */}
                <div className="bg-[#003366] rounded-2xl p-4 shadow-sm">
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-wider mb-1">
                    {heatmapFilter === "All" ? "All Stations" : heatmapFilter} · Total Dispensed
                  </p>
                  <p className="text-3xl font-black text-white leading-none">
                    {(heatmapFilter === "All"
                      ? totalDispensed
                      : STATIONS.filter(s => s.brand === heatmapFilter).reduce((a, s) => a + s.dispensed, 0)
                    ).toLocaleString()}
                    <span className="text-lg text-yellow-400 ml-1">L</span>
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    {heatmapFilter === "All"
                      ? `${STATIONS.length} stations total`
                      : `${STATIONS.filter(s => s.brand === heatmapFilter).length} stations`}
                  </p>
                </div>

                {/* Per-brand cards */}
                {Object.entries(BRAND_COLORS).map(([brand]) => {
                  const bk            = brandKey(brand);
                  const brandStations = STATIONS.filter(s => s.brand === brand);
                  const brandTotal    = brandStations.reduce((a, s) => a + s.dispensed, 0);
                  const pct           = Math.round((brandTotal / totalDispensed) * 100);
                  const isActive      = heatmapFilter === brand;
                  return (
                    <button
                      key={brand}
                      onClick={() => setHeatmapFilter(isActive ? "All" : brand)}
                      className={`w-full text-left rounded-2xl p-4 shadow-sm border-2 transition-all brand-card ${isActive ? `brand-active-${bk}` : ""}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full inline-block brand-dot-${bk}`} />
                          <span className={`text-xs font-black brand-text-${bk}`}>{brand}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{brandStations.length} stations</span>
                      </div>
                      <p className={`text-xl font-black leading-none brand-text-${bk}`}>
                        {(brandTotal / 1000).toFixed(1)}k L
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 mb-2">{brandTotal.toLocaleString()} liters dispensed</p>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full brand-fill-${bk}`} ref={(el) => { if (el) el.style.width = `${pct}%`; }} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{pct}% of total dispensed</p>

                      {/* Individual stations */}
                      <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2">
                        {brandStations.map(s => (
                          <div key={s.id} className="flex items-center justify-between">
                            <p className="text-[10px] text-slate-500 font-medium truncate flex-1 mr-2">{s.name.replace(`${brand} – `, "")}</p>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`text-[10px] font-bold brand-text-${bk}`}>{s.dispensed.toLocaleString()} L</span>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.status === "Online" ? "bg-green-400" : "bg-red-400"}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ ALLOCATION ══ */}
          {activePage === "allocation" && (() => {
            const drawerStation = STATIONS.find(s => s.id === allocDrawerStationId) ?? null;
            return (
            <div className="space-y-6">

                {/* Summary banner */}
                <div className="bg-[#003366] rounded-2xl p-6 flex items-center justify-between shadow-lg">
                  <div>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Total Fuel Dispensed This Week</p>
                    <p className="text-5xl font-black text-white font-headline leading-none">{totalUsed.toLocaleString()} <span className="text-3xl text-yellow-400">L</span></p>
                    <p className="text-white/50 text-sm mt-2">of {weeklyQuota.toLocaleString()} L total weekly quota · {utilizationPct}% utilized</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Remaining</p>
                    <p className="text-4xl font-black text-green-300 font-headline">{(weeklyQuota - totalUsed).toLocaleString()} L</p>
                  </div>
                </div>

                {/* Per-station allocation table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-[#003366]">Dispensing by Station</p>
                      <p className="text-xs text-slate-400">Weekly fuel consumption per gas station · click a row to view fuel breakdown</p>
                    </div>
                    {drawerStation && (
                      <span className="text-[10px] text-[#003366] font-bold bg-blue-50 px-2 py-1 rounded-full">Drawer open →</span>
                    )}
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="text-left px-5 py-3">Station</th>
                        <th className="text-left px-5 py-3">Brand</th>
                        <th className="text-left px-5 py-3">Officer</th>
                        <th className="text-left px-5 py-3">Status</th>
                        <th className="text-right px-5 py-3">Capacity</th>
                        <th className="text-right px-5 py-3">Dispensed</th>
                        <th className="text-left px-5 py-3 w-40">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STATIONS.slice((allocStationPage - 1) * ALLOC_PER_PAGE, allocStationPage * ALLOC_PER_PAGE).map((s, i) => {
                        const pct        = Math.min(Math.round((s.dispensed / (s.capacity * 0.1)) * 100), 100);
                        const bk         = brandKey(s.brand);
                        const isSelected = allocDrawerStationId === s.id;
                        return (
                          <tr key={s.id}
                            onClick={() => setAllocDrawerStationId(isSelected ? null : s.id)}
                            className={`cursor-pointer transition-colors ${isSelected ? "bg-blue-50 border-l-4 border-[#003366]" : i % 2 === 0 ? "bg-white hover:bg-blue-50/20" : "bg-slate-50/50 hover:bg-blue-50/20"}`}>
                            <td className="px-5 py-3 font-bold text-slate-800 flex items-center gap-2">
                              <span className={`material-symbols-outlined text-[15px] transition-transform ${isSelected ? "text-[#003366] rotate-90" : "text-slate-300"}`}>chevron_right</span>
                              {s.name}
                            </td>
                            <td className="px-5 py-3">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${brandBadgeClass(s.brand)}`}>{s.brand}</span>
                            </td>
                            <td className="px-5 py-3 text-slate-500 text-xs">{s.officer}</td>
                            <td className="px-5 py-3">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${statusBadgeClass(s.status)}`}>{s.status}</span>
                            </td>
                            <td className="px-5 py-3 text-right text-xs text-slate-400">{(s.capacity / 1000).toFixed(0)}k L</td>
                            <td className="px-5 py-3 text-right font-black text-[#003366]">{s.dispensed.toLocaleString()} L</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full brand-fill-${bk}`} ref={(el) => { if (el) el.style.width = `${pct}%`; }} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 w-8 shrink-0">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <PaginationBar page={allocStationPage} totalPages={Math.ceil(STATIONS.length / ALLOC_PER_PAGE)} onPage={setAllocStationPage} />
                </div>

                {/* Resident allocation table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <p className="text-sm font-black text-[#003366]">Resident Quota Usage</p>
                    <p className="text-xs text-slate-400">Individual weekly allocation status</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="text-left px-5 py-3">Resident</th>
                        <th className="text-left px-5 py-3">Plate</th>
                        <th className="text-left px-5 py-3">Barangay</th>
                        <th className="text-left px-5 py-3">Status</th>
                        <th className="text-right px-5 py-3">Used</th>
                        <th className="text-right px-5 py-3">Remaining</th>
                        <th className="text-left px-5 py-3 w-36">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RESIDENTS.slice((allocResidentPage - 1) * ALLOC_PER_PAGE, allocResidentPage * ALLOC_PER_PAGE).map((r, i) => {
                        const pct     = Math.round((r.used / 20) * 100);
                        const barFill = pct >= 100 ? "bar-fill-danger" : pct >= 75 ? "bar-fill-warning" : "bar-fill-normal";
                        return (
                          <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className="px-5 py-3 font-bold text-slate-800">{r.name}</td>
                            <td className="px-5 py-3 font-mono text-xs text-slate-600">{r.plate}</td>
                            <td className="px-5 py-3 text-xs text-slate-500">{r.barangay}</td>
                            <td className="px-5 py-3">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${statusBadgeClass(r.status)}`}>{r.status}</span>
                            </td>
                            <td className="px-5 py-3 text-right font-black text-[#003366]">{r.used.toFixed(1)} L</td>
                            <td className="px-5 py-3 text-right font-bold text-green-700">{r.remaining.toFixed(1)} L</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${barFill}`} ref={(el) => { if (el) el.style.width = `${pct}%`; }} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 w-8 shrink-0">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <PaginationBar page={allocResidentPage} totalPages={Math.ceil(RESIDENTS.length / ALLOC_PER_PAGE)} onPage={setAllocResidentPage} />
                </div>

            </div>
            );
          })()}

          {/* ══ RESIDENTS ══ */}
          {activePage === "residents" && (() => {
            const q = residentSearch.trim().toLowerCase();
            const filtered = q
              ? RESIDENTS.filter(r =>
                  r.name.toLowerCase().includes(q) ||
                  r.plate.toLowerCase().includes(q) ||
                  r.barangay.toLowerCase().includes(q) ||
                  r.vehicle.toLowerCase().includes(q)
                )
              : RESIDENTS;
            const totalPages = Math.ceil(filtered.length / RESIDENTS_PER_PAGE);
            const safePage   = Math.min(residentPage, totalPages || 1);
            const pageSlice  = filtered.slice((safePage - 1) * RESIDENTS_PER_PAGE, safePage * RESIDENTS_PER_PAGE);

            return (
            <div className="space-y-4">
              {/* Status cards */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total",  value: RESIDENTS.length,                                    colorClass: "text-[#003366]" },
                  { label: "Active", value: RESIDENTS.filter(r => r.status === "Active").length, colorClass: "text-[#1565c0]" },
                  { label: "Maxed",  value: maxedResidents,                                       colorClass: "text-[#c62828]" },
                  { label: "New",    value: RESIDENTS.filter(r => r.status === "New").length,    colorClass: "text-[#2e7d32]" },
                ].map(c => (
                  <div key={c.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                    <p className={`text-3xl font-black font-headline ${c.colorClass}`}>{c.value}</p>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">{c.label}</p>
                  </div>
                ))}
              </div>
              {/* Vehicle type cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Cars",        icon: "directions_car",   value: RESIDENTS.filter(r => r.vehicle === "Car").length,        colorClass: "text-[#1565c0]", bg: "bg-blue-50"   },
                  { label: "Motorcycles", icon: "two_wheeler",      value: RESIDENTS.filter(r => r.vehicle === "Motorcycle").length, colorClass: "text-[#7b1fa2]", bg: "bg-purple-50" },
                  { label: "Trucks",      icon: "local_shipping",   value: RESIDENTS.filter(r => r.vehicle === "Truck").length,      colorClass: "text-[#e65100]", bg: "bg-orange-50" },
                ].map(c => (
                  <div key={c.label} className={`${c.bg} rounded-2xl px-5 py-3 border border-slate-100 flex items-center gap-4`}>
                    <span className={`material-symbols-outlined text-[28px] ${c.colorClass}`}>{c.icon}</span>
                    <div>
                      <p className={`text-2xl font-black font-headline ${c.colorClass}`}>{c.value}</p>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{c.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Table header with search */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-[#003366]">Resident Accounts</p>
                    <p className="text-xs text-slate-400">
                      {q ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${residentSearch}"` : `${RESIDENTS.length} registered residents`}
                    </p>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
                    <input
                      type="text"
                      placeholder="Search name, plate, barangay, vehicle…"
                      value={residentSearch}
                      onChange={e => { setResidentSearch(e.target.value); setResidentPage(1); }}
                      className="pl-8 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#003366]/40 focus:ring-1 focus:ring-[#003366]/20 w-60"
                    />
                    {residentSearch && (
                      <button onClick={() => { setResidentSearch(""); setResidentPage(1); }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                        <span className="material-symbols-outlined text-[15px]">close</span>
                      </button>
                    )}
                  </div>
                </div>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="text-left px-5 py-3">Name</th>
                      <th className="text-left px-5 py-3">Plate</th>
                      <th className="text-left px-5 py-3">Vehicle</th>
                      <th className="text-left px-5 py-3">Barangay</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-right px-5 py-3">Used</th>
                      <th className="text-right px-5 py-3">Remaining</th>
                      <th className="text-right px-5 py-3">Total Spent</th>
                      <th className="text-right px-5 py-3">Avg/Fill</th>
                      <th className="text-left px-5 py-3 w-32">Quota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageSlice.length === 0 ? (
                      <tr><td colSpan={10} className="px-5 py-10 text-center text-slate-400 text-sm">No residents found.</td></tr>
                    ) : pageSlice.map((r, i) => {
                      const pct        = Math.round((r.used / 20) * 100);
                      const barFill    = pct >= 100 ? "bar-fill-danger" : pct >= 75 ? "bar-fill-warning" : "bar-fill-normal";
                      const rTxns      = RECENT_TXN.filter(t => t.resident === r.name);
                      const totalSpent = rTxns.reduce((a, t) => a + t.liters * t.pricePerLiter, 0);
                      const avgFill    = rTxns.length ? rTxns.reduce((a, t) => a + t.liters, 0) / rTxns.length : 0;
                      return (
                        <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                          <td className="px-5 py-3 font-bold text-slate-800">{r.name}</td>
                          <td className="px-5 py-3 font-mono text-xs text-slate-600 tracking-wider">{r.plate}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`material-symbols-outlined text-[14px] ${r.vehicle === "Car" ? "text-blue-500" : r.vehicle === "Motorcycle" ? "text-purple-500" : "text-orange-500"}`}>
                                {r.vehicle === "Car" ? "directions_car" : r.vehicle === "Motorcycle" ? "two_wheeler" : "local_shipping"}
                              </span>
                              <span className="text-xs text-slate-500">{r.vehicle}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500">{r.barangay}</td>
                          <td className="px-5 py-3">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${statusBadgeClass(r.status)}`}>{r.status}</span>
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-[#003366]">{r.used.toFixed(1)} L</td>
                          <td className="px-5 py-3 text-right font-bold text-green-700">{r.remaining.toFixed(1)} L</td>
                          <td className="px-5 py-3 text-right font-black text-green-700">
                            {totalSpent > 0 ? `₱${totalSpent.toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}` : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-5 py-3 text-right text-xs text-slate-500">
                            {avgFill > 0 ? `${avgFill.toFixed(1)} L` : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${barFill}`} ref={(el) => { if (el) el.style.width = `${pct}%`; }} />
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 w-8 shrink-0">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination footer */}
                {totalPages > 1 && (
                  <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      Showing <span className="font-bold text-slate-600">{(safePage - 1) * RESIDENTS_PER_PAGE + 1}–{Math.min(safePage * RESIDENTS_PER_PAGE, filtered.length)}</span> of <span className="font-bold text-slate-600">{filtered.length}</span>
                    </p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setResidentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                        <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                      </button>
                      {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                        .reduce<(number | "…")[]>((acc, p, i, arr) => {
                          if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, idx) =>
                          p === "…" ? (
                            <span key={`ellipsis-${idx}`} className="w-7 h-7 flex items-center justify-center text-xs text-slate-400">…</span>
                          ) : (
                            <button key={p} onClick={() => setResidentPage(p as number)}
                              className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold border transition-all ${
                                safePage === p ? "bg-[#003366] text-white border-[#003366]" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                              }`}>
                              {p}
                            </button>
                          )
                        )}
                      <button onClick={() => setResidentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                        <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            );
          })()}

          {/* ══ STATIONS ══ */}
          {activePage === "stations" && (() => {
            const sq = stationSearch.trim().toLowerCase();
            const stFiltered = (sq
              ? filteredStations.filter(s =>
                  s.name.toLowerCase().includes(sq) ||
                  s.brand.toLowerCase().includes(sq) ||
                  s.barangay.toLowerCase().includes(sq)
                )
              : filteredStations);
            const stTotalPages = Math.ceil(stFiltered.length / STATIONS_PER_PAGE);
            const stSafePage   = Math.min(stationPage, stTotalPages || 1);
            const stSlice      = stFiltered.slice((stSafePage - 1) * STATIONS_PER_PAGE, stSafePage * STATIONS_PER_PAGE);
            return (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Stations", value: STATIONS.length,                         colorClass: "text-[#003366]" },
                  { label: "Online",         value: onlineStations,                            colorClass: "text-[#2e7d32]" },
                  { label: "Offline",        value: STATIONS.length - onlineStations,         colorClass: "text-[#c62828]" },
                  { label: "Brands",         value: Object.keys(BRAND_COLORS).length,         colorClass: "text-[#7b1fa2]" },
                ].map(c => (
                  <div key={c.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                    <p className={`text-3xl font-black font-headline ${c.colorClass}`}>{c.value}</p>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">{c.label}</p>
                  </div>
                ))}
              </div>

              {/* Brand filter */}
              <div className="flex gap-2">
                {brandList.map(b => (
                  <button key={b} onClick={() => { setStationFilter(b); setStationPage(1); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      stationFilter === b ? "bg-[#003366] text-white border-[#003366]" : "bg-white text-slate-500 border-slate-200 hover:border-[#003366]/40"
                    }`}>
                    {b}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-[#003366]">Gas Stations</p>
                    <p className="text-xs text-slate-400">
                      {sq ? `${stFiltered.length} result${stFiltered.length !== 1 ? "s" : ""} for "${stationSearch}"` : `${filteredStations.length} stations shown`}
                    </p>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
                    <input type="text" placeholder="Search station, brand, barangay…" value={stationSearch}
                      onChange={e => { setStationSearch(e.target.value); setStationPage(1); }}
                      className="pl-8 pr-8 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#003366]/40 focus:ring-1 focus:ring-[#003366]/20 w-60" />
                    {stationSearch && (
                      <button onClick={() => { setStationSearch(""); setStationPage(1); }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                        <span className="material-symbols-outlined text-[15px]">close</span>
                      </button>
                    )}
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="text-left px-5 py-3">Station Name</th>
                      <th className="text-left px-5 py-3">Brand</th>
                      <th className="text-left px-5 py-3">Gas Prices</th>
                      <th className="text-left px-5 py-3">Barangay</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-right px-5 py-3">Capacity</th>
                      <th className="text-right px-5 py-3">Dispensed</th>
                      <th className="text-left px-5 py-3 w-28">Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stSlice.length === 0 ? (
                      <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400 text-sm">No stations found.</td></tr>
                    ) : stSlice.map((s, i) => {
                      const pct    = Math.min(Math.round((s.dispensed / (s.capacity * 0.1)) * 100), 100);
                      const bk     = brandKey(s.brand);
                      const prices = BRAND_PRICES[s.brand] ?? [];
                      return (
                        <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                          <td className="px-5 py-3 font-bold text-slate-800 text-xs">{s.name}</td>
                          <td className="px-5 py-3">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${brandBadgeClass(s.brand)}`}>{s.brand}</span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-col gap-0.5">
                              {prices.map((p, pi) => (
                                <div key={pi} className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-slate-500 truncate max-w-[110px]">{p.label}</span>
                                  <span className="text-[9px] font-black text-[#003366] shrink-0">₱{p.price.toFixed(2)}</span>
                                </div>
                              ))}
                              {prices.length === 0 && <span className="text-[10px] text-slate-300">—</span>}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500">{s.barangay}</td>
                          <td className="px-5 py-3">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${statusBadgeClass(s.status)}`}>{s.status}</span>
                          </td>
                          <td className="px-5 py-3 text-right text-xs text-slate-400">{(s.capacity / 1000).toFixed(0)}k L</td>
                          <td className="px-5 py-3 text-right font-black text-[#003366]">{s.dispensed.toLocaleString()} L</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full brand-fill-${bk}`} ref={(el) => { if (el) el.style.width = `${pct}%`; }} />
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 w-8 shrink-0">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <PaginationBar page={stSafePage} totalPages={stTotalPages} onPage={setStationPage} />
              </div>
            </div>
            );
          })()}

          {/* ══ TRANSACTIONS ══ */}
          {activePage === "transactions" && (() => {
            const filteredTxn = RECENT_TXN.filter(t => {
              if (txFilter === "Today") return t.date === "Today";
              if (txFilter === "Week")  return t.date === "Today" || t.date === "Yesterday";
              return true;
            });
            const totalLiters  = filteredTxn.reduce((a, t) => a + t.liters, 0);
            const totalRevenue = filteredTxn.reduce((a, t) => a + t.liters * t.pricePerLiter, 0);
            const avgFill      = filteredTxn.length ? totalLiters / filteredTxn.length : 0;

            // Group by resident
            const byResident = Object.values(
              filteredTxn.reduce<Record<string, { name: string; plate: string; txns: typeof RECENT_TXN }>>((acc, t) => {
                if (!acc[t.resident]) acc[t.resident] = { name: t.resident, plate: t.plate, txns: [] };
                acc[t.resident].txns.push(t);
                return acc;
              }, {})
            );

            // Group by station (all, before brand filter)
            const allByStation = Object.values(
              filteredTxn.reduce<Record<string, { name: string; brand: string; txns: typeof RECENT_TXN }>>((acc, t) => {
                if (!acc[t.station]) {
                  const st = STATIONS.find(s => t.station.toLowerCase().includes(s.name.split("–")[0].trim().toLowerCase()));
                  acc[t.station] = { name: t.station, brand: st?.brand ?? "", txns: [] };
                }
                acc[t.station].txns.push(t);
                return acc;
              }, {})
            );

            // Available brands in current filtered set
            const availableBrands = ["All", ...Array.from(new Set(allByStation.map(s => s.brand).filter(Boolean)))];

            // Apply brand filter to station groups
            const byStation = txStationBrand === "All"
              ? allByStation
              : allByStation.filter(s => s.brand === txStationBrand);

            // Apply brand filter to individual transactions (for All view)
            const filteredTxnAll = txStationBrand === "All"
              ? filteredTxn
              : filteredTxn.filter(t => {
                  const st = STATIONS.find(s => t.station.toLowerCase().includes(s.name.split("–")[0].trim().toLowerCase()));
                  return st?.brand === txStationBrand;
                });

            // Totals for filtered station rows
            const stationTotalLiters  = byStation.reduce((a, s) => a + s.txns.reduce((b, t) => b + t.liters, 0), 0);
            const stationTotalRevenue = byStation.reduce((a, s) => a + s.txns.reduce((b, t) => b + t.liters * t.pricePerLiter, 0), 0);
            const stationTotalTxns    = byStation.reduce((a, s) => a + s.txns.length, 0);

            const handleDownloadCSV = () => {
              let rows: string[][] = [];
              const periodLabel = txFilter === "All" ? "All Time" : txFilter;
              const brandLabel  = txStationBrand === "All" ? "" : ` · ${txStationBrand}`;

              if (txViewBy === "All") {
                rows = [
                  ["Resident","Station","Plate","Fuel Type","Liters","Price/L","Total Paid","Date","Time"],
                  ...filteredTxnAll.map(t => [
                    t.resident, t.station, t.plate, t.type,
                    t.liters.toFixed(1), t.pricePerLiter.toFixed(2),
                    (t.liters * t.pricePerLiter).toFixed(2), t.date, t.time,
                  ]),
                ];
              } else if (txViewBy === "Residents") {
                rows = [
                  ["Resident","Plate","Transactions","Total Liters","Avg per Fill","Total Spent"],
                  ...byResident.map(r => {
                    const liters = r.txns.reduce((a, t) => a + t.liters, 0);
                    const spent  = r.txns.reduce((a, t) => a + t.liters * t.pricePerLiter, 0);
                    return [r.name, r.plate, String(r.txns.length), liters.toFixed(1), (liters / r.txns.length).toFixed(1), spent.toFixed(2)];
                  }),
                ];
              } else {
                rows = [
                  ["Station","Brand","Transactions","Total Liters","Total Revenue"],
                  ...byStation.map(s => {
                    const liters   = s.txns.reduce((a, t) => a + t.liters, 0);
                    const revenue  = s.txns.reduce((a, t) => a + t.liters * t.pricePerLiter, 0);
                    return [s.name, s.brand, String(s.txns.length), liters.toFixed(1), revenue.toFixed(2)];
                  }),
                ];
              }

              const csv     = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
              const blob    = new Blob([csv], { type: "text/csv" });
              const url     = URL.createObjectURL(blob);
              const a       = document.createElement("a");
              a.href        = url;
              a.download    = `AGAS_Transactions_${txViewBy}_${periodLabel}${brandLabel}.csv`.replace(/\s/g, "_");
              a.click();
              URL.revokeObjectURL(url);
            };

            const handlePrint = () => {
              const periodLabel = txFilter === "All" ? "All Time" : txFilter;
              const brandLabel  = txStationBrand === "All" ? "" : ` · ${txStationBrand}`;

              let tableHTML = "";
              if (txViewBy === "All") {
                const headerRow = ["Resident","Station","Plate","Fuel Type","Liters","Price/L","Total Paid","Date","Time"];
                const dataRows  = filteredTxnAll.map(t => [
                  t.resident, t.station, t.plate, t.type,
                  `${t.liters.toFixed(1)} L`, `₱${t.pricePerLiter.toFixed(2)}`,
                  `₱${(t.liters * t.pricePerLiter).toFixed(2)}`, t.date, t.time,
                ]);
                tableHTML = `<tr>${headerRow.map(h => `<th>${h}</th>`).join("")}</tr>${dataRows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}`;
              } else if (txViewBy === "Residents") {
                const headerRow = ["Resident","Plate","Transactions","Total Liters","Avg per Fill","Total Spent"];
                const dataRows  = byResident.map(r => {
                  const liters = r.txns.reduce((a, t) => a + t.liters, 0);
                  const spent  = r.txns.reduce((a, t) => a + t.liters * t.pricePerLiter, 0);
                  return [r.name, r.plate, r.txns.length, `${liters.toFixed(1)} L`, `${(liters/r.txns.length).toFixed(1)} L`, `₱${spent.toFixed(2)}`];
                });
                tableHTML = `<tr>${headerRow.map(h => `<th>${h}</th>`).join("")}</tr>${dataRows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}`;
              } else {
                const headerRow = ["Station","Brand","Transactions","Total Liters","Total Revenue"];
                const dataRows  = byStation.map(s => {
                  const liters  = s.txns.reduce((a, t) => a + t.liters, 0);
                  const revenue = s.txns.reduce((a, t) => a + t.liters * t.pricePerLiter, 0);
                  return [s.name, s.brand, s.txns.length, `${liters.toFixed(1)} L`, `₱${revenue.toFixed(2)}`];
                });
                tableHTML = `<tr>${headerRow.map(h => `<th>${h}</th>`).join("")}</tr>${dataRows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}`;
              }

              const win = window.open("", "_blank");
              if (!win) return;
              win.document.write(`<!DOCTYPE html><html><head><title>A.G.A.S Transactions</title>
                <style>
                  body { font-family: sans-serif; font-size: 12px; padding: 24px; color: #1e293b; }
                  h2 { color: #003366; margin-bottom: 4px; }
                  p { color: #64748b; margin-bottom: 16px; font-size: 11px; }
                  table { width: 100%; border-collapse: collapse; }
                  th { background: #f1f5f9; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 12px; text-align: left; border-bottom: 2px solid #e2e8f0; }
                  td { padding: 7px 12px; border-bottom: 1px solid #f1f5f9; }
                  tr:nth-child(even) td { background: #f8fafc; }
                  @media print { body { padding: 0; } }
                </style>
              </head><body>
                <h2>A.G.A.S — Transactions (${txViewBy})</h2>
                <p>Period: ${periodLabel}${brandLabel} &nbsp;·&nbsp; Generated: ${new Date().toLocaleString("en-PH")}</p>
                <table>${tableHTML}</table>
              </body></html>`);
              win.document.close();
              win.focus();
              win.print();
            };

            return (
            <div className="space-y-4">

              {/* ── Date filter + action buttons ── */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-2">
                  {["All","Today","Week","Month"].map(f => (
                    <button key={f} onClick={() => { setTxFilter(f); setTxAllPage(1); setTxResidentPage(1); setTxStationPage(1); }}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${txFilter === f ? "bg-[#003366] text-white border-[#003366]" : "bg-white text-slate-500 border-slate-200 hover:border-[#003366]/40"}`}>
                      {f}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleDownloadCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-[#003366]/40 transition-all">
                    <span className="material-symbols-outlined text-[15px]">download</span>
                    Download CSV
                  </button>
                  <button onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-[#003366]/40 transition-all">
                    <span className="material-symbols-outlined text-[15px]">print</span>
                    Print
                  </button>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Dispensed", value: `${totalLiters.toFixed(1)} L`,  colorClass: "text-[#003366]"  },
                  { label: "Transactions",    value: filteredTxn.length,               colorClass: "text-[#1565c0]"  },
                  { label: "Avg per Fill",    value: `${avgFill.toFixed(1)} L`,        colorClass: "text-[#7b1fa2]"  },
                  { label: "Total Revenue",   value: `₱${totalRevenue.toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}`, colorClass: "text-[#2e7d32]" },
                ].map(c => (
                  <div key={c.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                    <p className={`text-2xl font-black font-headline ${c.colorClass}`}>{c.value}</p>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">{c.label}</p>
                  </div>
                ))}
              </div>

              {/* ── ALL transactions view ── */}
              {txViewBy === "All" && (() => {
                const allTotalPages = Math.ceil(filteredTxnAll.length / TX_PER_PAGE);
                const allSafePage   = Math.min(txAllPage, allTotalPages || 1);
                const allSlice      = filteredTxnAll.slice((allSafePage - 1) * TX_PER_PAGE, allSafePage * TX_PER_PAGE);
                return (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                    <p className="text-sm font-black text-[#003366] shrink-0">
                      {txFilter === "All" ? "All" : txFilter} Transactions
                      <span className="ml-2 text-xs font-bold text-slate-400">({filteredTxnAll.length})</span>
                    </p>
                    <div className="flex items-center gap-3">
                      {/* Brand filter pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {availableBrands.map(b => (
                          <button key={b} onClick={() => setTxStationBrand(b)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                              txStationBrand === b ? "bg-[#003366] text-white border-[#003366]" : "bg-white text-slate-500 border-slate-200 hover:border-[#003366]/40"
                            }`}>
                            {b}
                          </button>
                        ))}
                      </div>
                      {/* View-by toggle */}
                      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
                        {[
                          { id: "All",       icon: "receipt_long", label: "All"       },
                          { id: "Residents", icon: "groups",       label: "Residents" },
                          { id: "Stations",  icon: "store",        label: "Stations"  },
                        ].map(v => (
                          <button key={v.id} onClick={() => { setTxViewBy(v.id); setTxStationBrand("All"); setTxDrawerStation(null); setTxAllPage(1); setTxResidentPage(1); setTxStationPage(1); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${txViewBy === v.id ? "bg-white text-[#003366] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                            <span className="material-symbols-outlined text-[14px]">{v.icon}</span>{v.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="text-left px-5 py-3">Resident</th>
                        <th className="text-left px-5 py-3">Station</th>
                        <th className="text-left px-5 py-3">Plate</th>
                        <th className="text-left px-5 py-3">Fuel Type</th>
                        <th className="text-right px-5 py-3">Liters</th>
                        <th className="text-right px-5 py-3">Price/L</th>
                        <th className="text-right px-5 py-3">Total Paid</th>
                        <th className="text-right px-5 py-3">Date</th>
                        <th className="text-right px-5 py-3">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allSlice.length === 0 ? (
                        <tr><td colSpan={9} className="px-5 py-10 text-center text-slate-400 text-sm">No transactions found.</td></tr>
                      ) : allSlice.map((tx, i) => {
                        const total = tx.liters * tx.pricePerLiter;
                        return (
                          <tr key={tx.id} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"} hover:bg-blue-50/30 transition-colors`}>
                            <td className="px-5 py-3 font-bold text-slate-800">{tx.resident}</td>
                            <td className="px-5 py-3 text-xs text-slate-500">{tx.station}</td>
                            <td className="px-5 py-3 font-mono text-xs text-slate-600 tracking-wider">{tx.plate}</td>
                            <td className="px-5 py-3"><span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${fuelBadgeClass(tx.type)}`}>{tx.type}</span></td>
                            <td className="px-5 py-3 text-right font-black text-[#003366]">{tx.liters.toFixed(1)} L</td>
                            <td className="px-5 py-3 text-right text-xs text-slate-400">₱{tx.pricePerLiter.toFixed(2)}</td>
                            <td className="px-5 py-3 text-right font-black text-green-700">₱{total.toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                            <td className="px-5 py-3 text-right text-xs text-slate-400">{tx.date}</td>
                            <td className="px-5 py-3 text-right text-xs text-slate-400">{tx.time}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <PaginationBar page={allSafePage} totalPages={allTotalPages} onPage={setTxAllPage} />
                </div>
                );
              })()}

              {/* ── BY RESIDENTS view ── */}
              {txViewBy === "Residents" && (() => {
                const resTotalPages = Math.ceil(byResident.length / TX_PER_PAGE);
                const resSafePage   = Math.min(txResidentPage, resTotalPages || 1);
                const resSlice      = byResident.slice((resSafePage - 1) * TX_PER_PAGE, resSafePage * TX_PER_PAGE);
                return (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-sm font-black text-[#003366]">Transactions by Resident
                      <span className="ml-2 text-xs font-bold text-slate-400">({byResident.length} residents)</span>
                    </p>
                    {/* View-by toggle */}
                    <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                      {[
                        { id: "All",       icon: "receipt_long", label: "All"       },
                        { id: "Residents", icon: "groups",       label: "Residents" },
                        { id: "Stations",  icon: "store",        label: "Stations"  },
                      ].map(v => (
                        <button key={v.id} onClick={() => setTxViewBy(v.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${txViewBy === v.id ? "bg-white text-[#003366] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                          <span className="material-symbols-outlined text-[14px]">{v.icon}</span>{v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="text-left px-5 py-3">Resident</th>
                        <th className="text-left px-5 py-3">Plate</th>
                        <th className="text-center px-5 py-3">Transactions</th>
                        <th className="text-right px-5 py-3">Total Liters</th>
                        <th className="text-right px-5 py-3">Avg per Fill</th>
                        <th className="text-right px-5 py-3">Total Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resSlice.length === 0 ? (
                        <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">No transactions found.</td></tr>
                      ) : resSlice.map((r, i) => {
                        const liters  = r.txns.reduce((a, t) => a + t.liters, 0);
                        const spent   = r.txns.reduce((a, t) => a + t.liters * t.pricePerLiter, 0);
                        const avg     = liters / r.txns.length;
                        return (
                          <tr key={r.name} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"} hover:bg-blue-50/30 transition-colors`}>
                            <td className="px-5 py-3 font-bold text-slate-800">{r.name}</td>
                            <td className="px-5 py-3 font-mono text-xs text-slate-500 tracking-wider">{r.plate}</td>
                            <td className="px-5 py-3 text-center">
                              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">{r.txns.length}</span>
                            </td>
                            <td className="px-5 py-3 text-right font-black text-[#003366]">{liters.toFixed(1)} L</td>
                            <td className="px-5 py-3 text-right text-xs text-slate-500">{avg.toFixed(1)} L</td>
                            <td className="px-5 py-3 text-right font-black text-green-700">₱{spent.toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {byResident.length > 0 && (
                      <tfoot>
                        <tr className="bg-[#003366]/5 border-t-2 border-[#003366]/10">
                          <td colSpan={2} className="px-5 py-3 text-xs font-black text-[#003366] uppercase tracking-wider">Total</td>
                          <td className="px-5 py-3 text-center text-xs font-black text-[#003366]">{filteredTxn.length}</td>
                          <td className="px-5 py-3 text-right text-sm font-black text-[#003366]">{totalLiters.toFixed(1)} L</td>
                          <td className="px-5 py-3 text-right text-xs font-black text-slate-500">{avgFill.toFixed(1)} L</td>
                          <td className="px-5 py-3 text-right text-sm font-black text-green-700">₱{totalRevenue.toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                  <PaginationBar page={resSafePage} totalPages={resTotalPages} onPage={setTxResidentPage} />
                </div>
                );
              })()}

              {/* ── BY STATIONS view ── */}
              {txViewBy === "Stations" && (() => {
                const staTotalPages = Math.ceil(byStation.length / TX_PER_PAGE);
                const staSafePage   = Math.min(txStationPage, staTotalPages || 1);
                const staSlice      = byStation.slice((staSafePage - 1) * TX_PER_PAGE, staSafePage * TX_PER_PAGE);
                return (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-[#003366]">Transactions by Station
                        <span className="ml-2 text-xs font-bold text-slate-400">({byStation.length} stations)</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Brand filter pills */}
                      <div className="flex gap-1.5">
                        {availableBrands.map(b => (
                          <button key={b} onClick={() => setTxStationBrand(b)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                              txStationBrand === b ? "bg-[#003366] text-white border-[#003366]" : "bg-white text-slate-500 border-slate-200 hover:border-[#003366]/40"
                            }`}>
                            {b}
                          </button>
                        ))}
                      </div>
                      {/* View-by toggle */}
                      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
                        {[
                          { id: "All",       icon: "receipt_long", label: "All"       },
                          { id: "Residents", icon: "groups",       label: "Residents" },
                          { id: "Stations",  icon: "store",        label: "Stations"  },
                        ].map(v => (
                          <button key={v.id} onClick={() => { setTxViewBy(v.id); setTxStationBrand("All"); setTxDrawerStation(null); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${txViewBy === v.id ? "bg-white text-[#003366] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                            <span className="material-symbols-outlined text-[14px]">{v.icon}</span>{v.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="text-left px-5 py-3">Station</th>
                        <th className="text-left px-5 py-3">Brand</th>
                        <th className="text-left px-5 py-3">Fuel Prices</th>
                        <th className="text-center px-5 py-3">Transactions</th>
                        <th className="text-right px-5 py-3">Total Liters</th>
                        <th className="text-right px-5 py-3">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staSlice.length === 0 ? (
                        <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">No stations found.</td></tr>
                      ) : staSlice.map((s, i) => {
                        const liters     = s.txns.reduce((a, t) => a + t.liters, 0);
                        const revenue    = s.txns.reduce((a, t) => a + t.liters * t.pricePerLiter, 0);
                        const prices     = BRAND_PRICES[s.brand] ?? [];
                        const isSelected = txDrawerStation?.name === s.name;
                        return (
                          <tr key={s.name}
                            onClick={() => { setTxDrawerStation(isSelected ? null : s); setTxDrawerFilter("All"); }}
                            className={`cursor-pointer transition-colors ${isSelected ? "bg-blue-50 border-l-4 border-[#003366]" : i % 2 === 0 ? "bg-white hover:bg-blue-50/30" : "bg-slate-50/40 hover:bg-blue-50/30"}`}>
                            <td className="px-5 py-3 font-bold text-slate-800 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px] text-slate-300 shrink-0">chevron_right</span>
                                {s.name}
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${brandBadgeClass(s.brand)}`}>{s.brand || "—"}</span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex flex-wrap gap-1">
                                {prices.map((p, pi) => (
                                  <span key={pi} className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                    {p.label.split(" ").slice(-1)[0]} ₱{p.price.toFixed(2)}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">{s.txns.length}</span>
                            </td>
                            <td className="px-5 py-3 text-right font-black text-[#003366]">{liters.toFixed(1)} L</td>
                            <td className="px-5 py-3 text-right font-black text-green-700">₱{revenue.toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {byStation.length > 0 && (
                      <tfoot>
                        <tr className="bg-[#003366]/5 border-t-2 border-[#003366]/10">
                          <td colSpan={3} className="px-5 py-3 text-xs font-black text-[#003366] uppercase tracking-wider">Total</td>
                          <td className="px-5 py-3 text-center text-xs font-black text-[#003366]">{stationTotalTxns}</td>
                          <td className="px-5 py-3 text-right text-sm font-black text-[#003366]">{stationTotalLiters.toFixed(1)} L</td>
                          <td className="px-5 py-3 text-right text-sm font-black text-green-700">₱{stationTotalRevenue.toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                  <PaginationBar page={staSafePage} totalPages={staTotalPages} onPage={setTxStationPage} />
                </div>
                );
              })()}

            </div>
            );
          })()}

          {/* ══ ANALYTICS ══ */}
          {activePage === "analytics" && (() => {
            const trendMax   = Math.max(...TREND_DATA.map(d => d.value));
            const trendMin   = Math.min(...TREND_DATA.map(d => d.value));
            const totalDispensedWeek = TREND_DATA.reduce((a, d) => a + d.value, 0);
            const avgDaily   = totalDispensedWeek / TREND_DATA.length;
            const peakDay    = TREND_DATA.reduce((a, b) => b.value > a.value ? b : a);
            const lowestDay  = TREND_DATA.reduce((a, b) => b.value < a.value ? b : a);

            // Chart dimensions — wide canvas so it never stretches
            const CW = 700, CH = 200, padL = 52, padR = 16, padT = 16, padB = 36;
            const chartW = CW - padL - padR;
            const chartH = CH - padT - padB;
            const yRange = trendMax - trendMin === 0 ? 1 : trendMax * 1.1 - 0;
            const toX = (i: number) => padL + (i / (TREND_DATA.length - 1)) * chartW;
            const toY = (v: number) => padT + chartH - (v / (trendMax * 1.1)) * chartH;

            const gridVals = [0, Math.round(trendMax * 0.25), Math.round(trendMax * 0.5), Math.round(trendMax * 0.75), Math.round(trendMax * 1.05)];

            const pts      = TREND_DATA.map((d, i) => `${toX(i)},${toY(d.value)}`);
            const linePath = `M ${pts.join(" L ")}`;
            const areaPath = `M ${toX(0)},${toY(0)} L ${pts.join(" L ")} L ${toX(TREND_DATA.length - 1)},${toY(0)} Z`;

            // Bar widths
            const barW = Math.floor(chartW / TREND_DATA.length * 0.5);

            return (
            <div className="space-y-5">

              {/* ── Stat cards ── */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Total This Week", value: `${totalDispensedWeek.toLocaleString()} L`, color: "text-[#003366]",  bg: "bg-blue-50",   icon: "local_gas_station"    },
                  { label: "Daily Average",   value: `${Math.round(avgDaily).toLocaleString()} L`, color: "text-[#1565c0]", bg: "bg-indigo-50", icon: "trending_up"          },
                  { label: "Peak Day",        value: `${peakDay.label} · ${peakDay.value.toLocaleString()} L`,  color: "text-[#2e7d32]", bg: "bg-green-50", icon: "emoji_events" },
                  { label: "Lowest Day",      value: `${lowestDay.label} · ${lowestDay.value.toLocaleString()} L`, color: "text-[#c62828]", bg: "bg-red-50",   icon: "arrow_downward"  },
                ].map(c => (
                  <div key={c.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
                      <span className={`material-symbols-outlined text-[18px] ${c.color}`}>{c.icon}</span>
                    </div>
                    <p className={`text-xl font-black font-headline ${c.color} leading-tight`}>{c.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{c.label}</p>
                  </div>
                ))}
              </div>

              {/* ── Weekly Consumption Chart ── */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-sm font-black text-[#003366]">Weekly Fuel Consumption</p>
                    <p className="text-xs text-slate-400">Daily liters dispensed across all stations</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="w-3 h-0.5 bg-[#003366] rounded-full inline-block" />Line
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="w-3 h-3 bg-[#003366]/10 rounded-sm inline-block border border-[#003366]/20" />Area
                    </div>
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-full">+5% vs last week</span>
                  </div>
                </div>
                <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full" style={{ height: 220 }}>
                  <defs>
                    <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#003366" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#003366" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>

                  {/* Gridlines + Y-axis labels */}
                  {gridVals.map((v, gi) => {
                    const gy = toY(v);
                    return (
                      <g key={gi}>
                        <line x1={padL} y1={gy} x2={CW - padR} y2={gy}
                          stroke={gi === 0 ? "#94a3b8" : "#e2e8f0"}
                          strokeWidth={gi === 0 ? 1.5 : 1}
                          strokeDasharray={gi === 0 ? "none" : "4 3"} />
                        <text x={padL - 6} y={gy + 4} textAnchor="end"
                          fontSize="9" fill="#94a3b8" fontWeight="600">
                          {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                        </text>
                      </g>
                    );
                  })}

                  {/* Bars */}
                  {TREND_DATA.map((d, i) => {
                    const bx = toX(i) - barW / 2;
                    const by = toY(d.value);
                    const bh = toY(0) - by;
                    const isPeak = d.label === peakDay.label;
                    return (
                      <rect key={i} x={bx} y={by} width={barW} height={bh}
                        rx="3"
                        fill={isPeak ? "#003366" : "#e8eef7"}
                      />
                    );
                  })}

                  {/* Area fill */}
                  <path d={areaPath} fill="url(#aGrad)" />

                  {/* Line */}
                  <path d={linePath} fill="none" stroke="#003366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Data points */}
                  {TREND_DATA.map((d, i) => (
                    <circle key={i} cx={toX(i)} cy={toY(d.value)} r="4"
                      fill={d.label === peakDay.label ? "#f59e0b" : "#003366"}
                      stroke="#fff" strokeWidth="2" />
                  ))}

                  {/* Value labels above dots */}
                  {TREND_DATA.map((d, i) => (
                    <text key={i} x={toX(i)} y={toY(d.value) - 9} textAnchor="middle"
                      fontSize="9" fill="#003366" fontWeight="800">
                      {(d.value / 1000).toFixed(1)}k
                    </text>
                  ))}

                  {/* X-axis labels */}
                  {TREND_DATA.map((d, i) => (
                    <text key={i} x={toX(i)} y={CH - 4} textAnchor="middle"
                      fontSize="10" fill="#64748b" fontWeight="700">
                      {d.label}
                    </text>
                  ))}
                </svg>
              </div>

              {/* ── Bottom row ── */}
              <div className="grid grid-cols-3 gap-5">

                {/* Brand Breakdown */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <p className="text-sm font-black text-[#003366] mb-1">Brand Breakdown</p>
                  <p className="text-xs text-slate-400 mb-4">Dispensed by fuel brand</p>
                  <div className="space-y-3.5">
                    {Object.entries(BRAND_COLORS).map(([brand]) => {
                      const tot = STATIONS.filter(s => s.brand === brand).reduce((a, s) => a + s.dispensed, 0);
                      if (tot === 0) return null;
                      const pct = Math.round((tot / totalDispensed) * 100);
                      const bk  = brandKey(brand);
                      return (
                        <div key={brand}>
                          <div className="flex justify-between text-xs font-bold mb-1.5">
                            <span className={`brand-text-${bk} flex items-center gap-1.5`}>
                              <span className={`w-2 h-2 rounded-full inline-block brand-dot-${bk}`} />{brand}
                            </span>
                            <span className="text-slate-400">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full brand-fill-${bk}`} ref={(el) => { if (el) el.style.width = `${pct}%`; }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Vehicle Distribution */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <p className="text-sm font-black text-[#003366] mb-1">Vehicle Distribution</p>
                  <p className="text-xs text-slate-400 mb-4">Registered residents by vehicle type</p>
                  <div className="space-y-3">
                    {[
                      { label: "Car",        icon: "directions_car", color: "text-blue-600",   bg: "bg-blue-50",   bar: "bg-blue-500"   },
                      { label: "Motorcycle", icon: "two_wheeler",    color: "text-purple-600", bg: "bg-purple-50", bar: "bg-purple-500" },
                      { label: "Truck",      icon: "local_shipping", color: "text-orange-600", bg: "bg-orange-50", bar: "bg-orange-500" },
                    ].map(v => {
                      const cnt = RESIDENTS.filter(r => r.vehicle === v.label).length;
                      const pct = Math.round((cnt / RESIDENTS.length) * 100);
                      return (
                        <div key={v.label} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${v.bg} flex items-center justify-center shrink-0`}>
                            <span className={`material-symbols-outlined text-[16px] ${v.color}`}>{v.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span className="text-slate-700">{v.label}</span>
                              <span className="text-slate-400">{cnt} · {pct}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${v.bar}`} ref={(el) => { if (el) el.style.width = `${pct}%`; }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Station & Resident Status */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <p className="text-sm font-black text-[#003366] mb-1">System Status</p>
                  <p className="text-xs text-slate-400 mb-4">Stations and resident overview</p>
                  <div className="space-y-2.5">
                    {[
                      { label: "Online Stations",     value: onlineStations,                                     icon: "cell_tower",      bg: "bg-green-50",  border: "border-green-100", text: "text-green-700",  dot: "bg-green-500 animate-pulse" },
                      { label: "Offline Stations",    value: STATIONS.length - onlineStations,                   icon: "wifi_off",        bg: "bg-red-50",    border: "border-red-100",   text: "text-red-600",    dot: "bg-red-400" },
                      { label: "Active Residents",    value: RESIDENTS.filter(r => r.status === "Active").length, icon: "person_check",   bg: "bg-blue-50",   border: "border-blue-100",  text: "text-blue-700",   dot: "bg-blue-500" },
                      { label: "Maxed Quota",         value: maxedResidents,                                      icon: "block",          bg: "bg-orange-50", border: "border-orange-100",text: "text-orange-700", dot: "bg-orange-500" },
                      { label: "New Registrations",   value: RESIDENTS.filter(r => r.status === "New").length,   icon: "person_add",     bg: "bg-purple-50", border: "border-purple-100",text: "text-purple-700", dot: "bg-purple-500" },
                    ].map(s => (
                      <div key={s.label} className={`flex items-center justify-between px-3 py-2 rounded-xl ${s.bg} border ${s.border}`}>
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-[15px] ${s.text}`}>{s.icon}</span>
                          <span className={`text-xs font-bold ${s.text}`}>{s.label}</span>
                        </div>
                        <span className={`text-lg font-black ${s.text}`}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
            );
          })()}

        </main>
      </div>

      {/* ═══ TRANSACTION STATION BREAKDOWN DRAWER ═══ */}
      {activePage === "transactions" && txViewBy === "Stations" && txDrawerStation !== null && (() => {
        const s = txDrawerStation;
        const prices = BRAND_PRICES[s.brand] ?? [];

        // Apply drawer date filter
        const drawerTxns = s.txns.filter(t => {
          if (txDrawerFilter === "Today") return t.date === "Today";
          if (txDrawerFilter === "Week")  return t.date === "Today" || t.date === "Yesterday";
          if (txDrawerFilter === "Month") return true;
          return true;
        });
        const liters  = drawerTxns.reduce((a, t) => a + t.liters, 0);
        const revenue = drawerTxns.reduce((a, t) => a + t.liters * t.pricePerLiter, 0);

        return (
          <>
            <div className="fixed inset-0 bg-black/10 z-40" onClick={() => setTxDrawerStation(null)} />
            <div className="fixed top-0 right-0 h-full w-[380px] bg-white shadow-2xl border-l border-slate-100 z-50 flex flex-col">
              {/* Header */}
              <div className="bg-[#003366] p-5 shrink-0">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-yellow-400 text-[22px]">local_gas_station</span>
                  </div>
                  <button onClick={() => setTxDrawerStation(null)} className="text-white/50 hover:text-white transition-colors mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
                <p className="text-white font-black text-sm leading-tight mb-0.5">{s.name}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${brandBadgeClass(s.brand)}`}>{s.brand || "—"}</span>
                  {prices.map((p, pi) => (
                    <span key={pi} className="text-[10px] font-bold bg-white/10 text-white/70 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                      {p.label.split(" ").slice(-1)[0]} ₱{p.price.toFixed(2)}
                    </span>
                  ))}
                </div>
                {/* Date filter pills */}
                <div className="flex gap-1.5 mb-4">
                  {["All","Today","Week","Month"].map(f => (
                    <button key={f} onClick={() => setTxDrawerFilter(f)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                        txDrawerFilter === f ? "bg-white text-[#003366] border-white" : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20"
                      }`}>
                      {f}
                    </button>
                  ))}
                </div>
                {/* Summary strip */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-white/50 text-[9px] font-bold uppercase tracking-wider">Transactions</p>
                    <p className="text-white font-black text-lg">{drawerTxns.length}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-white/50 text-[9px] font-bold uppercase tracking-wider">Total Liters</p>
                    <p className="text-white font-black text-lg">{liters.toFixed(1)} L</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-white/50 text-[9px] font-bold uppercase tracking-wider">Revenue</p>
                    <p className="text-yellow-400 font-black text-base leading-tight mt-0.5">₱{revenue.toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
                  </div>
                </div>
              </div>

              {/* Section label + action buttons */}
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 shrink-0 flex items-center justify-between">
                <p className="text-[10px] font-black text-[#003366] uppercase tracking-wider">
                  Transaction Breakdown
                  <span className="ml-1.5 font-bold text-slate-400 normal-case">({drawerTxns.length})</span>
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      const rows = [
                        ["Resident","Plate","Fuel Type","Date","Time","Price/L","Liters","Total Paid"],
                        ...drawerTxns.map(t => [
                          t.resident, t.plate, t.type, t.date, t.time,
                          t.pricePerLiter.toFixed(2), t.liters.toFixed(1),
                          (t.liters * t.pricePerLiter).toFixed(2),
                        ]),
                      ];
                      const csv  = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
                      const blob = new Blob([csv], { type: "text/csv" });
                      const url  = URL.createObjectURL(blob);
                      const a    = document.createElement("a");
                      a.href     = url;
                      a.download = `AGAS_${s.name.replace(/\s/g,"_")}_${txDrawerFilter}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-all">
                    <span className="material-symbols-outlined text-[13px]">download</span>CSV
                  </button>
                  <button
                    onClick={() => {
                      const tableRows = drawerTxns.map(t => {
                        const total = (t.liters * t.pricePerLiter).toFixed(2);
                        return `<tr><td>${t.resident}</td><td>${t.plate}</td><td>${t.type}</td><td>${t.date} ${t.time}</td><td>₱${t.pricePerLiter.toFixed(2)}/L × ${t.liters.toFixed(1)} L</td><td>₱${total}</td></tr>`;
                      }).join("");
                      const win = window.open("", "_blank");
                      if (!win) return;
                      win.document.write(`<!DOCTYPE html><html><head><title>${s.name} — Transactions</title>
                        <style>
                          body{font-family:sans-serif;font-size:12px;padding:24px;color:#1e293b}
                          h2{color:#003366;margin-bottom:4px}p{color:#64748b;font-size:11px;margin-bottom:16px}
                          table{width:100%;border-collapse:collapse}
                          th{background:#f1f5f9;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.05em;padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0}
                          td{padding:7px 12px;border-bottom:1px solid #f1f5f9}
                          tr:nth-child(even) td{background:#f8fafc}
                          tfoot td{background:#eef2ff;font-weight:900;color:#003366}
                        </style>
                      </head><body>
                        <h2>${s.name}</h2>
                        <p>${s.brand} &nbsp;·&nbsp; Period: ${txDrawerFilter} &nbsp;·&nbsp; ${drawerTxns.length} transactions &nbsp;·&nbsp; Generated: ${new Date().toLocaleString("en-PH")}</p>
                        <table>
                          <thead><tr><th>Resident</th><th>Plate</th><th>Fuel</th><th>Date & Time</th><th>Price × Liters</th><th>Total Paid</th></tr></thead>
                          <tbody>${tableRows}</tbody>
                          <tfoot><tr><td colspan="4">Total</td><td>${liters.toFixed(1)} L</td><td>₱${revenue.toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}</td></tr></tfoot>
                        </table>
                      </body></html>`);
                      win.document.close();
                      win.focus();
                      win.print();
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-all">
                    <span className="material-symbols-outlined text-[13px]">print</span>Print
                  </button>
                </div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {drawerTxns.map((tx) => {
                  const total = tx.liters * tx.pricePerLiter;
                  return (
                    <div key={tx.id} className="px-4 py-3.5 hover:bg-slate-50">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{tx.resident}</p>
                          <p className="text-[10px] text-slate-400 font-mono tracking-wider">{tx.plate}</p>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 ${fuelBadgeClass(tx.type)}`}>{tx.type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] text-slate-400 space-y-0.5">
                          <p>{tx.date} · {tx.time}</p>
                          <p>₱{tx.pricePerLiter.toFixed(2)}/L × {tx.liters.toFixed(1)} L</p>
                        </div>
                        <p className="text-sm font-black text-green-700">₱{total.toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 shrink-0 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{txDrawerFilter} Revenue</span>
                <span className="text-sm font-black text-green-700">₱{revenue.toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
              </div>
            </div>
          </>
        );
      })()}

      {/* ═══ ALLOCATION FUEL BREAKDOWN DRAWER ═══ */}
      {activePage === "allocation" && allocDrawerStationId !== null && (() => {
        const drawerStation = STATIONS.find(s => s.id === allocDrawerStationId) ?? null;
        if (!drawerStation) return null;
        const fuelSplits: Record<string, number[]> = {
          Shell:   [0.30, 0.42, 0.18, 0.10],
          Petron:  [0.35, 0.40, 0.25],
          Caltex:  [0.32, 0.38, 0.18, 0.12],
          Phoenix: [0.38, 0.40, 0.22],
          SeaOil:  [0.40, 0.38, 0.22],
        };
        const drawerFuels = (BRAND_PRICES[drawerStation.brand] ?? []).map((f, idx) => {
          const splits   = fuelSplits[drawerStation.brand] ?? [];
          const ratio    = splits[idx] ?? (1 / (BRAND_PRICES[drawerStation.brand]?.length ?? 1));
          const capAlloc = Math.round(drawerStation.capacity * ratio);
          const disAlloc = Math.round(drawerStation.dispensed * ratio);
          const pct      = Math.min(Math.round((disAlloc / capAlloc) * 100), 100);
          return { label: f.label, price: f.price, capacity: capAlloc, dispensed: disAlloc, pct };
        });
        return (
          <>
            <div className="fixed inset-0 bg-black/10 z-40" onClick={() => setAllocDrawerStationId(null)} />
            <div className="fixed top-0 right-0 h-full w-[360px] bg-white shadow-2xl border-l border-slate-100 z-50 flex flex-col">
              {/* Header */}
              <div className="bg-[#003366] p-5 shrink-0">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-yellow-400 text-[22px]">local_gas_station</span>
                  </div>
                  <button onClick={() => setAllocDrawerStationId(null)} className="text-white/50 hover:text-white transition-colors mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
                <p className="text-white font-black text-sm leading-tight mb-1">{drawerStation.name}</p>
                <p className="text-white/50 text-[11px] mb-4">{drawerStation.brand} · {drawerStation.barangay}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-white/50 text-[9px] font-bold uppercase tracking-wider">Capacity</p>
                    <p className="text-white font-black text-lg">{(drawerStation.capacity / 1000).toFixed(0)}k L</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-white/50 text-[9px] font-bold uppercase tracking-wider">Dispensed</p>
                    <p className="text-yellow-400 font-black text-lg">{drawerStation.dispensed.toLocaleString()} L</p>
                  </div>
                </div>
              </div>
              {/* Scrollable fuel breakdown */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <p className="text-[10px] font-black text-[#003366] uppercase tracking-wider">Fuel Type Breakdown</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {drawerFuels.map((f, idx) => (
                    <div key={idx} className="px-4 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs font-black text-slate-800">{f.label}</p>
                          <p className="text-[10px] text-slate-400">₱{f.price.toFixed(2)}/L</p>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          f.pct >= 80 ? "bg-red-100 text-red-700" : f.pct >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                        }`}>{f.pct}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                        <div className={`h-full rounded-full transition-all ${f.pct >= 80 ? "bg-red-500" : f.pct >= 50 ? "bg-yellow-400" : "bg-[#003366]"}`}
                          ref={(el) => { if (el) el.style.width = `${f.pct}%`; }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>{f.dispensed.toLocaleString()} L dispensed</span>
                        <span>{f.capacity.toLocaleString()} L cap</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Footer */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 shrink-0 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                <div className="text-right">
                  <span className="text-sm font-black text-[#003366]">{drawerStation.dispensed.toLocaleString()} L</span>
                  <span className="text-[10px] text-slate-400 ml-1">/ {(drawerStation.capacity / 1000).toFixed(0)}k L</span>
                </div>
              </div>
            </div>
          </>
        );
      })()}

    </div>
  );
}

