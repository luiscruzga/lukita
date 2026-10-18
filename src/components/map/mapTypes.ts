export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  badge: string;
  logo: string | null;
  color: string;
  /** Número de descuentos agrupados en el mismo local. */
  count: number;
}

export interface DiscountMapProps {
  center: { lat: number; lng: number };
  user?: { lat: number; lng: number } | null;
  radius?: number;
  markers: MapMarker[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onMoveEnd?: (c: { lat: number; lng: number }) => void;
  dark?: boolean;
  colors: { primary: string; coin: string; ink: string; surface: string; onCoin: string };
  /** Encuadra todos los marcadores cada vez que cambian (p. ej. los locales de un comercio). */
  fitToMarkers?: boolean;
  /** Zoom al moverse a `center` (por defecto conserva el actual). */
  focusZoom?: number;
  accessibilityLabel?: string;
}
