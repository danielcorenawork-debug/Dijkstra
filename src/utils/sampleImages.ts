/**
 * Generates rich synthetic warehouse scenes on canvas with realistic textures,
 * labels, barcodes and cardboard tones so the user can test instantly even without camera access.
 */

export interface SampleScene {
  id: string;
  name: string;
  description: string;
  tag: string;
  approxCount: number;
  dataUrl: string;
}

function drawWarehousePallet(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background warehouse floor & wall
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 600);
  bgGrad.addColorStop(0, '#1e293b');
  bgGrad.addColorStop(0.65, '#334155');
  bgGrad.addColorStop(0.651, '#475569');
  bgGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 800, 600);

  // Concrete floor guidelines
  ctx.strokeStyle = '#64748b33';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 400);
  ctx.lineTo(0, 600);
  ctx.moveTo(700, 400);
  ctx.lineTo(800, 600);
  ctx.stroke();

  // Wooden Pallet Base
  ctx.fillStyle = '#b45309';
  ctx.fillRect(160, 470, 480, 24);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(180, 494, 70, 18);
  ctx.fillRect(365, 494, 70, 18);
  ctx.fillRect(550, 494, 70, 18);

  // Stack of 12 boxes (3 columns x 4 rows)
  const cols = 3;
  const rows = 4;
  const boxW = 145;
  const boxH = 75;
  const startX = 180;
  const startY = 470 - rows * boxH;

  const kraftColors = ['#d97706', '#b45309', '#ca8a04', '#c2410c', '#d97706'];

  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      count++;
      const x = startX + c * boxW + (Math.sin(count) * 2);
      const y = startY + r * boxH;
      const colIdx = (r * cols + c) % kraftColors.length;

      // Box Body
      ctx.fillStyle = kraftColors[colIdx];
      ctx.fillRect(x + 2, y + 2, boxW - 4, boxH - 4);

      // 3D bevel / shading
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x + 2, y + 2, boxW - 4, 6);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(x + 2, y + boxH - 8, boxW - 4, 6);

      // Packing Tape in middle
      ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.fillRect(x + boxW / 2 - 12, y + 2, 24, boxH - 4);

      // Shipping label on some boxes
      if ((r + c) % 2 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 15, y + 18, 52, 34);
        
        // Barcode lines
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 20, y + 23, 2, 14);
        ctx.fillRect(x + 24, y + 23, 3, 14);
        ctx.fillRect(x + 30, y + 23, 1, 14);
        ctx.fillRect(x + 33, y + 23, 4, 14);
        ctx.fillRect(x + 40, y + 23, 2, 14);
        ctx.fillRect(x + 45, y + 23, 3, 14);
        ctx.fillRect(x + 50, y + 23, 2, 14);

        // Label text simulation
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(`BX-${100 + count}`, x + 20, y + 46);
      } else if (r === 0 && c === 1) {
        // Fragile red stamp
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 20, y + 20, 50, 25);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('FRÁGIL', x + 26, y + 36);
      }

      // Border outline
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, boxW - 4, boxH - 4);
    }
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}

function drawWarehouseRack(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Dark industrial rack background
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 800, 600);

  // Orange Steel Uprights
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(60, 40, 24, 520);
  ctx.fillRect(716, 40, 24, 520);

  // Holes in uprights
  ctx.fillStyle = '#1e1b4b';
  for (let y = 60; y < 540; y += 24) {
    ctx.fillRect(68, y, 8, 12);
    ctx.fillRect(724, y, 8, 12);
  }

  // Steel Beams (2 shelves)
  ctx.fillStyle = '#f97316';
  ctx.fillRect(84, 260, 632, 20);
  ctx.fillRect(84, 510, 632, 20);

  // Top Shelf Boxes (7 boxes)
  const topBoxes = [
    { x: 100, y: 140, w: 90, h: 120, col: '#ca8a04', label: 'SKU-A1' },
    { x: 198, y: 160, w: 85, h: 100, col: '#d97706', label: 'SKU-A2' },
    { x: 290, y: 130, w: 100, h: 130, col: '#b45309', label: 'SKU-A3' },
    { x: 398, y: 150, w: 80, h: 110, col: '#d97706', label: 'SKU-A4' },
    { x: 486, y: 160, w: 75, h: 100, col: '#c2410c', label: 'SKU-A5' },
    { x: 570, y: 145, w: 65, h: 115, col: '#ca8a04', label: 'SKU-A6' },
    { x: 642, y: 170, w: 60, h: 90, col: '#b45309', label: 'SKU-A7' },
  ];

  topBoxes.forEach(b => {
    ctx.fillStyle = b.col;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    // Label
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(b.x + 8, b.y + 14, b.w - 16, 26);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(b.label, b.x + 12, b.y + 30);
  });

  // Bottom Shelf Boxes (8 packages & crates)
  const botBoxes = [
    { x: 100, y: 380, w: 70, h: 130, col: '#1e3a8a', label: 'PLAST-1' }, // plastic crate
    { x: 175, y: 380, w: 70, h: 130, col: '#1e3a8a', label: 'PLAST-2' },
    { x: 255, y: 410, w: 95, h: 100, col: '#d97706', label: 'BOX-B1' },
    { x: 356, y: 390, w: 110, h: 120, col: '#ca8a04', label: 'BOX-B2' },
    { x: 472, y: 420, w: 70, h: 90, col: '#b45309', label: 'BOX-B3' },
    { x: 548, y: 410, w: 80, h: 100, col: '#d97706', label: 'BOX-B4' },
    { x: 634, y: 440, w: 75, h: 70, col: '#c2410c', label: 'BOX-B5' },
  ];

  botBoxes.forEach(b => {
    ctx.fillStyle = b.col;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    // Label
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(b.x + 6, b.y + 12, b.w - 12, 22);
    ctx.fillStyle = '#020617';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(b.label, b.x + 8, b.y + 26);
  });

  return canvas.toDataURL('image/jpeg', 0.9);
}

