// 배경 이미지 6개(JPEG 1290×2796)와 배경 영상 6개(MP4 H.264 720×1280, 소리 없음, 16초 루프)를
// 코드로 직접 그려 만듭니다. 직접 제작한 그림이라 라이선스 문제가 없습니다.
// 사용법: swift tools/gen_visuals.swift <이미지폴더> <영상폴더>
import AVFoundation
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

// MARK: - 그리기 도구

struct Rand {
  var s: UInt64
  mutating func next() -> CGFloat {
    s ^= s << 13; s ^= s >> 7; s ^= s << 17
    return CGFloat(s % 1_000_000) / 1_000_000
  }
}

let space = CGColorSpace(name: CGColorSpace.sRGB)!
func rgb(_ hex: UInt32, _ a: CGFloat = 1) -> CGColor {
  CGColor(srgbRed: CGFloat((hex >> 16) & 0xff) / 255, green: CGFloat((hex >> 8) & 0xff) / 255,
          blue: CGFloat(hex & 0xff) / 255, alpha: a)
}
func vGradient(_ c: CGContext, _ w: CGFloat, _ h: CGFloat, _ colors: [CGColor], _ locs: [CGFloat]) {
  let g = CGGradient(colorsSpace: space, colors: colors as CFArray, locations: locs)!
  // CG 좌표계는 아래가 0 이므로 위(h) → 아래(0)
  c.drawLinearGradient(g, start: CGPoint(x: 0, y: h), end: CGPoint(x: 0, y: 0), options: [])
}
func glow(_ c: CGContext, _ p: CGPoint, _ r: CGFloat, _ color: CGColor) {
  let clear = color.copy(alpha: 0)!
  let g = CGGradient(colorsSpace: space, colors: [color, clear] as CFArray, locations: [0, 1])!
  c.drawRadialGradient(g, startCenter: p, startRadius: 0, endCenter: p, endRadius: r, options: [])
}
let tau = CGFloat.pi * 2

// 각 장면: t 는 0~1 루프 위치. t=0 과 t=1 이 같은 그림이 되도록 정수 주기만 사용합니다.
typealias Scene = (CGContext, CGFloat, CGFloat, CGFloat) -> Void

let rainWindow: Scene = { c, w, h, t in
  vGradient(c, w, h, [rgb(0x1b2536), rgb(0x24324a), rgb(0x10161f)], [0, 0.55, 1])
  var r = Rand(s: 11)
  // 창밖 흐릿한 불빛
  for _ in 0..<26 {
    let p = CGPoint(x: r.next() * w, y: r.next() * h * 0.7)
    let col: UInt32 = [0xffb46b, 0xffd58a, 0x8fb3ff, 0xff8f6b][Int(r.next() * 4) % 4]
    glow(c, p, (0.04 + r.next() * 0.09) * w, rgb(col, 0.10 + r.next() * 0.12))
  }
  // 흘러내리는 빗방울
  for _ in 0..<70 {
    let x = r.next() * w
    let y0 = r.next()
    let cycles = CGFloat(1 + Int(r.next() * 3))
    let y = ((y0 - t * cycles).truncatingRemainder(dividingBy: 1) + 1).truncatingRemainder(dividingBy: 1) * h * 1.1
    let len = (0.02 + r.next() * 0.05) * h
    let wd = (0.002 + r.next() * 0.003) * w
    c.setStrokeColor(rgb(0xcfe0ff, 0.18 + r.next() * 0.2))
    c.setLineWidth(wd)
    c.setLineCap(.round)
    c.move(to: CGPoint(x: x, y: y)); c.addLine(to: CGPoint(x: x + wd, y: y + len)); c.strokePath()
    c.setFillColor(rgb(0xe6efff, 0.35))
    c.fillEllipse(in: CGRect(x: x - wd, y: y - wd, width: wd * 2.4, height: wd * 2.8))
  }
  // 맺혀 있는 물방울
  for _ in 0..<120 {
    let s = (0.003 + r.next() * 0.008) * w
    let p = CGPoint(x: r.next() * w, y: r.next() * h)
    c.setFillColor(rgb(0xdfe9ff, 0.12 + r.next() * 0.15))
    c.fillEllipse(in: CGRect(x: p.x, y: p.y, width: s, height: s * 1.15))
  }
}

