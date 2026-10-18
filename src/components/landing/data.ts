import type { MarqueeItem } from './Marquee';

export const PROVIDERS_A: MarqueeItem[] = [
  { name: 'Banco de Chile', domain: 'bancochile.cl', color: '#002D72' },
  { name: 'BancoEstado', domain: 'bancoestado.cl', color: '#F47920' },
  { name: 'Santander', domain: 'santander.cl', color: '#EC0000' },
  { name: 'BCI', domain: 'bci.cl', color: '#0033A0' },
  { name: 'Scotiabank', domain: 'scotiabankchile.cl', color: '#EC111A' },
  { name: 'Itaú', domain: 'itau.cl', color: '#EC7000' },
  { name: 'Banco Falabella', domain: 'bancofalabella.cl', color: '#00A651' },
  { name: 'Tenpo', domain: 'tenpo.cl', color: '#00C78C' },
  { name: 'MACH', domain: 'machbank.cl', color: '#6E2CF4' },
  { name: 'Mercado Pago', domain: 'mercadopago.cl', color: '#00B1EA' },
];

export const PROVIDERS_B: MarqueeItem[] = [
  { name: 'Caja Los Andes', domain: 'cajalosandes.cl', color: '#0072BC' },
  { name: 'La Araucana', domain: 'laaraucana.cl', color: '#00A3E0' },
  { name: 'Entel', domain: 'entel.cl', color: '#FF6600' },
  { name: 'Movistar', domain: 'movistar.cl', color: '#019DF4' },
  { name: 'WOM', domain: 'wom.cl', color: '#6B0F8E' },
  { name: 'Copec', domain: 'copec.cl', color: '#E30613' },
  { name: 'Shell', domain: 'shell.cl', color: '#FFD500' },
  { name: 'Cruz Verde', domain: 'cruzverde.cl', color: '#009639' },
  { name: 'Salcobrand', domain: 'salcobrand.cl', color: '#E30613' },
  { name: 'Club de Lectores', domain: 'clubdelectores.cl', color: '#003366' },
];

/** Datos de ejemplo de la landing (ilustrativos, no son ofertas vigentes). */
export const DEMO_WEEK: { day: string; items: { v: string; m: string; p: string; color: string }[] }[] = [
  { day: 'Lun', items: [{ v: '30%', m: 'Sushi', p: 'BCI', color: '#0033A0' }, { v: '$100', m: 'Bencina por litro', p: 'Copec App', color: '#E30613' }] },
  { day: 'Mar', items: [{ v: '40%', m: 'Restaurantes', p: 'Banco de Chile', color: '#002D72' }, { v: '2x1', m: 'Cine', p: 'Entel', color: '#FF6600' }] },
  { day: 'Mié', items: [{ v: '25%', m: 'Farmacia', p: 'Caja Los Andes', color: '#0072BC' }, { v: '6', m: 'Cuotas sin interés', p: 'Santander', color: '#EC0000' }] },
  { day: 'Jue', items: [{ v: '$120', m: 'Bencina por litro', p: 'Banco Falabella', color: '#00A651' }, { v: '35%', m: 'Café', p: 'Tenpo', color: '#00C78C' }] },
  { day: 'Vie', items: [{ v: '40%', m: 'Comida rápida', p: 'Scotiabank', color: '#EC111A' }, { v: '20%', m: 'Supermercado', p: 'MACH', color: '#6E2CF4' }] },
  { day: 'Sáb', items: [{ v: '50%', m: 'Parrillas', p: 'Itaú', color: '#EC7000' }, { v: '15%', m: 'Hogar', p: 'Mercado Pago', color: '#00B1EA' }] },
  { day: 'Dom', items: [{ v: '30%', m: 'Helados', p: 'Movistar', color: '#019DF4' }, { v: '20%', m: 'Libros', p: 'Club de Lectores', color: '#003366' }] },
];

export const FAQ = [
  { q: '¿Lukita es gratis?', a: 'Sí. Creas tu cuenta, eliges tus bancos, tarjetas, cajas y clubes, y ves sus descuentos sin pagar nada.' },
  { q: '¿Necesito conectar mi banco o dar mis claves?', a: 'No. Solo marcas qué cuentas tienes. Lukita nunca pide números de tarjeta, claves ni accesos a tu banco.' },
  { q: '¿De dónde salen los descuentos?', a: 'De los sitios oficiales de beneficios de cada proveedor, que importamos y normalizamos a diario, y de comercios aliados. Cada cupón enlaza a su fuente.' },
  { q: '¿Funciona en el celular?', a: 'Sí: hay app para Android (descargable desde GitHub, se actualiza sola) y la versión web funciona en cualquier navegador, tablet o computador.' },
  { q: '¿Cómo me avisa de los descuentos?', a: 'Con un resumen diario a la hora que elijas, alertas cuando pasas cerca de un local con descuento y avisos cuando un favorito está por vencer.' },
];
