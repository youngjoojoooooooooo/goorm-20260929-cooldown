// 자연음 4종(빗소리·파도·모닥불·밤 숲)을 코드로 합성해 WAV로 저장합니다.
// 직접 합성한 음원이라 라이선스 문제가 없습니다. 출시 전 실제 녹음본으로 바꿔도 됩니다.
// 사용법: swift tools/gen_ambient.swift <출력폴더>
import Foundation

let sr = 44100
let seconds = 60
let fade = 3 // 루프 이음매를 없애기 위한 크로스페이드 길이(초)
let total = sr * (seconds + fade)

struct RNG {
  var s: UInt64
  mutating func next() -> Double {
    s ^= s << 13; s ^= s >> 7; s ^= s << 17
    return Double(s % 1_000_000) / 500_000.0 - 1.0
  }
}

final class Pink {
  var b = [Double](repeating: 0, count: 7)
  func run(_ w: Double) -> Double {
    b[0] = 0.99886 * b[0] + w * 0.0555179
    b[1] = 0.99332 * b[1] + w * 0.0750759
    b[2] = 0.96900 * b[2] + w * 0.1538520
    b[3] = 0.86650 * b[3] + w * 0.3104856
    b[4] = 0.55000 * b[4] + w * 0.5329522
    b[5] = -0.7616 * b[5] - w * 0.0168980
    let o = b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + w * 0.5362
    b[6] = w * 0.115926
    return o * 0.11
  }
}

final class Brown {
  var last = 0.0
  func run(_ w: Double) -> Double {
    last = (last + 0.02 * w) / 1.02
    return last * 3.5
  }
}

final class LowPass {
  var y = 0.0
  var a: Double
  init(_ cutoff: Double) { a = 1 - exp(-2 * Double.pi * cutoff / Double(sr)) }
  func set(_ cutoff: Double) { a = 1 - exp(-2 * Double.pi * cutoff / Double(sr)) }
  func run(_ x: Double) -> Double { y += a * (x - y); return y }
}

func rain(_ L: inout [Double], _ R: inout [Double]) {
  var r = RNG(s: 0x9E3779B97F4A7C15)
  let pl = Pink(), pr = Pink()
  let lpl = LowPass(3200), lpr = LowPass(3200)
  var dropL = 0.0, dropR = 0.0, toneL = 0.0, toneR = 0.0, phL = 0.0, phR = 0.0
  for i in 0..<total {
    L[i] = lpl.run(pl.run(r.next())) * 0.9
    R[i] = lpr.run(pr.run(r.next())) * 0.9
    // 창문에 떨어지는 물방울
    if r.next() > 0.99955 { dropL = 0.25 + 0.2 * abs(r.next()); toneL = 1800 + 2200 * abs(r.next()) }
    if r.next() > 0.99955 { dropR = 0.25 + 0.2 * abs(r.next()); toneR = 1800 + 2200 * abs(r.next()) }
    phL += toneL / Double(sr); phR += toneR / Double(sr)
    L[i] += sin(2 * .pi * phL) * dropL * 0.25
    R[i] += sin(2 * .pi * phR) * dropR * 0.25
    dropL *= 0.9985; dropR *= 0.9985
  }
}

func waves(_ L: inout [Double], _ R: inout [Double]) {
  var r = RNG(s: 0xDEADBEEFCAFE1234)
  let bl = Brown(), br = Brown(), pl = Pink(), pr = Pink()
  let lpl = LowPass(600), lpr = LowPass(600)
  let period = 7.5 // 60초 안에 정확히 8번 → 루프 경계에서도 파도 주기가 맞음
  for i in 0..<total {
    let t = Double(i) / Double(sr)
    let ph = (t.truncatingRemainder(dividingBy: period)) / period
    let swell = pow(sin(.pi * ph), 2.2)
    let swellR = pow(sin(.pi * ((ph + 0.12).truncatingRemainder(dividingBy: 1))), 2.2)
    lpl.set(300 + 2200 * swell); lpr.set(300 + 2200 * swellR)
    L[i] = lpl.run(bl.run(r.next()) * 0.6 + pl.run(r.next()) * 0.8) * (0.25 + 0.9 * swell)
    R[i] = lpr.run(br.run(r.next()) * 0.6 + pr.run(r.next()) * 0.8) * (0.25 + 0.9 * swellR)
  }
}