let moonSea: Scene = { c, w, h, t in
  vGradient(c, w, h, [rgb(0x0b1330), rgb(0x1f2a5c), rgb(0x2d3f7a), rgb(0x0a1026)], [0, 0.45, 0.6, 1])
  let horizon = h * 0.42
  let moon = CGPoint(x: w * 0.62, y: h * 0.74)
  glow(c, moon, w * 0.55, rgb(0x9fb4ff, 0.22))
  c.setFillColor(rgb(0xfff6dc)); c.fillEllipse(in: CGRect(x: moon.x - w * 0.07, y: moon.y - w * 0.07, width: w * 0.14, height: w * 0.14))
  var r = Rand(s: 5)
  for _ in 0..<60 {
    let p = CGPoint(x: r.next() * w, y: horizon + r.next() * (h - horizon))
    let a = 0.3 + 0.5 * abs(sin(tau * (t * CGFloat(1 + Int(r.next() * 3)) + r.next())))
    c.setFillColor(rgb(0xffffff, a * 0.7)); let s = 1 + r.next() * w * 0.003
    c.fillEllipse(in: CGRect(x: p.x, y: p.y, width: s, height: s))
  }
  // 바다
  c.setFillColor(rgb(0x070c1f)); c.fill(CGRect(x: 0, y: 0, width: w, height: horizon))
  vGradient(c, w, horizon, [rgb(0x111a3d), rgb(0x05081a)], [0, 1])
  // 일렁이는 달빛 반사
  for i in 0..<34 {
    let k = CGFloat(i) / 34
    let y = horizon - k * horizon * 0.95
    let wobble = sin(tau * (t * 2 + k * 3)) * w * 0.02
    let len = w * (0.05 + 0.18 * (1 - k)) * (0.7 + 0.3 * sin(tau * (t * 3 + k * 5)))
    c.setStrokeColor(rgb(0xfff1c9, 0.55 * (1 - k * 0.7))); c.setLineWidth(h * 0.004)
    c.move(to: CGPoint(x: moon.x - len / 2 + wobble, y: y)); c.addLine(to: CGPoint(x: moon.x + len / 2 + wobble, y: y)); c.strokePath()
  }
  // 잔물결
  for i in 0..<18 {
    let y = horizon * CGFloat(i) / 18
    c.setStrokeColor(rgb(0x6c7fc2, 0.08)); c.setLineWidth(h * 0.002)
    c.move(to: CGPoint(x: 0, y: y))
    for x in stride(from: CGFloat(0), through: w, by: w / 40) {
      c.addLine(to: CGPoint(x: x, y: y + sin(tau * (x / w * 3 + t * 2 + CGFloat(i) * 0.3)) * h * 0.004))
    }
    c.strokePath()
  }
}

