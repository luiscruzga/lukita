/**
 * Avatares por defecto, gratuitos, de DiceBear (https://www.dicebear.com, licencias CC0/CC BY por
 * estilo; ver https://www.dicebear.com/licenses). Se generan por semilla, así que no ocupan espacio.
 */
export interface AvatarStyle {
  id: string;
  name: string;
  group: 'Ilustrados' | 'Divertidos' | 'Retro' | 'Abstractos';
}

export const AVATAR_STYLES: AvatarStyle[] = [
  { id: 'adventurer', name: 'Aventureros', group: 'Ilustrados' },
  { id: 'lorelei', name: 'Lorelei', group: 'Ilustrados' },
  { id: 'notionists', name: 'Bocetos', group: 'Ilustrados' },
  { id: 'micah', name: 'Micah', group: 'Ilustrados' },
  { id: 'personas', name: 'Personas', group: 'Ilustrados' },
  { id: 'open-peeps', name: 'Open Peeps', group: 'Ilustrados' },
  { id: 'fun-emoji', name: 'Emojis', group: 'Divertidos' },
  { id: 'bottts', name: 'Robots', group: 'Divertidos' },
  { id: 'big-smile', name: 'Sonrisas', group: 'Divertidos' },
  { id: 'croodles', name: 'Garabatos', group: 'Divertidos' },
  { id: 'thumbs', name: 'Pulgares', group: 'Divertidos' },
  { id: 'big-ears', name: 'Orejones', group: 'Divertidos' },
  { id: 'pixel-art', name: 'Pixel art', group: 'Retro' },
  { id: 'miniavs', name: 'Mini', group: 'Retro' },
  { id: 'avataaars', name: 'Avataaars', group: 'Retro' },
  { id: 'shapes', name: 'Formas', group: 'Abstractos' },
  { id: 'rings', name: 'Anillos', group: 'Abstractos' },
  { id: 'glass', name: 'Vidrio', group: 'Abstractos' },
];

/** Semillas con sabor chileno: cada una produce un personaje distinto. */
export const AVATAR_SEEDS = ['Luca', 'Pudu', 'Huemul', 'Copihue', 'Sopaipilla', 'Pebre', 'Completo', 'Cachureo', 'Chirimoya', 'Mote', 'Pichanga', 'Cueca'];

const BG = 'ffb81c,e6e3ff,d8f5ea,fde3e4,ddebff';

export function avatarUrl(style: string, seed: string, format: 'png' | 'svg' = 'png') {
  return `https://api.dicebear.com/9.x/${style}/${format}?seed=${encodeURIComponent(seed)}&size=256&backgroundColor=${BG}&backgroundType=gradientLinear,solid`;
}
