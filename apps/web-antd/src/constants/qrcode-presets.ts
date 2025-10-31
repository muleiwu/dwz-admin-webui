import type { QRPreset } from '../types/qrcode';

// 预设配置
export const QR_PRESETS: Record<string, QRPreset> = {
  classic: {
    id: 'classic',
    name: '经典黑白',
    description: '传统的黑白二维码，简洁清晰',
    config: {
      size: 400,
      correctLevel: 'M',
      background: '#ffffff',
      foreground: '#000000',
      padding: 20,
      layers: [],
      effect: { type: 'none', value: 0 },
      logoImage: null,
      logoSize: 0.2,
    },
  },

  colorful: {
    id: 'colorful',
    name: '色彩斑斓',
    description: '彩色定位角，充满活力',
    config: {
      size: 400,
      correctLevel: 'H',
      background: '#ffffff',
      foreground: [
        // 整体前景色
        { style: '#5555aa' },
        // 三个定位角的外框
        { row: 0, rows: 7, col: 0, cols: 7, style: '#cc3333' },
        { row: -7, rows: 7, col: 0, cols: 7, style: '#cc3333' },
        { row: 0, rows: 7, col: -7, cols: 7, style: '#cc3333' },
        // 三个定位角的内框
        { row: 2, rows: 3, col: 2, cols: 3, style: '#662211' },
        { row: -5, rows: 3, col: 2, cols: 3, style: '#662211' },
        { row: 2, rows: 3, col: -5, cols: 3, style: '#662211' },
      ],
      padding: 20,
      layers: [],
      effect: { type: 'none', value: 0 },
      logoImage: null,
      logoSize: 0.2,
    },
  },

  blueGradient: {
    id: 'blueGradient',
    name: '蓝色渐变',
    description: '蓝色系渐变，现代科技感',
    config: {
      size: 400,
      correctLevel: 'M',
      background: '#ffffff',
      foreground: 'gradient:linear:0,0,400,400:#1890ff,#0050b3',
      padding: 20,
      layers: [],
      effect: { type: 'none', value: 0 },
      logoImage: null,
      logoSize: 0.2,
    },
  },

  orangeGradient: {
    id: 'orangeGradient',
    name: '橙色渐变',
    description: '橙色系渐变，热情活力',
    config: {
      size: 400,
      correctLevel: 'M',
      background: '#ffffff',
      foreground: 'gradient:linear:0,0,400,0:#fa8c16,#d4380d',
      padding: 20,
      layers: [],
      effect: { type: 'none', value: 0 },
      logoImage: null,
      logoSize: 0.2,
    },
  },

  greenGradient: {
    id: 'greenGradient',
    name: '绿色渐变',
    description: '绿色系渐变，清新自然',
    config: {
      size: 400,
      correctLevel: 'M',
      background: '#ffffff',
      foreground: 'gradient:linear:0,0,0,400:#52c41a,#237804',
      padding: 20,
      layers: [],
      effect: { type: 'none', value: 0 },
      logoImage: null,
      logoSize: 0.2,
    },
  },

  roundCorner: {
    id: 'roundCorner',
    name: '圆角风格',
    description: '圆角效果，柔和友好',
    config: {
      size: 400,
      correctLevel: 'M',
      background: '#ffffff',
      foreground: '#000000',
      padding: 20,
      layers: [],
      effect: { type: 'round', value: 0.5 },
      logoImage: null,
      logoSize: 0.2,
    },
  },

  liquid: {
    id: 'liquid',
    name: '液体风格',
    description: '液体效果，流动感强',
    config: {
      size: 400,
      correctLevel: 'H',
      background: '#ffffff',
      foreground: '#000000',
      padding: 20,
      layers: [],
      effect: { type: 'liquid', value: 0.6 },
      logoImage: null,
      logoSize: 0.2,
    },
  },

  dotStyle: {
    id: 'dotStyle',
    name: '点状风格',
    description: '点状效果，艺术感强',
    config: {
      size: 400,
      correctLevel: 'M',
      background: '#ffffff',
      foreground: '#000000',
      padding: 20,
      layers: [],
      effect: { type: 'dot', value: 0.7 },
      logoImage: null,
      logoSize: 0.2,
    },
  },
};

// 获取所有预设列表
export function getAllPresets(): QRPreset[] {
  return Object.values(QR_PRESETS);
}

// 根据 ID 获取预设
export function getPresetById(id: string): QRPreset | undefined {
  return QR_PRESETS[id];
}

// 默认预设
export const DEFAULT_PRESET = QR_PRESETS.classic;