let candle: Scene = { c, w, h, t in
  vGradient(c, w, h, [rgb(0x120c08), rgb(0x1f140c), rgb(0x0a0705)], [0, 0.6, 1])
  let flick = 1 + 0.06 * sin(tau * t * 7) + 0.04 * sin(tau * t * 11 + 1) + 0.03 * sin(tau * t * 17)
  let base = CGPoint(x: w / 2, y: h * 0.42)
  glow(c, CGPoint(x: base.x, y: base.y + h * 0.06), w * 0.9 * flick, rgb(0xff9a3c, 0.22))
  glow(c, CGPoint(x: base.x, y: base.y + h * 0.06), w * 0.35 * flick, rgb(0xffc06b, 0.25))
  // 초
  let cw = w * 0.16, ch = h * 0.24
  let body = CGRect(x: base.x - cw / 2, y: base.y - ch, width: cw, height: ch)
  let g = CGGradient(colorsSpace: space, colors: [rgb(0x8a6e55), rgb(0xf3e3c8), rgb(0xb89a7a)] as CFArray, locations: [0, 0.45, 1])!
  c.saveGState(); c.addPath(CGPath(roundedRect: body, cornerWidth: cw * 0.08, cornerHeight: cw * 0.08, transform: nil)); c.clip()
  c.drawLinearGradient(g, start: CGPoint(x: body.minX, y: 0), end: CGPoint(x: body.maxX, y: 0), options: [])
  c.restoreGState()
  c.setFillColor(rgb(0xfff4dc, 0.5)); c.fillEllipse(in: CGRect(x: body.minX, y: body.maxY - cw * 0.08, width: cw, height: cw * 0.16))
  // 심지와 불꽃
  c.setFillColor(rgb(0x2a1d14)); c.fill(CGRect(x: base.x - w * 0.003, y: base.y, width: w * 0.006, height: h * 0.015))
  let sway = sin(tau * t * 3) * w * 0.006 + sin(tau * t * 5) * w * 0.003
  let fh = h * 0.07 * flick, fw = w * 0.035
  let tip = CGPoint(x: base.x + sway * 2, y: base.y + h * 0.012 + fh)
  let bot = CGPoint(x: base.x, y: base.y + h * 0.008)
  func flame(_ scale: CGFloat, _ col: CGColor) {
    let p = CGMutablePath()
    p.move(to: CGPoint(x: bot.x, y: bot.y))
    p.addCurve(to: CGPoint(x: bot.x + (tip.x - bot.x) * scale, y: bot.y + (tip.y - bot.y) * scale),
               control1: CGPoint(x: bot.x + fw * scale * 1.3, y: bot.y + fh * 0.25 * scale),
               control2: CGPoint(x: bot.x + fw * 0.4 * scale + sway, y: bot.y + fh * 0.7 * scale))
    p.addCurve(to: CGPoint(x: bot.x, y: bot.y),
               control1: CGPoint(x: bot.x - fw * 0.4 * scale + sway, y: bot.y + fh * 0.7 * scale),
               control2: CGPoint(x: bot.x - fw * scale * 1.3, y: bot.y + fh * 0.25 * scale))
    c.addPath(p); c.setFillColor(col); c.fillPath()
  }
  glow(c, CGPoint(x: base.x, y: base.y + fh * 0.5), fh * 1.2, rgb(0xffd27a, 0.45))
  flame(1.0, rgb(0xffa53a, 0.95))
  flame(0.72, rgb(0xffe08a))
  flame(0.4, rgb(0xfffbe8))
}

let stars: Scene = { c, w, h, t in
  vGradient(c, w, h, [rgb(0x0a0a2a), rgb(0x241a5a), rgb(0x3d2a78), rgb(0x0d0a26)], [0, 0.4, 0.7, 1])
  var r = Rand(s: 77)
  // 은하수 띠
  for i in 0..<40 {
    let k = CGFloat(i) / 40
    glow(c, CGPoint(x: w * (-0.1 + k * 1.2), y: h * (0.25 + k * 0.5) + (r.next() - 0.5) * h * 0.06),
         w * (0.18 + r.next() * 0.12), rgb([0x7b6cff, 0x5fa8ff, 0xc08cff][i % 3], 0.07))
  }
  for _ in 0..<420 {
    let p = CGPoint(x: r.next() * w, y: r.next() * h)
    let big = r.next() > 0.93
    let s = (big ? 0.004 + r.next() * 0.004 : 0.0012 + r.next() * 0.002) * w
    let tw = 0.45 + 0.55 * abs(sin(tau * (t * CGFloat(1 + Int(r.next() * 4)) + r.next())))
    if big { glow(c, p, s * 5, rgb(0xbfd4ff, 0.35 * tw)) }
    c.setFillColor(rgb(0xffffff, tw)); c.fillEllipse(in: CGRect(x: p.x - s / 2, y: p.y - s / 2, width: s, height: s))
  }
  // 산 능선
  c.setFillColor(rgb(0x07061a))
  c.move(to: CGPoint(x: 0, y: 0)); c.addLine(to: CGPoint(x: 0, y: h * 0.14))
  for x in stride(from: CGFloat(0), through: w, by: w / 30) {
    c.addLine(to: CGPoint(x: x, y: h * (0.12 + 0.04 * sin(x / w * 5) + 0.02 * sin(x / w * 13))))
  }
  c.addLine(to: CGPoint(x: w, y: 0)); c.fillPath()
}

