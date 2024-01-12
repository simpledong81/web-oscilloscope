export interface WaveTypes {
  // https://www.tek.com/ja/documents/primer/oscilloscope-basics
  // 正弦波
  sine: number,
  // 方形波
  square: number,
  // 三角波
  triangular: number,
  // のこぎり波
  saw: number,
}

export interface WaveOptionsType {
  [key: number]: string
}

export interface OscState {
  // 振幅
  amplitude: number,
  cutoff: number,
  frequency: number,
  noiseLevel: number,
  heightLimit: number,
  waveChoice: number,
  widthLimit?: number,
}
