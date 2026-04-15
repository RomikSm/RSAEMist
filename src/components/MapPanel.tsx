import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTheme } from '../ThemeContext'
import { selectedCar } from '../data'
import 'leaflet/dist/leaflet.css'
import './MapPanel.css'
import TopBar from "./TopBar.tsx";

/* Car marker positions (Newport News, VA area) */
const carPosition: [number, number] = [36.9786, -76.4283]

/* Custom car icon */
function createCarIcon(theme: string) {
  const color = theme === 'dark' ? '#FEB344' : '#2563EB'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    <rect x="4" y="4" width="24" height="24" rx="6" fill="${color}" />
    <svg x="8" y="8" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${theme === 'dark' ? '#000' : '#fff'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2" ry="2"/>
      <path d="M16 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="13.5" cy="18.5" r="2.5"/>
    </svg>
    <polygon points="16,30 12,36 20,36" fill="${color}" />
  </svg>`
  return L.divIcon({
    html: svg,
    className: 'car-marker-icon',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  })
}

/* Label below the marker */
function CarLabel({ theme }: { theme: string }) {
  const map = useMap()
  const labelRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    const bgColor = theme === 'dark' ? '#FEB344' : '#2563EB'
    const textColor = theme === 'dark' ? '#000' : '#fff'
    const icon = L.divIcon({
      html: `<div style="background:${bgColor};color:${textColor};padding:2px 10px;border-radius:4px;font-size:11px;font-weight:700;font-family:Manrope,sans-serif;white-space:nowrap;text-align:center;">CAR ${selectedCar.id}</div>`,
      className: 'car-label-icon',
      iconSize: [70, 20],
      iconAnchor: [35, -4],
    })
    if (labelRef.current) {
      labelRef.current.setIcon(icon)
    } else {
      labelRef.current = L.marker(carPosition, { icon, interactive: false }).addTo(map)
    }
    return () => {
      if (labelRef.current) {
        map.removeLayer(labelRef.current)
        labelRef.current = null
      }
    }
  }, [map, theme])

  return null
}

export default function MapPanel() {
  const { theme } = useTheme()

  const tileUrl = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  return (
    <div className="map-panel">
      <TopBar />
      <MapContainer
        center={carPosition}
        zoom={14}
        className="map-container"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={tileUrl} />
        <Marker position={carPosition} icon={createCarIcon(theme)} />
        <CarLabel theme={theme} />
      </MapContainer>

      {/* Bottom overlay: selected car info */}
      <div className="map-bottom-overlay">
        <div className="map-info-row">
          <div className="map-info-block selected-card-block">
            <span className="map-info-label">SELECTED CARD ID</span>
            <span className="map-info-value map-info-value-large">{selectedCar.id}</span>
          </div>
          <div className="map-info-block">
            <span className="map-info-label">DAYS TO FAILURE</span>
            <span className="map-info-value">{selectedCar.daysToFailure}</span>
          </div>
          <div className="map-info-block">
            <span className="map-info-label">CURRENT LOCATION</span>
            <span className="map-info-value">{selectedCar.currentLocation}</span>
          </div>
          <div className="map-info-block">
            <span className="map-info-label">LATEST SHOCK EVENT</span>
            <span className="map-info-value">{selectedCar.latestShockEvent}{selectedCar.latestShockDetail}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
