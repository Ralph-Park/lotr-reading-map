/** 토큰 글자색을 정하기 위한 밝기 판정 */
export function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 > 170
}
