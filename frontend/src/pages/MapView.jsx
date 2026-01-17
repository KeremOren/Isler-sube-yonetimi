import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Format currency
const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

// Format percent
const formatPercent = (value) => {
    if (value === null || value === undefined) return '-';
    return `%${Number(value).toFixed(1)}`;
};

// Custom marker icons
const createMarkerIcon = (isProfitable) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
      width: 36px;
      height: 36px;
      background: ${isProfitable ? '#22c55e' : '#ef4444'};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      cursor: pointer;
    ">📚</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
    });
};

export default function MapView() {
    const [branches, setBranches] = useState([]);
    const [districts, setDistricts] = useState(null);
    const [mapLayer, setMapLayer] = useState('branches');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // İzmir center coordinates
    const center = [38.42, 27.13];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                // Fetch branches
                const branchRes = await fetch('http://localhost:3001/map/branches?year=2024', { headers });
                if (!branchRes.ok) throw new Error(`Şube verisi alınamadı: ${branchRes.status}`);
                const branchData = await branchRes.json();
                setBranches(branchData.features || []);

                // Fetch districts
                const districtRes = await fetch('http://localhost:3001/map/districts', { headers });
                if (!districtRes.ok) throw new Error(`İlçe verisi alınamadı: ${districtRes.status}`);
                const districtData = await districtRes.json();
                setDistricts(districtData);

            } catch (err) {
                setError(err.message);
                console.error('Map fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // District style based on layer
    const getDistrictStyle = (feature) => {
        const districtName = feature.properties?.name;

        // Zararlı şubelerin olduğu ilçeler
        const unprofitableDistricts = ['Narlıdere', 'Menemen'];
        const isUnprofitable = unprofitableDistricts.includes(districtName);

        if (mapLayer === 'density') {
            return {
                fillColor: isUnprofitable ? '#ef4444' : '#22c55e',
                weight: 2,
                opacity: 1,
                color: 'white',
                fillOpacity: 0.5,
            };
        }

        return {
            fillColor: '#3b82f6',
            weight: 1,
            opacity: 0.3,
            color: '#1d4ed8',
            fillOpacity: 0.05,
        };
    };

    const onEachDistrict = (feature, layer) => {
        const props = feature.properties || {};
        layer.bindPopup(`
            <div style="font-family: system-ui; min-width: 180px;">
                <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px; color: #1f2937;">${props.name || 'Bilinmeyen'}</div>
                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280;">Nüfus:</span>
                    <strong>${(props.population || 0).toLocaleString('tr-TR')}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280;">Yoğunluk:</span>
                    <strong>${(props.density || 0).toLocaleString('tr-TR')}/km²</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                    <span style="color: #6b7280;">Şube Sayısı:</span>
                    <strong>${props.branchCount || 0}</strong>
                </div>
            </div>
        `);
    };

    return (
        <div className="animate-fade-in">
            {error && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    ⚠️ Hata: {error}
                </div>
            )}

            {/* Map Controls */}
            <div className="filters-bar mb-lg">
                <div className="filter-group">
                    <span className="filter-label">Katman</span>
                    <select
                        className="form-select"
                        value={mapLayer}
                        onChange={(e) => setMapLayer(e.target.value)}
                    >
                        <option value="branches">Şube Konumları</option>
                        <option value="density">Nüfus Yoğunluğu</option>
                    </select>
                </div>

                <div className="flex items-center gap-lg" style={{ marginLeft: 'auto' }}>
                    <div className="flex items-center gap-sm">
                        <div style={{ width: 16, height: 16, background: '#22c55e', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '0.875rem' }}>Kârlı Şube</span>
                    </div>
                    <div className="flex items-center gap-sm">
                        <div style={{ width: 16, height: 16, background: '#ef4444', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '0.875rem' }}>Zararlı Şube</span>
                    </div>
                </div>
            </div>

            {loading && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '16px', color: '#6b7280' }}>Harita yükleniyor...</p>
                </div>
            )}

            {!loading && (
                <div style={{
                    height: '600px',
                    width: '100%',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}>
                    <MapContainer
                        center={center}
                        zoom={11}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            attribution='&copy; OpenStreetMap contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* District polygons */}
                        {districts && districts.features && (
                            <GeoJSON
                                key={mapLayer}
                                data={districts}
                                style={getDistrictStyle}
                                onEachFeature={onEachDistrict}
                            />
                        )}

                        {/* Branch markers */}
                        {branches.map((feature, index) => {
                            const coords = feature.geometry?.coordinates;
                            if (!coords) return null;

                            const props = feature.properties || {};
                            const profit = props.profit || 0;
                            const isProfitable = profit >= 0;

                            return (
                                <Marker
                                    key={props.id || index}
                                    position={[coords[1], coords[0]]}
                                    icon={createMarkerIcon(isProfitable)}
                                >
                                    <Popup maxWidth={320} minWidth={280}>
                                        <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                                            {/* Header */}
                                            <div style={{
                                                background: isProfitable ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                                                color: 'white',
                                                padding: '12px 16px',
                                                margin: '-14px -20px 12px -20px',
                                                borderRadius: '4px 4px 0 0'
                                            }}>
                                                <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                                                    📚 {props.name || 'Şube'}
                                                </div>
                                                <div style={{ fontSize: '13px', opacity: 0.9 }}>
                                                    📍 {props.district || '-'} İlçesi
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div style={{
                                                display: 'inline-block',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                marginBottom: '12px',
                                                background: isProfitable ? '#dcfce7' : '#fee2e2',
                                                color: isProfitable ? '#166534' : '#991b1b'
                                            }}>
                                                {isProfitable ? '✅ Kârlı Şube' : '⚠️ Zararlı Şube'}
                                            </div>

                                            {/* Financial Info */}
                                            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    💰 Finansal Bilgiler
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                                                    <span style={{ color: '#6b7280' }}>Toplam Gelir:</span>
                                                    <strong style={{ color: '#059669' }}>{formatCurrency(props.revenue)}</strong>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                                                    <span style={{ color: '#6b7280' }}>Toplam Gider:</span>
                                                    <strong style={{ color: '#dc2626' }}>{formatCurrency(props.expenses)}</strong>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                                                    <span style={{ color: '#6b7280' }}>Net Kâr/Zarar:</span>
                                                    <strong style={{
                                                        color: profit >= 0 ? '#059669' : '#dc2626',
                                                        fontSize: '15px'
                                                    }}>
                                                        {formatCurrency(profit)}
                                                    </strong>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                                                    <span style={{ color: '#6b7280' }}>Kâr Marjı:</span>
                                                    <strong style={{ color: '#3b82f6' }}>{formatPercent(props.margin)}</strong>
                                                </div>
                                            </div>

                                            {/* Status Info */}
                                            <div style={{
                                                marginTop: '12px',
                                                padding: '8px 12px',
                                                background: '#f9fafb',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                color: '#6b7280'
                                            }}>
                                                <strong>Durum:</strong> {props.status === 'Active' ? '🟢 Aktif' : '🔴 Pasif'}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>
            )}

            {/* Info Card */}
            <div className="card mt-lg">
                <div className="card-header">
                    <h3 className="card-title">📊 Özet Bilgiler</h3>
                </div>
                <div className="card-body">
                    <div className="flex gap-lg" style={{ flexWrap: 'wrap' }}>
                        <div>
                            <span className="text-muted">Toplam Şube:</span>{' '}
                            <strong>{branches.length}</strong>
                        </div>
                        <div>
                            <span className="text-muted">Kârlı Şube:</span>{' '}
                            <strong className="text-success">{branches.filter(b => (b.properties?.profit || 0) >= 0).length}</strong>
                        </div>
                        <div>
                            <span className="text-muted">Zararlı Şube:</span>{' '}
                            <strong className="text-danger">{branches.filter(b => (b.properties?.profit || 0) < 0).length}</strong>
                        </div>
                        <div>
                            <span className="text-muted">İlçe Sayısı:</span>{' '}
                            <strong>{districts?.features?.length || 0}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend for density layer */}
            {mapLayer === 'density' && (
                <div className="card mt-lg">
                    <div className="card-header">
                        <h3 className="card-title">🗺️ Nüfus Yoğunluğu Haritası</h3>
                    </div>
                    <div className="card-body">
                        <div className="flex items-center gap-sm">
                            <div style={{
                                width: 150,
                                height: 20,
                                background: 'linear-gradient(90deg, #22c55e, #f59e0b, #ef4444)',
                                borderRadius: 4
                            }}></div>
                            <span style={{ fontSize: '0.875rem' }}>Düşük → Yüksek Yoğunluk</span>
                        </div>
                        <p className="text-muted mt-md" style={{ fontSize: '0.875rem' }}>
                            Kırmızı alanlar yüksek nüfus yoğunluğunu gösterir. Bu bölgeler potansiyel müşteri yoğunluğu açısından değerlendirilebilir.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
