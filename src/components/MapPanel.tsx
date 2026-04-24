import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTheme } from '../ThemeContext'
import { useApi } from '../hooks/useApi'
import { useMessage } from '../hooks/useMessages'
import { lookups } from '../api'
import type { AssetSummaryResponse } from '../api/types'
import { formatClock, formatGForce } from '../utils/format'
import 'leaflet/dist/leaflet.css'
import './MapPanel.css'
import TopBar from './TopBar'

interface MapPanelProps {
  selectedMessageId: string | null
}

/** Fallback centre used while nothing is selected (Newport News, VA). */
const DEFAULT_CENTER: [number, number] = [36.9786, -76.4283]

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

/** Label that follows the marker; uses Leaflet directly for smoother updates. */
function CarLabel({ theme, label, position }: { theme: string; label: string; position: [number, number] }) {
  const map = useMap()
  const labelRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    const bgColor = theme === 'dark' ? '#FEB344' : '#2563EB'
    const textColor = theme === 'dark' ? '#000' : '#fff'
    // iconSize:null lets the DIV size itself to content; we centre it via
    // a wrapping flex container so that long labels (e.g. "CAR RC-CA-0001")
    // are no longer clipped to the previous fixed 70px width.
    const icon = L.divIcon({
      html: `<div style="display:inline-block;background:${bgColor};color:${textColor};padding:2px 10px;border-radius:4px;font-size:11px;font-weight:700;font-family:Manrope,sans-serif;white-space:nowrap;text-align:center;transform:translate(-50%,4px);">${label}</div>`,
      className: 'car-label-icon',
      iconSize: undefined as unknown as L.PointExpression,
      iconAnchor: [0, 0],
    })
    if (labelRef.current) {
      labelRef.current.setIcon(icon)
      labelRef.current.setLatLng(position)
    } else {
      labelRef.current = L.marker(position, { icon, interactive: false }).addTo(map)
    }
    return () => {
      if (labelRef.current) {
        map.removeLayer(labelRef.current)
        labelRef.current = null
      }
    }
  }, [map, theme, label, position])

  return null
}

/** Programmatically recentres the map when the selection changes. */
function RecenterOnChange({ position }: { position: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(position, map.getZoom(), { animate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, position[0], position[1]])
  return null
}

export default function MapPanel({ selectedMessageId }: MapPanelProps) {
  const { theme } = useTheme()
  const { data: message } = useMessage(selectedMessageId)

  // Asset summary is loaded once and indexed by assetId — it gives us the
  // "LATEST IMPACT / CURRENT LOCATION" block for the selected car.
  const { data: assets } = useApi(signal => lookups.getAssets('RAW', signal), [])
  const summary: AssetSummaryResponse | null = useMemo(() => {
    if (!message || !assets) return null
    return assets.items.find(a => a.assetId === message.assetId) ?? null
  }, [assets, message])

  const position: [number, number] = useMemo(() => {
    if (message && message.latitude !== null && message.longitude !== null) {
      return [Number(message.latitude), Number(message.longitude)]
    }
    return DEFAULT_CENTER
  }, [message])

  const carLabel = message ? `CAR ${message.assetId}` : 'CAR'

  const tileUrl = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  return (
    <div className="map-panel">
      <TopBar />
      <MapContainer
        center={position}
        zoom={14}
        className="map-container"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={tileUrl} />
        <Marker position={position} icon={createCarIcon(theme)} />
        <CarLabel theme={theme} label={carLabel} position={position} />
        <RecenterOnChange position={position} />
      </MapContainer>

      {/* Bottom overlay: selected car info */}
      <div className="map-bottom-overlay">
        <div className="map-info-row">
          <div className="map-info-block selected-card-block">
            <span className="map-info-label">SELECTED CAR ID</span>
            <span className="map-info-value map-info-value-large">
              {message?.assetId ?? '—'}
            </span>
          </div>
          <div className="map-info-block">
            <span className="map-info-label">ALERT VALUE</span>
            <span className="map-info-value">
              {message ? formatGForce(message.alertValue, message.measurementUnits) : '—'}
            </span>
          </div>
          <div className="map-info-block">
            <span className="map-info-label">CURRENT LOCATION</span>
            <span className="map-info-value">
              {message?.location ?? summary?.currentLocation ?? '—'}
            </span>
          </div>
          <div className="map-info-block">
            <span className="map-info-label">LATEST IMPACT EVENT</span>
            <span className="map-info-value">
              {summary?.latestShockEventAt
                ? `${formatClock(summary.latestShockEventAt)} · ${(summary.latestShockDetail ?? '').replace(/ @ /g, ' at ')}`
                : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
