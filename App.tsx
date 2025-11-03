
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { metroData } from './constants';

// --- TYPE DEFINITIONS ---
declare const L: any; // Inform TypeScript that L (Leaflet) is a global variable

interface Station {
    id: string;
    name: string;
    line: string;
    lat: number;
    lon: number;
    interchange?: boolean;
}

interface ViaStop {
    uuid: string;
    stationId: string | null;
}

// --- PATHFINDING & HELPERS ---

/**
 * Priority Queue for Dijkstra's Algorithm.
 */
class PriorityQueue {
    private collection: { element: string; priority: number }[] = [];
    enqueue(element: string, priority: number) { this.collection.push({ element, priority }); this.sort(); }
    dequeue() { return this.collection.shift(); }
    isEmpty() { return this.collection.length === 0; }
    sort() { this.collection.sort((a, b) => a.priority - b.priority); }
}

/**
 * Calculates distance between two lat/lon points using Haversine formula.
 * @returns {number} Distance in kilometers.
 */
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// --- REACT COMPONENTS ---

/**
 * A reusable, searchable combobox component for station selection.
 */
const Combobox: React.FC<{
    stations: Station[];
    placeholder: string;
    selectedStationId: string | null;
    onSelect: (stationId: string | null) => void;
}> = ({ stations, placeholder, selectedStationId, onSelect }) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const sortedStations = useMemo(() => [...stations].sort((a, b) => a.name.localeCompare(b.name)), [stations]);

    const filteredStations = useMemo(() =>
        query === ''
            ? sortedStations
            : sortedStations.filter(s =>
                s.name.toLowerCase().includes(query.toLowerCase()) ||
                s.line.toLowerCase().includes(query.toLowerCase())
            ),
        [query, sortedStations]
    );

    const selectedStation = useMemo(() =>
        stations.find(s => s.id === selectedStationId)
    , [selectedStationId, stations]);

    useEffect(() => {
        setQuery(selectedStation ? `${selectedStation.name} (${selectedStation.line})` : '');
    }, [selectedStation]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                if (!selectedStation) setQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedStation]);


    const handleSelect = (station: Station) => {
        onSelect(station.id);
        setQuery(`${station.name} (${station.line})`);
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) {
            if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) setIsOpen(true);
            return;
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prev => Math.min(prev + 1, filteredStations.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0 && filteredStations[activeIndex]) {
                    handleSelect(filteredStations[activeIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
        }
    };

    return (
        <div ref={wrapperRef} className="combobox-wrapper w-full">
            <input
                type="text"
                placeholder={placeholder}
                className={`combobox-input w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none ${isOpen ? 'open' : ''}`}
                value={query}
                onChange={e => {
                    setQuery(e.target.value);
                    if (!isOpen) setIsOpen(true);
                    setActiveIndex(0);
                }}
                onFocus={() => {
                    setIsOpen(true);
                    (document.activeElement as HTMLInputElement)?.select();
                }}
                onKeyDown={handleKeyDown}
            />
            {isOpen && (
                <div className="combobox-options">
                    {filteredStations.length > 0 ? (
                        filteredStations.map((station, index) => (
                            <div
                                key={station.id}
                                className={`combobox-option ${index === activeIndex ? 'active' : ''}`}
                                onMouseDown={(e) => { e.preventDefault(); handleSelect(station); }}
                            >
                                {station.name} ({station.line})
                            </div>
                        ))
                    ) : (
                        <div className="combobox-option text-gray-500">No stations found</div>
                    )}
                </div>
            )}
        </div>
    );
};


/**
 * The main application component containing the map and control panel.
 */
