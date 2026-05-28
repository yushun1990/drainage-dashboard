// 创建雨滴图案的 base64 PNG
const rainPatternCanvas = document.createElement('canvas')
const ctx = rainPatternCanvas.getContext('2d')!
rainPatternCanvas.width = 20
rainPatternCanvas.height = 20

// 绘制雨滴图案
ctx.strokeStyle = 'rgba(147, 197, 253, 0.6)'
ctx.lineWidth = 1
ctx.lineCap = 'round'

// 绘制垂直雨滴线
for (let x = 2; x < 20; x += 4) {
  for (let y = 0; y < 20; y += 6) {
    const offset = (x % 8 === 2) ? 0 : 3
    ctx.beginPath()
    ctx.moveTo(x, y + offset)
    ctx.lineTo(x, y + offset + 4)
    ctx.stroke()
  }
}

export const rainPatternUrl = rainPatternCanvas.toDataURL('image/png')