function drawDeliveryVan(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Delivery cargo interior
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 800, 600);

  // Metal ribbed walls
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  for (let x = 60; x < 740; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x, 560);
    ctx.stroke();
  }

  // Scattered parcels stack (15 boxes)
  const boxes = [
    // Bottom row
    { x: 120, y: 430, w: 120, h: 110, col: '#d97706' },
    { x: 245, y: 410, w: 130, h: 130, col: '#ca8a04' },
    { x: 380, y: 440, w: 100, h: 100, col: '#b45309' },
    { x: 485, y: 420, w: 140, h: 120, col: '#d97706' },
    { x: 630, y: 450, w: 110, h: 90, col: '#c2410c' },
    // Middle row
    { x: 140, y: 320, w: 90, h: 105, col: '#b45309' },
    { x: 240, y: 310, w: 120, h: 95, col: '#d97706' },
    { x: 365, y: 330, w: 110, h: 105, col: '#ca8a04' },
    { x: 480, y: 315, w: 125, h: 100, col: '#b45309' },
    { x: 615, y: 340, w: 100, h: 105, col: '#d97706' },
    // Top row
    { x: 170, y: 220, w: 100, h: 95, col: '#ca8a04' },
    { x: 280, y: 210, w: 110, h: 95, col: '#d97706' },
    { x: 400, y: 230, w: 90, h: 95, col: '#c2410c' },
    { x: 500, y: 215, w: 110, h: 95, col: '#b45309' },
    // Peak box
    { x: 330, y: 130, w: 120, h: 75, col: '#d97706' },
  ];

  boxes.forEach((b, idx) => {
    ctx.fillStyle = b.col;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    // tape
    ctx.fillStyle = 'rgba(255, 237, 213, 0.4)';
    ctx.fillRect(b.x + b.w / 2 - 8, b.y, 16, b.h);
    // border
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    // shipping label
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(b.x + 10, b.y + 12, b.w - 20, 24);
    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 7px monospace';
    ctx.fillText(`PKG-#${idx + 1}`, b.x + 14, b.y + 26);
  });

  return canvas.toDataURL('image/jpeg', 0.9);
}

export function getSampleScenes(): SampleScene[] {
  // Check if window is available (client-side)
  if (typeof window === 'undefined') return [];

  return [
    {
      id: 'pallet-standard',
      name: 'Pallet Estándar de Almacén',
      description: 'Estiba de 12 cajas de cartón sobre pallet de madera con etiquetas de envío y marcas de frágil.',
      tag: 'Estiba 3x4',
      approxCount: 12,
      dataUrl: drawWarehousePallet(),
    },
    {
      id: 'warehouse-rack',
      name: 'Estantería Industrial Racks',
      description: 'Cajas de almacenamiento y cestas plásticas organizadas por niveles en estantería metálica.',
      tag: 'Racks Multinivel',
      approxCount: 14,
      dataUrl: drawWarehouseRack(),
    },
    {
      id: 'delivery-cargo',
      name: 'Camión de Reparto y Paquetería',
      description: 'Carga de bultos y paquetes de comercio electrónico apilados en furgoneta logística.',
      tag: 'Paquetería Exprés',
      approxCount: 15,
      dataUrl: drawDeliveryVan(),
    },
  ];
}