const PathfinderApp = () => {
    // --- STATE MANAGEMENT ---
    const [startStationId, setStartStationId] = useState<string | null>(null);
    const [endStationId, setEndStationId] = useState<string | null>(null);
    const [viaStops, setViaStops] = useState<ViaStop[]>([]);
    const [pathResult, setPathResult] = useState<{ path: string[], distance: number } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, station: Station } | null>(null);

    // --- REFS FOR MAP & LAYERS ---
    const mapRef = useRef<any>(null);
    const stationMarkersLayerRef = useRef<any>(null);
    const stationLabelsLayerRef = useRef<any>(null);
    const routePathLayerRef = useRef<any>(null);
    const routeLabelsLayerRef = useRef<any>(null);

    // --- MEMOIZED DATA ---
    const { stationMap, stationGraph, interchangeStationIds } = useMemo(() => {
        const stationMap = new Map<string, Station>(metroData.stations.map(s => [s.id, s]));
        const stationGraph = new Map<string, { station: Station, neighbors: { id: string, distance: number }[] }>();
        metroData.stations.forEach(station => stationGraph.set(station.id, { station, neighbors: [] }));
        metroData.connections.forEach(([id1, id2]) => {
            const s1 = stationMap.get(id1);
            const s2 = stationMap.get(id2);
            if (!s1 || !s2) return;
            let distance = getHaversineDistance(s1.lat, s1.lon, s2.lat, s2.lon);
             if (s1.line !== s2.line) distance += 0.5; // Transfer penalty
             else if (distance === 0 && s1.id !== s2.id) distance = 0.01;
            stationGraph.get(id1)!.neighbors.push({ id: id2, distance });
            stationGraph.get(id2)!.neighbors.push({ id: id1, distance });
        });
        const interchangeStationIds = new Set(metroData.stations.filter(s => s.interchange).map(s => s.id));
        return { stationMap, stationGraph, interchangeStationIds };
    }, []);

    // --- HELPER & HANDLER FUNCTIONS ---
    const getStationById = useCallback((id: string) => stationMap.get(id), [stationMap]);

    const setStart = useCallback((id: string | null) => {
        if (id === endStationId || viaStops.some(v => v.stationId === id)) return;
        setStartStationId(id);
    }, [endStationId, viaStops]);

    const setEnd = useCallback((id: string | null) => {
        if (id === startStationId || viaStops.some(v => v.stationId === id)) return;
        setEndStationId(id);
    }, [startStationId, viaStops]);
    
    const handleStationClick = useCallback((stationId: string) => {
        if (!startStationId) {
            setStart(stationId);
        } else if (!endStationId) {
            setEnd(stationId);
        } else {
            // If both are set, clicking a new station replaces the start station
            setEnd(endStationId); // re-validate end
            setStart(stationId);
        }
    }, [startStationId, endStationId, setStart, setEnd]);

    const setViaStation = useCallback((uuid: string, stationId: string | null) => {
        if (stationId && (stationId === startStationId || stationId === endStationId || viaStops.some(v => v.stationId === stationId && v.uuid !== uuid))) return;
        setViaStops(prev => prev.map(v => v.uuid === uuid ? { ...v, stationId } : v));
    }, [startStationId, endStationId, viaStops]);
    
    const handleContextAddVia = () => {
        if (!contextMenu) return;
        const stationIdToAdd = contextMenu.station.id;
        const emptyVia = viaStops.find(v => v.stationId === null);
    
        if (emptyVia) {
            setViaStation(emptyVia.uuid, stationIdToAdd);
        } else {
            const newUuid = crypto.randomUUID();
            setViaStops(prev => [...prev, { uuid: newUuid, stationId: stationIdToAdd }]);
        }
        setContextMenu(null);
    };

    const addViaStop = () => setViaStops(prev => [...prev, { uuid: crypto.randomUUID(), stationId: null }]);
    const removeViaStop = (uuid: string) => {
        setViaStops(prev => prev.filter(v => v.uuid !== uuid));
    };

    const handleSwap = () => {
        const oldStart = startStationId;
        const oldEnd = endStationId;
        setStartStationId(oldEnd);
        setEndStationId(oldStart);
    };

    const handleReset = () => {
        routePathLayerRef.current?.clearLayers();
        routeLabelsLayerRef.current?.clearLayers();
        setStartStationId(null);
        setEndStationId(null);
        setViaStops([]);
        setPathResult(null);
    };

    const runPathfinding = () => {
        routePathLayerRef.current?.clearLayers();
        routeLabelsLayerRef.current?.clearLayers();
        setPathResult(null);
    
        const allStops = [startStationId, ...viaStops.map(v => v.stationId), endStationId];
        if (allStops.some(id => !id)) {
            alert("Please select all start, via, and end stations.");
            return;
        }
    
        const findDijkstra = (startId: string, endId: string) => {
            let distances = new Map();
            let prev = new Map();
            let pq = new PriorityQueue();
    
            stationGraph.forEach((_, id) => {
                distances.set(id, Infinity);
                prev.set(id, null);
            });
    
            distances.set(startId, 0);
            pq.enqueue(startId, 0);
    
            while (!pq.isEmpty()) {
                let { element: u } = pq.dequeue()!;
                if (u === endId) break;
    
                stationGraph.get(u)!.neighbors.forEach(neighbor => {
                    let newDistance = distances.get(u)! + neighbor.distance;
                    if (newDistance < distances.get(neighbor.id)!) {
                        distances.set(neighbor.id, newDistance);
                        prev.set(neighbor.id, u);
                        pq.enqueue(neighbor.id, newDistance);
                    }
                });
            }
    
            const path: string[] = [];
            let current: string | null = endId;
            while (current) {
                path.unshift(current);
                current = prev.get(current) || null;
            }
    
            if (path[0] === startId) {
                return { path, distance: distances.get(endId)! };
            }
            return { path: null, distance: Infinity };
        };
    
        let totalPath: string[] = [];
        let totalDistance = 0;
        let pathFound = true;
    
        for (let i = 0; i < allStops.length - 1; i++) {
            const segmentStartId = allStops[i]!;
            const segmentEndId = allStops[i + 1]!;
    
            if (segmentStartId === segmentEndId) continue;
    
            const { path, distance } = findDijkstra(segmentStartId, segmentEndId);
    
            if (!path) {
                const startName = getStationById(segmentStartId)?.name;
                const endName = getStationById(segmentEndId)?.name;
                alert(`No path could be found between ${startName} and ${endName}.`);
                pathFound = false;
                break;
            }
    
            if (totalPath.length === 0) {
                totalPath.push(...path);
            } else {
                totalPath.push(...path.slice(1));
            }
            totalDistance += distance;
        }
    
        if (pathFound && totalPath.length > 0) {
            setPathResult({ path: totalPath, distance: totalDistance });
        }
    };
    
    // --- MAP INITIALIZATION & DRAWING ---
    useEffect(() => {
        if (mapRef.current) return; // Initialize map only once

        const map = L.map('map').setView([19.10, 72.86], 12);
        mapRef.current = map;
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO', subdomains: 'abcd', maxZoom: 20, minZoom: 11
        }).addTo(map);

        // Initialize layer groups
        stationMarkersLayerRef.current = L.layerGroup().addTo(map);
        stationLabelsLayerRef.current = L.layerGroup(); // Not added initially
        routePathLayerRef.current = L.layerGroup().addTo(map);
        routeLabelsLayerRef.current = L.layerGroup().addTo(map);

        // Draw static elements
        const lineColors: Record<string, string> = { blue: '#007bff', yellow: '#ffc107', red: '#dc3545', aqua: '#00ffff' };
        metroData.connections.forEach(([id1, id2]) => {
            const s1 = getStationById(id1);
            const s2 = getStationById(id2);
            if (s1 && s2 && s1.line === s2.line) {
                L.polyline([[s1.lat, s1.lon], [s2.lat, s2.lon]],
                           { color: lineColors[s1.line] || '#888', weight: 3, opacity: 0.7 }
                          ).addTo(map);
            }
        });

         metroData.stations.forEach(station => {
             const marker = L.circleMarker([station.lat, station.lon], {
                 renderer: L.svg(),
                 stationId: station.id // Attach station ID to marker
             }).on('click', () => handleStationClick(station.id));
             stationMarkersLayerRef.current.addLayer(marker);

             const label = L.tooltip({
                 content: station.name, permanent: true, direction: 'right', offset: [8, 0], className: 'station-label'
             }).setLatLng([station.lat, station.lon]);
             stationLabelsLayerRef.current.addLayer(label);
         });

        // Map event handlers
        const handleZoom = () => {
            const zoom = map.getZoom();
            if (zoom >= 14) {
                if (!map.hasLayer(stationLabelsLayerRef.current)) map.addLayer(stationLabelsLayerRef.current);
            } else {
                if (map.hasLayer(stationLabelsLayerRef.current)) map.removeLayer(stationLabelsLayerRef.current);
            }
        };

        map.on('zoomend', handleZoom);
        map.on('contextmenu', (e: any) => {
            e.originalEvent.preventDefault();
            let closestStation: Station | null = null;
            let minDistance = Infinity;
            metroData.stations.forEach(station => {
                const distance = getHaversineDistance(e.latlng.lat, e.latlng.lng, station.lat, station.lon);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestStation = station;
                }
            });
            if (closestStation) {
                setContextMenu({ x: e.containerPoint.x, y: e.containerPoint.y, station: closestStation });
            }
        });
        map.on('click', () => setContextMenu(null));
        handleZoom();
    }, [getStationById, handleStationClick]);

    // --- DYNAMIC MAP UPDATES ---
    useEffect(() => {
        // Update station marker styles based on selection
        stationMarkersLayerRef.current?.eachLayer((layer: any) => {
            const id = layer.options.stationId;
            const station = getStationById(id);
            if (!station) return;

            const isInterchange = interchangeStationIds.has(id);
            const lineColors: Record<string, string> = { blue: '#007bff', yellow: '#ffc107', red: '#dc3545', aqua: '#00ffff' };
            const color = lineColors[station.line] || '#888';

            let style: any = {
                radius: isInterchange ? 8 : 6,
                fillColor: isInterchange ? 'white' : color,
                fillOpacity: 1,
                weight: isInterchange ? 4 : 2,
                color: isInterchange ? '#8B5CF6' : 'white',
            };

            if (id === startStationId) {
                style = { ...style, radius: 9, fillColor: '#22c55e', color: 'white', weight: 3 };
            } else if (id === endStationId) {
                style = { ...style, radius: 9, fillColor: '#ef4444', color: 'white', weight: 3 };
            }
            
            layer.setStyle(style);
            if (id === startStationId || id === endStationId) layer.bringToFront();
        });
    }, [startStationId, endStationId, getStationById, interchangeStationIds]);

    useEffect(() => {
        routePathLayerRef.current?.clearLayers();
        routeLabelsLayerRef.current?.clearLayers();

        if (!pathResult || !pathResult.path) return;

        const { path } = pathResult;
        const lineColors: Record<string, string> = { blue: '#007bff', yellow: '#ffc107', red: '#dc3545', aqua: '#00ffff' };
        let pathBounds = L.latLngBounds();

        for (let i = 0; i < path.length - 1; i++) {
            const s1 = getStationById(path[i]);
            const s2 = getStationById(path[i + 1]);
            if (!s1 || !s2) continue;

            let line = s1.line !== s2.line ? s2.line : s1.line;
            const color = lineColors[line] || '#888';
            const segmentPoints = [[s1.lat, s1.lon], [s2.lat, s2.lon]];

            L.polyline.antPath(segmentPoints, {
                color: color, weight: 6, opacity: 0.8, delay: 400, dashArray: [10, 20], pulseColor: '#ffffff'
            }).addTo(routePathLayerRef.current);

            pathBounds.extend([s1.lat, s1.lon]);
            pathBounds.extend([s2.lat, s2.lon]);
        }

        const startStation = getStationById(path[0]);
        const endStation = getStationById(path[path.length - 1]);
        const viaStations = viaStops.map(v => v.stationId).filter(Boolean).map(id => getStationById(id!));

        if (startStation) {
            L.tooltip({ content: startStation.name, permanent: true, direction: 'top', offset: [0, -10], className: 'route-endpoint-label route-start-label' })
             .setLatLng([startStation.lat, startStation.lon]).addTo(routeLabelsLayerRef.current);
        }
        if (endStation) {
             L.tooltip({ content: endStation.name, permanent: true, direction: 'top', offset: [0, -10], className: 'route-endpoint-label route-end-label' })
              .setLatLng([endStation.lat, endStation.lon]).addTo(routeLabelsLayerRef.current);
        }
        viaStations.forEach((station, index) => {
            if (station) {
                L.tooltip({ content: `Via ${index + 1}: ${station.name}`, permanent: true, direction: 'top', offset: [0, -10], className: 'route-endpoint-label route-via-label' })
                 .setLatLng([station.lat, station.lon]).addTo(routeLabelsLayerRef.current);
            }
        });
        
        if (pathBounds.isValid()) {
            mapRef.current.fitBounds(pathBounds, { padding: [50, 50] });
        }

    }, [pathResult, getStationById, viaStops]);
    
    // --- RENDER ---
    return (
        <div id="app-container">
            {contextMenu && (
                <div id="context-menu" style={{ left: contextMenu.x + 10, top: contextMenu.y + 10 }}>
                    <div id="context-station-name">Nearest: {contextMenu.station.name}</div>
                    <div className="context-menu-item" onClick={() => { setStart(contextMenu.station.id); setContextMenu(null); }}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                         <span>Set as Start</span>
                     </div>
                     <div className="context-menu-item" onClick={handleContextAddVia}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                         <span>Add as Stop</span>
                     </div>
                     <div className="context-menu-item" onClick={() => { setEnd(contextMenu.station.id); setContextMenu(null); }}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                         <span>Set as End</span>
                     </div>
                </div>
            )}

            <div id="control-panel">
                <div className="flex flex-col h-full">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">MMR Pathfinder</h1>
                        <p className="text-sm text-gray-500 mt-1">Select start, end, and optional via stations.</p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Start Station</label>
                            <Combobox stations={metroData.stations} placeholder="Search for start station..." selectedStationId={startStationId} onSelect={setStart} />
                        </div>

                        <div id="via-stops-container" className="mt-3">
                            {viaStops.map((via, index) => (
                                <div key={via.uuid} className="via-stop-row">
                                    <label className="block text-sm font-semibold text-gray-700 mr-2 whitespace-nowrap">Via {index + 1}:</label>
                                    <Combobox stations={metroData.stations} placeholder="Search for via station..." selectedStationId={via.stationId} onSelect={(id) => setViaStation(via.uuid, id)} />
                                    <button onClick={() => removeViaStop(via.uuid)} className="remove-via-stop-btn ml-2" title="Remove stop">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button id="add-via-stop" onClick={addViaStop} className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            Add Stop
                        </button>

                        <div className="flex items-center justify-center space-x-4 my-3">
                            <button id="swap-stations" title="Swap start/end stations" onClick={handleSwap} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                             </button>
                             <button id="reset-route" title="Reset selection" onClick={handleReset} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             </button>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">End Station</label>
                            <Combobox stations={metroData.stations} placeholder="Search for end station..." selectedStationId={endStationId} onSelect={setEnd} />
                        </div>

                        <button id="find-path" onClick={runPathfinding} className="mt-6 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95">
                            Find Shortest Path
                        </button>
                    </div>
                    
                    {pathResult && (
                        <div id="results-panel" className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 flex-grow animate-fade-in">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Result:</h2>
                            <p id="total-distance" className="text-xl font-semibold text-blue-700 mb-4">Total Distance: {pathResult.distance.toFixed(2)} km</p>
                            <div id="path-list" className="bg-white rounded-lg p-3 shadow-inner overflow-y-auto">
                                <PathDisplay path={pathResult.path} viaStops={viaStops} getStationById={getStationById} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div id="map"></div>
        </div>
    );
};

const PathDisplay: React.FC<{
    path: string[];
    viaStops: ViaStop[];
    getStationById: (id: string) => Station | undefined;
}> = ({ path, viaStops, getStationById }) => {
    const lineColors = { blue: 'border-blue-500', yellow: 'border-yellow-400', red: 'border-red-500', aqua: 'border-cyan-400' };
    const lineTextColors = { blue: 'text-blue-600', yellow: 'text-yellow-600', red: 'text-red-600', aqua: 'text-cyan-600' };
    const lineBGColors = { blue: 'bg-blue-500', yellow: 'bg-yellow-400', red: 'bg-red-500', aqua: 'bg-cyan-400' };
    
    const viaStopsInPath = viaStops.map(v => v.stationId).filter((id): id is string => id !== null);

    const segments: { type: 'start' | 'end' | 'change' | 'via' | 'stops'; station?: Station; prevStation?: Station; stops?: Station[] }[] = [];
    
    if (path.length > 0) {
        segments.push({ type: 'start', station: getStationById(path[0]) });

        let segmentStartIndex = 0;
        let currentViaIndex = 0;

        for (let i = 1; i < path.length; i++) {
            const prevStation = getStationById(path[i-1])!;
            const currStation = getStationById(path[i])!;

            if (prevStation.line !== currStation.line) {
                const stops = path.slice(segmentStartIndex + 1, i).map(id => getStationById(id)!);
                if (stops.length > 0) segments.push({ type: 'stops', stops });
                segments.push({ type: 'change', station: currStation, prevStation: prevStation });
                segmentStartIndex = i;
            }

            if (currentViaIndex < viaStopsInPath.length && currStation.id === viaStopsInPath[currentViaIndex]) {
                 const stops = path.slice(segmentStartIndex + 1, i).map(id => getStationById(id)!);
                 if (stops.length > 0) segments.push({ type: 'stops', stops });
                 segments.push({ type: 'via', station: currStation });
                 segmentStartIndex = i;
                 currentViaIndex++;
             }
        }
        
        const lastSegmentStops = path.slice(segmentStartIndex + 1, path.length -1).map(id => getStationById(id)!);
        if (lastSegmentStops.length > 0) segments.push({ type: 'stops', stops: lastSegmentStops });
        
        segments.push({ type: 'end', station: getStationById(path[path.length - 1]) });
    }

    return (
        <div>
            {segments.map((segment, index) => {
                switch (segment.type) {
                    case 'start':
                        return (
                            <div key={index} className="path-step">
                                <div className={`path-icon-start ${lineBGColors[segment.station!.line] || 'bg-gray-400'} rounded-full flex items-center justify-center`}><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 5.414V17a1 1 0 102 0V5.414l4.707 4.707a1 1 0 001.414-1.414l-7-7z"></path></svg></div>
                                <div className="font-bold text-gray-800">{segment.station!.name}</div>
                            </div>
                        );
                    case 'end':
                         return (
                            <div key={index} className="path-step">
                                 <div className={`path-icon-end ${lineBGColors['red'] || 'bg-red-500'} rounded-full flex items-center justify-center`}><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg></div>
                                <div className="font-bold text-gray-800">{segment.station!.name}</div>
                                <div className="text-sm text-gray-500">You have arrived</div>
                            </div>
                        );
                    case 'change':
                        return (
                             <div key={index} className="path-step">
                                 <div className={`path-icon border-4 ${lineColors[segment.prevStation!.line] || 'border-gray-400'}`}></div>
                                 <div className="change-block">
                                     <div className="font-bold text-purple-800">Change at {segment.station!.name}</div>
                                     <div className={`text-sm font-semibold ${lineTextColors[segment.station!.line] || 'text-gray-500'}`}>Take {segment.station!.line} line</div>
                                 </div>
                             </div>
                        );
                    case 'via':
                        return (
                            <div key={index} className="path-step">
                                <div className="path-icon path-icon-via border-4"></div>
                                <div className="font-bold text-gray-800">{segment.station!.name}</div>
                                <div className="text-sm text-purple-600 font-semibold">(Via Stop)</div>
                            </div>
                        );
                    case 'stops':
                        const [isOpen, setIsOpen] = useState(false);
                        const stopListId = `stop-list-${index}`;
                        return (
                            <div key={index} className="path-step">
                                <div className="mb-2">
                                     <span onClick={() => setIsOpen(!isOpen)} className="bg-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full hover:bg-gray-300 cursor-pointer">
                                         {segment.stops!.length} stop(s)
                                     </span>
                                 </div>
                                {isOpen && (
                                     <ul id={stopListId} className="stop-list">
                                          {segment.stops!.map(stop => <li key={stop.id} className="text-sm text-gray-600 py-0.5">{stop.name}</li>)}
                                     </ul>
                                )}
                            </div>
                        );
                    default:
                        return null;
                }
            })}
        </div>
    );
};


/**
 * Landing Page Component
 */
const LandingPage: React.FC<{ onLaunch: () => void }> = ({ onLaunch }) => {
    return (
        <div className="h-full w-full bg-[#111827] text-white flex flex-col">
            <header className="absolute top-0 left-0 right-0 p-4 z-10">
                <nav className="max-w-7xl mx-auto flex justify-between items-center px-4">
                    <div className="text-xl font-bold">Mumbai Metro Pathfinder</div>
                    {/* Add nav links here if needed */}
                </nav>
            </header>

            <main className="flex-grow flex items-center justify-center text-center">
                <div className="flex flex-col items-center px-4 animate-fade-in">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                            Mumbai Metro Pathfinder
                        </span>
                    </h1>
                    <p className="mt-8 max-w-2xl text-lg text-gray-400">
                        Navigate Mumbai's metro network with ease. Find the optimal route between
                        any two stations using our intelligent pathfinding tool.
                    </p>
                    <button
                        onClick={onLaunch}
                        className="mt-8 bg-white/10 text-white font-semibold py-3 px-8 rounded-full border border-white/20 hover:bg-white/20 transition-transform transform hover:scale-105"
                    >
                        Launch Pathfinder
                    </button>
                </div>
            </main>

            <footer className="w-full p-4 text-center text-xs text-gray-500">
                <p>&copy; {new Date().getFullYear()} MMR Pathfinder. All rights reserved.</p>
                <div className="mt-2">
                    <p>Harshil Kotadia</p>
                    <p>harshil.kotadia@gmail.com</p>
                </div>
            </footer>
        </div>
    );
};

/**
 * Main App component to switch between Landing and Pathfinder.
 */
function App() {
    const [showPathfinder, setShowPathfinder] = useState(false);

    if (showPathfinder) {
        return <PathfinderApp />;
    }

    return <LandingPage onLaunch={() => setShowPathfinder(true)} />;
}

export default App;