let mistyForest: Scene = { c, w, h, t in
  vGradient(c, w, h, [rgb(0x22343a), rgb(0x4b6a6c), rgb(0x2b3f43), rgb(0x0f1a1c)], [0, 0.45, 0.7, 1])
  glow(c, CGPoint(x: w * 0.5, y: h * 0.62), w * 0.9, rgb(0xd7e8df, 0.25))
  var r = Rand(s: 3)
  let layers: [(CGFloat, UInt32, CGFloat)] = [(0.55, 0x6f8a88, 0.5), (0.45, 0x4c6664, 0.7), (0.32, 0x2c4142, 0.85), (0.18, 0x13201f, 1)]
  for (li, (baseY, col, alpha)) in layers.enumerated() {
    c.setFillColor(rgb(col, alpha))
    let count = 9 + li * 3
    for _ in 0..<count {
      let x = r.next() * w * 1.1 - w * 0.05
      let th = h * (0.18 + r.next() * 0.16) * (1 + CGFloat(li) * 0.15)
      let tw = th * 0.28
      c.move(to: CGPoint(x: x - tw / 2, y: h * baseY - h * 0.2)); c.addLine(to: CGPoint(x: x, y: h * baseY + th * 0.6))
      c.addLine(to: CGPoint(x: x + tw / 2, y: h * baseY - h * 0.2)); c.fillPath()
    }
    c.fill(CGRect(x: 0, y: 0, width: w, height: h * baseY - h * 0.19))
    // 흐르는 안개 (가로로 한 바퀴 → 루프)
    for j in 0..<6 {
      let x = ((CGFloat(j) / 6 + t * (li % 2 == 0 ? 1 : -1)).truncatingRemainder(dividingBy: 1) + 1).truncatingRemainder(dividingBy: 1) * w * 1.6 - w * 0.3
      glow(c, CGPoint(x: x, y: h * baseY + h * 0.02), w * 0.45, rgb(0xe3efe9, 0.12))
    }
  }
  // 오솔길
  c.setFillColor(rgb(0x2a3533, 0.9))
  c.move(to: CGPoint(x: w * 0.3, y: 0)); c.addLine(to: CGPoint(x: w * 0.48, y: h * 0.16)); c.addLine(to: CGPoint(x: w * 0.52, y: h * 0.16)); c.addLine(to: CGPoint(x: w * 0.75, y: 0)); c.fillPath()
}

let fireplaceScene: Scene = { c, w, h, t in
  vGradient(c, w, h, [rgb(0x140a06), rgb(0x24120a), rgb(0x0b0503)], [0, 0.6, 1])
  let center = CGPoint(x: w / 2, y: h * 0.3)
  let flick = 1 + 0.05 * sin(tau * t * 6) + 0.04 * sin(tau * t * 9 + 2)
  glow(c, CGPoint(x: center.x, y: center.y + h * 0.08), w * 1.0 * flick, rgb(0xff6a1f, 0.25))
  // 장작
  c.setFillColor(rgb(0x3b2416))
  for (dx, ang) in [(-0.12, 0.22), (0.12, -0.22), (0.0, 0.0)] as [(CGFloat, CGFloat)] {
    c.saveGState(); c.translateBy(x: center.x + dx * w, y: center.y); c.rotate(by: ang)
    c.addPath(CGPath(roundedRect: CGRect(x: -w * 0.22, y: -h * 0.018, width: w * 0.44, height: h * 0.036), cornerWidth: h * 0.018, cornerHeight: h * 0.018, transform: nil))
    c.fillPath(); c.restoreGState()
  }
  glow(c, CGPoint(x: center.x, y: center.y + h * 0.01), w * 0.3, rgb(0xff8a2a, 0.5))
  // 불꽃 혀들
  let tongues: [(CGFloat, CGFloat, CGFloat)] = [(-0.16, 0.7, 0.3), (-0.07, 1.0, 0.1), (0.02, 1.15, 0.6), (0.1, 0.9, 0.85), (0.18, 0.65, 0.45)]
  for (layer, (col, sc)) in [(0xff5a1a as UInt32, 1.0 as CGFloat), (0xff9a2e, 0.75), (0xffd36b, 0.45)].enumerated() {
    for (dx, height, ph) in tongues {
      let k = 1 + 0.18 * sin(tau * (t * CGFloat(3 + layer) + ph)) + 0.08 * sin(tau * (t * 7 + ph * 2))
      let fh = h * 0.2 * height * k * sc
      let fw = w * 0.08 * sc
      let bx = center.x + dx * w, by = center.y + h * 0.015
      let sway = sin(tau * (t * 2 + ph)) * w * 0.02
      c.move(to: CGPoint(x: bx - fw, y: by))
      c.addCurve(to: CGPoint(x: bx + sway, y: by + fh), control1: CGPoint(x: bx - fw, y: by + fh * 0.45), control2: CGPoint(x: bx + sway - fw * 0.2, y: by + fh * 0.7))
      c.addCurve(to: CGPoint(x: bx + fw, y: by), control1: CGPoint(x: bx + sway + fw * 0.2, y: by + fh * 0.7), control2: CGPoint(x: bx + fw, y: by + fh * 0.45))
      c.setFillColor(rgb(col, 0.85)); c.fillPath()
    }
  }
  // 불티
  var r = Rand(s: 99)
  for _ in 0..<30 {
    let x0 = center.x + (r.next() - 0.5) * w * 0.4
    let cyc = CGFloat(1 + Int(r.next() * 2))
    let p = ((r.next() + t * cyc).truncatingRemainder(dividingBy: 1))
    let y = center.y + h * 0.05 + p * h * 0.5
    let x = x0 + sin(tau * (p * 2 + r.next())) * w * 0.04
    c.setFillColor(rgb(0xffb35a, (1 - p) * 0.9)); let s = w * 0.005
    c.fillEllipse(in: CGRect(x: x, y: y, width: s, height: s))
  }
}

