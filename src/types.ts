export interface DetectedBox {
  id: number;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] scaled 0 to 1000
  type: 'carton' | 'plastic_crate' | 'wooden_crate' | 'parcel_small' | 'cooler' | 'other' | string;
  condition: 'intact' | 'damaged_crushed' | 'open_taped' | 'fragile_marked' | string;
  position?: 'base' | 'middle' | 'top' | 'front' | 'side' | string;
  label_or_barcode?: string;
  confidence?: number;
  verified?: boolean;
}

export interface BoxCountAnalysis {
  total_visible: number;
  estimated_total_stack?: number;
  stack_integrity: 'estable' | 'moderada' | 'riesgo_inclinada' | string;
  summary_es: string;
  layer_count_estimate?: number;
  boxes: DetectedBox[];
  recommendations?: string[];
}

export interface ScanRecord {
  id: string;
  timestamp: string;
  locationOrBatch: string;
  operator: string;
  imageUrl: string;
  analysis: BoxCountAnalysis;
  manualCorrectionsCount?: number;
  notes?: string;
}

export type ScanMode = 'snapshot' | 'continuous' | 'file';
export type DisplayFilter = 'all' | 'carton' | 'damaged' | 'fragile';
