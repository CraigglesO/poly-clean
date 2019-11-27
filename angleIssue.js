function getAngle (p1, p2) {
  let rads = Math.atan2(p1[0] - p2[0], p1[1] - p2[1])
  // We need to map to coord system when 0 degree is at 3 O'clock, 270 at 12 O'clock
  if (rads < 0) return Math.abs(rads)
  return 2 * Math.PI - rads
}

// [[0, 0], [0, 1], [0, 0]]

console.log(getAngle([-91.23046875,
            50.736455137010665], [-110.0390625,
            58.90464570302001]))
console.log(getAngle([-95.44921875,
            49.26780455063753], [-110.0390625,
            58.90464570302001]))