let scenes: [(String, Scene)] = [
  ("rain_window", rainWindow), ("moon_sea", moonSea), ("candle", candle),
  ("stars", stars), ("misty_forest", mistyForest), ("fireplace", fireplaceScene),
]

// MARK: - 출력

func makeContext(_ w: Int, _ h: Int, _ data: UnsafeMutableRawPointer? = nil, _ bpr: Int = 0) -> CGContext {
  CGContext(data: data, width: w, height: h, bitsPerComponent: 8, bytesPerRow: bpr, space: space,
            bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
}

func writeImage(_ name: String, _ scene: Scene, _ dir: String) {
  let w = 1290, h = 2796
  let c = makeContext(w, h)
  c.setShouldAntialias(true)
  scene(c, CGFloat(w), CGFloat(h), 0.1)
  let img = c.makeImage()!
  let url = URL(fileURLWithPath: "\(dir)/bg_\(name).jpg") as CFURL
  let dest = CGImageDestinationCreateWithURL(url, UTType.jpeg.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(dest, img, [kCGImageDestinationLossyCompressionQuality: 0.72] as CFDictionary)
  CGImageDestinationFinalize(dest)
}

func writeVideo(_ name: String, _ scene: Scene, _ dir: String) {
  let w = 720, h = 1280, fps: Int32 = 24, secs = 16
  let url = URL(fileURLWithPath: "\(dir)/vid_\(name).mp4")
  try? FileManager.default.removeItem(at: url)
  let writer = try! AVAssetWriter(outputURL: url, fileType: .mp4)
  let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: w, AVVideoHeightKey: h,
    AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 1_600_000, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel],
  ])
  input.expectsMediaDataInRealTime = false
  let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA, kCVPixelBufferWidthKey as String: w, kCVPixelBufferHeightKey as String: h,
  ])
  writer.add(input)
  writer.startWriting(); writer.startSession(atSourceTime: .zero)
  let frames = Int(fps) * secs
  for f in 0..<frames {
    while !input.isReadyForMoreMediaData { usleep(1000) }
    var pb: CVPixelBuffer?
    CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &pb)
    CVPixelBufferLockBaseAddress(pb!, [])
    let c = makeContext(w, h, CVPixelBufferGetBaseAddress(pb!), CVPixelBufferGetBytesPerRow(pb!))
    scene(c, CGFloat(w), CGFloat(h), CGFloat(f) / CGFloat(frames))
    CVPixelBufferUnlockBaseAddress(pb!, [])
    adaptor.append(pb!, withPresentationTime: CMTime(value: CMTimeValue(f), timescale: fps))
  }
  input.markAsFinished()
  let sem = DispatchSemaphore(value: 0)
  writer.finishWriting { sem.signal() }
  sem.wait()
  if writer.status != .completed { print("FAILED \(name): \(String(describing: writer.error))") }
}

let imgDir = CommandLine.arguments[1], vidDir = CommandLine.arguments[2]
for (name, scene) in scenes {
  writeImage(name, scene, imgDir)
  writeVideo(name, scene, vidDir)
  print("wrote \(name)")
}
