import { AfterViewInit, Component, ElementRef, effect, input, ViewChild } from '@angular/core';
import * as L from 'leaflet';

export interface CellHeatPoint {
  name: string;
  latitude: number;
  longitude: number;
  count: number;
  totalDuration: number;
  intensity: number;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  cellName: string;
  dateTime: string;
}

@Component({
  selector: 'app-subscriber-map',
  template: `
    <div #mapContainer class="w-full rounded-xl border border-slate-200 bg-slate-100" style="height: 420px;"></div>
  `,
  styles: [],
})
export class SubscriberMap implements AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  readonly cells = input<CellHeatPoint[]>([]);
  readonly records = input<LocationPoint[]>([]);

  private map?: L.Map;
  private markerLayer?: L.LayerGroup;

  constructor() {
    effect(() => {
      this.cells();
      this.records();

      if (!this.map) {
        return;
      }

      this.renderMapData();
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.renderMapData();
  }

  private initMap(): void {
    const container = this.mapContainer.nativeElement;

    this.map = L.map(container, {
      zoomControl: true,
      attributionControl: true,
    }).setView([5.5600, -0.2000], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
  }

  private renderMapData(): void {
    if (!this.map) {
      return;
    }

    if (this.markerLayer) {
      this.map.removeLayer(this.markerLayer);
    }

    const layer = L.layerGroup();

    const routePoints = this.records()
      .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
      .map((point) => [point.latitude, point.longitude] as [number, number]);

    const boundsPoints = routePoints.length > 0 ? [...routePoints] : [];

    if (routePoints.length > 1) {
      L.polyline(routePoints, {
        color: '#2563eb',
        weight: 3,
        opacity: 0.8,
        dashArray: '8 8',
      }).addTo(layer);
    }

    this.cells().forEach((cell) => {
      if (!Number.isFinite(cell.latitude) || !Number.isFinite(cell.longitude)) {
        return;
      }

      const radius = 600 + cell.intensity * 240;
      boundsPoints.push([cell.latitude, cell.longitude]);

      L.circleMarker([cell.latitude, cell.longitude], {
        radius: Math.max(8, Math.min(30, 8 + cell.intensity * 1.8)),
        color: '#1d4ed8',
        weight: 1,
        fillColor: '#60a5fa',
        fillOpacity: 0.6,
      })
        .bindPopup(
          `<div class="space-y-1 text-sm">
            <div class="font-semibold">${cell.name}</div>
            <div>Calls: ${cell.count}</div>
            <div>Duration: ${Math.round(cell.totalDuration / 60)} min</div>
          </div>`
        )
        .addTo(layer);

      L.circle([cell.latitude, cell.longitude], {
        radius,
        color: '#3b82f6',
        fillColor: '#93c5fd',
        fillOpacity: 0.12,
        weight: 1,
      }).addTo(layer);
    });

    this.records().forEach((point) => {
      const marker = L.circleMarker([point.latitude, point.longitude], {
        radius: 7,
        color: '#0f172a',
        fillColor: '#f97316',
        fillOpacity: 0.95,
        weight: 1,
      });

      boundsPoints.push([point.latitude, point.longitude]);

      marker.bindPopup(
        `<div class="space-y-1 text-sm">
          <div class="font-semibold">${point.cellName}</div>
          <div>Latitude: ${point.latitude}</div>
          <div>Longitude: ${point.longitude}</div>
          <div>${new Date(point.dateTime).toLocaleString()}</div>
        </div>`
      );

      marker.addTo(layer);
    });

    layer.addTo(this.map);
    this.markerLayer = layer;

    if (boundsPoints.length > 0) {
      this.map.fitBounds(boundsPoints, { padding: [24, 24] });
    }

    this.map.invalidateSize();
  }
}
