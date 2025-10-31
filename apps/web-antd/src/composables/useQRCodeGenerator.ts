import { qrcanvas } from 'qrcanvas';

import type {
  ExportFormat,
  ExportOptions,
  ImageLayer,
  QRCodeConfig,
  TextLayer,
} from '../types/qrcode';

/**
 * 二维码生成器组合式函数
 */
export function useQRCodeGenerator() {
  /**
   * 生成二维码
   */
  const generateQRCode = async (
    canvas: HTMLCanvasElement,
    url: string,
    config: QRCodeConfig,
  ): Promise<void> => {
    // 设置 canvas 尺寸
    canvas.width = config.size;
    canvas.height = config.size;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取 Canvas 上下文');
    }

    // 清空画布
    ctx.clearRect(0, 0, config.size, config.size);

    // 准备 qrcanvas 参数
    const qrcanvasOptions: any = {
      data: url,
      size: config.size,
      correctLevel: config.correctLevel,
      canvas: canvas,
    };

    // 设置背景色
    if (config.background) {
      qrcanvasOptions.background = config.background;
    }

    // 设置前景色
    if (config.foreground) {
      if (typeof config.foreground === 'string') {
        // 字符串格式：纯色或渐变字符串
        if (config.foreground.startsWith('gradient:')) {
          qrcanvasOptions.foreground = parseGradientString(
            config.foreground,
            config.size,
          );
        } else {
          qrcanvasOptions.foreground = config.foreground;
        }
      } else if (Array.isArray(config.foreground)) {
        // 数组格式：区域配置（用于彩色定位角等）
        qrcanvasOptions.foreground = config.foreground;
      }
    }

    // 设置内边距
    if (config.padding) {
      qrcanvasOptions.padding = config.padding;
    }

    // 设置 Logo
    if (config.logo) {
      const logoOptions: any = {};
      
      if (config.logo.text) {
        logoOptions.text = config.logo.text;
        if (config.logo.options) {
          logoOptions.options = config.logo.options;
        }
      } else if (config.logo.image) {
        logoOptions.image = await loadImage(config.logo.image);
      }
      
      if (config.logo.clearEdges !== undefined) {
        logoOptions.clearEdges = config.logo.clearEdges;
      }
      
      if (config.logo.size !== undefined) {
        logoOptions.size = config.logo.size;
      }
      
      qrcanvasOptions.logo = logoOptions;
    }
    // 兼容旧版 logoImage
    else if (config.logoImage) {
      qrcanvasOptions.logo = {
        image: await loadImage(config.logoImage),
        clearEdges: 2,
        size: config.logoSize,
      };
    }

    // 应用特效（qrcanvas 原生支持的特效）
    if (config.effect && config.effect.type !== 'none') {
      applyEffectOptions(qrcanvasOptions, config.effect);
    }

    // 生成二维码
    await qrcanvas(qrcanvasOptions);

    // 绘制额外的图层（图片层和文本层）
    await drawAdditionalLayers(ctx, config);
  };

  /**
   * 解析渐变字符串
   * 格式: gradient:linear:x1,y1,x2,y2:color1,color2,...
   */
  const parseGradientString = (
    gradientStr: string,
    size: number,
  ): HTMLCanvasElement => {
    const parts = gradientStr.split(':');
    if (parts.length < 4) {
      return createSolidColorCanvas('#000000', size);
    }

    const type = parts[1];
    const coords = parts[2];
    const colors = parts[3];
    
    if (!type || !coords || !colors) {
      return createSolidColorCanvas('#000000', size);
    }

    const coordValues = coords.split(',').map((v) => Number.parseInt(v, 10));
    const colorValues = colors.split(',');

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) {
      return createSolidColorCanvas('#000000', size);
    }

    let gradient: CanvasGradient;
    if (type === 'linear' && coordValues.length >= 4) {
      gradient = ctx.createLinearGradient(
        coordValues[0]!,
        coordValues[1]!,
        coordValues[2]!,
        coordValues[3]!,
      );
    } else if (type === 'radial' && coordValues.length >= 6) {
      gradient = ctx.createRadialGradient(
        coordValues[0]!,
        coordValues[1]!,
        coordValues[2]!,
        coordValues[3]!,
        coordValues[4]!,
        coordValues[5]!,
      );
    } else {
      return createSolidColorCanvas('#000000', size);
    }

    // 添加颜色停止点
    const step = 1 / (colorValues.length - 1);
    for (let i = 0; i < colorValues.length; i++) {
      gradient.addColorStop(i * step, colorValues[i]!.trim());
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    return tempCanvas;
  };

  /**
   * 创建纯色 canvas
   */
  const createSolidColorCanvas = (
    color: string,
    size: number,
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, size, size);
    }
    return canvas;
  };

  /**
   * 加载图片
   */
  const loadImage = async (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  /**
   * 应用特效选项
   * 映射内部类型名称到 qrcanvas API 支持的类型
   */
  const applyEffectOptions = (
    qrcanvasOptions: any,
    effect: { type: string; value: number },
  ): void => {
    // 映射到 qrcanvas 支持的特效类型（全小写）
    // qrcanvas API: none, fusion, round, spot
    const effectTypeMap: Record<string, string> = {
      'none': 'none',
      'round': 'round',
      'liquid': 'fusion',  // 液体效果对应 fusion
      'dot': 'spot',       // 点状效果对应 spot
    };

    const qrcanvasEffectType = effectTypeMap[effect.type] || 'none';

    if (qrcanvasEffectType !== 'none') {
      qrcanvasOptions.effect = {
        type: qrcanvasEffectType,
        value: effect.value,
      };
    }
  };

  /**
   * 绘制额外的图层（图片层和文本层）
   */
  const drawAdditionalLayers = async (
    ctx: CanvasRenderingContext2D,
    config: QRCodeConfig,
  ): Promise<void> => {
    const size = config.size;

    // 绘制图片层
    const imageLayers = config.layers.filter(
      (layer) => layer.type === 'image' && layer.visible,
    ) as ImageLayer[];

    for (const layer of imageLayers) {
      try {
        const img = await loadImage(layer.imageUrl);
        const oldAlpha = ctx.globalAlpha;
        ctx.globalAlpha = layer.opacity;
        ctx.drawImage(img, 0, 0, size, size);
        ctx.globalAlpha = oldAlpha;
      } catch (error) {
        console.error('加载图片层失败:', error);
      }
    }

    // 绘制文本层
    const textLayers = config.layers.filter(
      (layer) => layer.type === 'text' && layer.visible,
    ) as TextLayer[];

    for (const layer of textLayers) {
      ctx.fillStyle = layer.color;
      ctx.font = `${layer.fontSize}px ${layer.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let x = size / 2;
      let y = size / 2;

      if (layer.position === 'top') {
        y = layer.fontSize;
      } else if (layer.position === 'bottom') {
        y = size - layer.fontSize;
      } else if (layer.position === 'custom' && layer.customPosition) {
        x = layer.customPosition.x;
        y = layer.customPosition.y;
      }

      ctx.fillText(layer.text, x, y);
    }
  };

  /**
   * 导出二维码
   */
  const exportQRCode = async (
    canvas: HTMLCanvasElement,
    options: ExportOptions,
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const mimeType = getMimeType(options.format);
      const quality = options.quality || 0.92;

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('生成图片失败'));
          }
        },
        mimeType,
        quality,
      );
    });
  };

  /**
   * 获取 MIME 类型
   */
  const getMimeType = (format: ExportFormat): string => {
    switch (format) {
      case 'png':
        return 'image/png';
      case 'jpg':
        return 'image/jpeg';
      case 'svg':
        return 'image/svg+xml';
      default:
        return 'image/png';
    }
  };

  /**
   * 下载文件
   */
  const downloadBlob = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    generateQRCode,
    exportQRCode,
    downloadBlob,
  };
}

