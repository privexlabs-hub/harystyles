/** Shared by the browser (coarse location → cell) and the server. Precision 4 ≈ 20 km (BR-PR-02). */
const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

/** Geohash encode (used when the client shares a coarse location). */
export function geohashEncode(latitude: number, longitude: number, precision = 4): string {
  const lat: [number, number] = [-90, 90];
  const lon: [number, number] = [-180, 180];
  let hash = "";
  let even = true;
  let bit = 0;
  let ch = 0;
  while (hash.length < precision) {
    const range = even ? lon : lat;
    const value = even ? longitude : latitude;
    const mid = (range[0] + range[1]) / 2;
    if (value >= mid) {
      ch = (ch << 1) | 1;
      range[0] = mid;
    } else {
      ch <<= 1;
      range[1] = mid;
    }
    even = !even;
    if (++bit === 5) {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
}

