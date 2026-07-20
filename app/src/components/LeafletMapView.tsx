import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { radii } from "../theme";

export type GeoSite = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  // Omitted for the 3 main navigable hub sites (Haram/Mina/Arafat), which
  // keep Leaflet's default pin. Set for real Overpass-sourced POIs (see
  // backend/src/services/overpassClient.ts) to render a small emoji marker
  // instead, visually distinguishing "go here" sites from "nearby amenity".
  category?: "hospital" | "police" | "tawafa" | "guidance" | "other";
};

type Props = {
  sites: GeoSite[];
  centerLat: number;
  centerLng: number;
  zoom?: number;
  onSelectSite?: (id: string) => void;
};

/**
 * Real map tiles fetched live from OpenStreetMap via Leaflet.js, running inside
 * a WebView — free, no API key, no billing account (unlike Google Maps). Needs
 * an internet connection to load tiles (see the offline-first open question in
 * CLAUDE.md — this is fine for now, not yet a solution for Hajj-scale
 * connectivity). Only renders in a real native build (Expo Go on a device or a
 * simulator), not in Snack's browser-based web preview, since WebView is a
 * native module.
 */
function buildHtml(sites: GeoSite[], centerLat: number, centerLng: number, zoom: number): string {
  const sitesJson = JSON.stringify(sites);
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var sites = ${sitesJson};
  var map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], ${zoom});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);
  var CATEGORY_ICONS = { hospital: '🏥', police: '👮', tawafa: '🏢', guidance: 'ℹ️', other: '📍' };
  sites.forEach(function (site) {
    var marker;
    if (site.category && CATEGORY_ICONS[site.category]) {
      var icon = L.divIcon({
        html: '<div style="font-size:20px;line-height:24px;text-align:center;">' + CATEGORY_ICONS[site.category] + '</div>',
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      marker = L.marker([site.lat, site.lng], { icon: icon }).addTo(map);
    } else {
      marker = L.marker([site.lat, site.lng]).addTo(map);
    }
    marker.bindPopup(site.label);
    marker.on('click', function () {
      window.ReactNativeWebView.postMessage(JSON.stringify({ id: site.id }));
    });
  });
</script>
</body>
</html>`;
}

export default function LeafletMapView({ sites, centerLat, centerLng, zoom = 11, onSelectSite }: Props) {
  const html = useMemo(
    () => buildHtml(sites, centerLat, centerLng, zoom),
    [sites, centerLat, centerLng, zoom]
  );

  return (
    <View style={styles.wrap}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.webview}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data) as { id?: string };
            if (data.id) onSelectSite?.(data.id);
          } catch {
            // ignore malformed messages
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, borderRadius: radii.card, overflow: "hidden" },
  webview: { flex: 1, backgroundColor: "transparent" },
});
