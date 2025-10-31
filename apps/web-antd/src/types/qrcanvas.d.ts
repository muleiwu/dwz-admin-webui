declare module 'qrcanvas' {
  export interface QRCanvasOptions {
    data: string;
    size?: number;
    correctLevel?: 'L' | 'M' | 'Q' | 'H';
    foreground?: string | CanvasGradient;
    background?: string;
    cellSize?: number;
    [key: string]: any;
  }

  export function qrcanvas(
    options: QRCanvasOptions,
    canvas?: HTMLCanvasElement,
  ): HTMLCanvasElement;
}

