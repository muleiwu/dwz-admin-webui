// 二维码图层类型定义

export type LayerType = 'fill' | 'image' | 'text' | 'logo';

// 基础图层接口
export interface BaseLayer {
  id: string;
  type: LayerType;
  visible: boolean;
  name: string;
}

// 填充层
export interface FillLayer extends BaseLayer {
  type: 'fill';
  color?: string;
  gradient?: {
    type: 'linear' | 'radial';
    direction: 'horizontal' | 'vertical' | 'diagonal';
    colors: Array<{ offset: number; color: string }>;
  };
}

// 图片层
export interface ImageLayer extends BaseLayer {
  type: 'image';
  imageUrl: string;
  opacity: number;
}

// 文本层
export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  position: 'top' | 'bottom' | 'custom';
  fontSize: number;
  color: string;
  fontFamily: string;
  customPosition?: { x: number; y: number };
}

// Logo 层
export interface LogoLayer extends BaseLayer {
  type: 'logo';
  imageUrl: string;
  size: number; // 0-1 的比例
  clearEdges: number; // 清除周围的二维码点数
}

// 联合类型
export type QRCodeLayer = FillLayer | ImageLayer | TextLayer | LogoLayer;

// 特效类型
export interface QREffect {
  type: 'none' | 'round' | 'liquid' | 'dot';
  value: number; // 0-1
}

// 纠错级别
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

// qrcanvas 前景区域配置（用于定位角等特殊区域）
export interface QRForegroundArea {
  row?: number;
  rows?: number;
  col?: number;
  cols?: number;
  style: string;
}

// 渐变配置（用于UI编辑）
export interface GradientConfig {
  type: 'linear' | 'radial';
  direction: 'horizontal' | 'vertical' | 'diagonal';
  colors: Array<{ offset: number; color: string }>;
}

// 彩色定位角配置（用于UI编辑）
export interface ColorfulPositionerConfig {
  mainColor: string; // 主体颜色
  outerColor: string; // 定位角外框颜色
  innerColor: string; // 定位角内框颜色
}

// Logo 配置（支持图片和文字）
export interface QRLogo {
  image?: string; // Logo 图片
  text?: string; // Logo 文字
  clearEdges?: number; // 清除周围的二维码点数
  size?: number; // Logo 大小比例 (0-1)
  options?: {
    color?: string; // 文字颜色
    fontFamily?: string;
    fontSize?: number;
  };
}

// 完整配置
export interface QRCodeConfig {
  initialized?: boolean; // 跟踪配置是否已初始化
  size: number;
  correctLevel: ErrorCorrectionLevel;
  padding?: number; // 内边距
  // 前景配置
  foreground?: string | QRForegroundArea[]; // 纯色、渐变或区域数组
  background?: string; // 背景色
  // Logo 配置
  logo?: QRLogo;
  // 兼容旧版的图层系统（用于 UI 编辑）
  layers: QRCodeLayer[];
  effect: QREffect;
  logoImage: string | null;
  logoSize: number;
}

// 预设配置
export interface QRPreset {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  config: Partial<QRCodeConfig>;
}

// 导出格式
export type ExportFormat = 'png' | 'jpg' | 'svg';

// 导出选项
export interface ExportOptions {
  format: ExportFormat;
  quality?: number; // 0-1, 仅用于 jpg
  scale?: number; // 导出缩放比例
}