func fire(_ L: inout [Double], _ R: inout [Double]) {
  var r = RNG(s: 0x1234567887654321)
  let bl = Brown(), br = Brown()
  let lp = LowPass(400)
  var crack = 0.0, pan = 0.5, hiss = LowPass(5000)
  for i in 0..<total {
    let base = lp.run(bl.run(r.next()) + br.run(r.next())) * 0.9
    if r.next() > 0.9993 { crack = 0.3 + 0.5 * abs(r.next()); pan = 0.5 + 0.5 * r.next() }
    let c = hiss.run(r.next()) * crack
    crack *= 0.993
    let rumble = 0.6 + 0.4 * sin(Double(i) / Double(sr) * 2 * .pi / 6.0)
    L[i] = base * rumble + c * (1 - pan)
    R[i] = base * rumble + c * pan
  }
  _ = hiss
}

func forest(_ L: inout [Double], _ R: inout [Double]) {
  var r = RNG(s: 0x0F0F0F0F12121212)
  let pl = Pink(), pr = Pink()
  let lpl = LowPass(900), lpr = LowPass(900)
  for i in 0..<total {
    let t = Double(i) / Double(sr)
    // 바람
    let wind = 0.5 + 0.5 * sin(t * 2 * .pi / 10.0)
    L[i] = lpl.run(pl.run(r.next())) * (0.35 + 0.35 * wind)
    R[i] = lpr.run(pr.run(r.next())) * (0.35 + 0.35 * wind)
    // 풀벌레(귀뚜라미): 4.6kHz 톤을 30Hz로 끊어서 3번씩 울림
    let cycle1 = t.truncatingRemainder(dividingBy: 1.5)
    let gate1 = cycle1 < 0.3 ? max(0, sin(2 * .pi * 30 * t)) : 0
    let cycle2 = (t + 0.7).truncatingRemainder(dividingBy: 2.0)
    let gate2 = cycle2 < 0.24 ? max(0, sin(2 * .pi * 26 * t)) : 0
    let c1 = sin(2 * .pi * 4600 * t) * gate1 * 0.05
    let c2 = sin(2 * .pi * 5200 * t) * gate2 * 0.035
    L[i] += c1 * 0.8 + c2 * 0.3
    R[i] += c1 * 0.3 + c2 * 0.8
  }
}

func writeWav(_ path: String, _ L: [Double], _ R: [Double]) {
  let n = sr * seconds
  let f = sr * fade
  // 끝 3초를 처음 3초에 섞어 이음매 제거
  var outL = Array(L[0..<n]), outR = Array(R[0..<n])
  for i in 0..<f {
    let a = Double(i) / Double(f)
    outL[i] = L[i] * a + L[n + i] * (1 - a)
    outR[i] = R[i] * a + R[n + i] * (1 - a)
  }
  // 음원끼리 음량을 비슷하게 맞춤 (RMS 정규화)
  var sum = 0.0
  for i in 0..<n { sum += outL[i] * outL[i] + outR[i] * outR[i] }
  let rms = sqrt(sum / Double(2 * n))
  let gain = 0.12 / max(rms, 1e-9)
  var data = Data()
  func u32(_ v: UInt32) { var x = v.littleEndian; data.append(Data(bytes: &x, count: 4)) }
  func u16(_ v: UInt16) { var x = v.littleEndian; data.append(Data(bytes: &x, count: 2)) }
  data.append("RIFF".data(using: .ascii)!); u32(UInt32(36 + n * 4))
  data.append("WAVEfmt ".data(using: .ascii)!); u32(16); u16(1); u16(2)
  u32(UInt32(sr)); u32(UInt32(sr * 4)); u16(4); u16(16)
  data.append("data".data(using: .ascii)!); u32(UInt32(n * 4))
  var pcm = [Int16](repeating: 0, count: n * 2)
  for i in 0..<n {
    pcm[2 * i] = Int16(max(-1, min(1, outL[i] * gain)) * 32000)
    pcm[2 * i + 1] = Int16(max(-1, min(1, outR[i] * gain)) * 32000)
  }
  pcm.withUnsafeBytes { data.append(contentsOf: $0) }
  try! data.write(to: URL(fileURLWithPath: path))
}

let out = CommandLine.arguments[1]
let jobs: [(String, (inout [Double], inout [Double]) -> Void)] = [
  ("rain_soft", rain), ("waves_calm", waves), ("fireplace", fire), ("night_forest", forest),
]
for (name, fn) in jobs {
  var L = [Double](repeating: 0, count: total), R = [Double](repeating: 0, count: total)
  fn(&L, &R)
  writeWav("\(out)/\(name).wav", L, R)
  print("wrote \(name)")
}
