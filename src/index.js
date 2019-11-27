// @flow
type Point = [number, number]
type LineString = Array<Point>
type Polygon = Array<LineString>
type MultiPolygon = Array<Polygon>

type Intersections = {
  [string | number]: Array<Intersection>
}

type Intersection = {
  index: number,
  intersect: Point
}

export function cleanMultiPolygon (multiPoly: MultiPolygon) {
  for (const poly of multiPoly) cleanPoly(poly)
}

export function cleanPoly (poly: Polygon): Array<LineString> {
  // step 1: Fix outer-rings
  const [newOuterRing, newPolyLines] = removeKinks(poly[0])
  // store the new outer ring
  poly[0] = newOuterRing
  // step 2: Fix holes
  for (let i = 1; i < poly.length; i++) {
    const [newHole, newHoles] = cleanHoles(poly[i], poly[0])
    // update hole
    poly[i] = newHole
    // if new holes were created during clean, store
    if (newHoles) poly.push(...newHoles)
    // if the updated hole is a null, just remove it
    if (!poly[i]) {
      poly.splice(i, 1)
      i--
    }
  }
  // return newPolyLines
  return newPolyLines
}

function cleanHoles (hole: LineString, outerRing: LineString): [LineString, Array<LineString>] {
  // first remove kinks
  const [cleanHole, excessHoles] = removeKinks(hole)
  // next ensure points are within outerRing
  const outside = []
  const inside = []
  let isInside = true
  let inPoly: boolean
  let line = [cleanHole[0]]
  // start at the beginning
  inPoly = pointInPolygon(cleanHole[0], outerRing)
  if (!inPoly) isInside = false
  // we now know our "starting" state
  const startState = inPoly
  // loop
  for (let i = 1, hl = cleanHole.length; i < hl; i++) {
    inPoly = pointInPolygon(cleanHole[i], outerRing)
    if (isInside !== inPoly) {
      if (isInside) inside.push(line)
      else outside.push(line)
      line = []
      // swap state
      isInside = !isInside
    }
    line.push(cleanHole[i])
  }
  // store the last line
  if (line.length) {
    if (isInside) inside.push(line)
    else outside.push(line)
    line = []
  }
  // if no inside points, just "remove" the hole. If no outside points, we don't have to edit the hole
  if (!inside.length) return [null, excessHoles]
  else if (!outside.length) return [cleanHole, excessHoles]
  // now we simplify the lines during merge... zig-zag between the inside and outside lines working from "startState"
  isInside = startState
  const newHole = []
  let start: Point, end: Point
  while (inside.length || outside.length) {
    // get the next line
    line = (isInside) ? inside.shift() : outside.shift()
    // assuming we have a starting point, create the next intersection
    if (start) {
      end = line[0]
      // find intersection
      const intersection = findIntersect(start, end, outerRing)
      // store intersection
      if (intersection) newHole.push(intersection)
      else newHole.push(start)
    }
    // inf inside, add inside line points
    if (isInside) newHole.push(...line)
    // prep for next intersection
    start = line[line.length - 1]
    // now swap which we look at
    isInside = !isInside
  }
  // ensure newHole ends at start
  const nhl = newHole.length - 1
  if (newHole[0][0] !== newHole[nhl][0] || newHole[0][1] !== newHole[nhl][1]) newHole.push([newHole[0][0], newHole[0][1]])
  // clean line
  cleanLine(newHole)
  // last, check if length is larger than 3, otherwise "remove" it
  if (newHole.length < 4) return null
  return [newHole, excessHoles]
}

// remove kinks
function removeKinks (lineString: LineString, newPolyLines?: Array<LineString> = []): [LineString, Array<LineString>] {
  // first find all the kinks
  const intersection = findKink(lineString)
  // if no kinks, just return
  if (!intersection) return [lineString, newPolyLines]
  // since we have an intersection, let's it from the main lineString and put it inside newPolyLines
  const [startIndex, intersectIndex, intersect] = intersection
  // first store the new polyLine that was extracted
  let newPolyLine = [
    intersect,
    ...lineString.slice(startIndex + 1, intersectIndex + 1),
    intersect
  ]
  if (booleanClockwise(newPolyLine)) newPolyLine.reverse()
  newPolyLines.push(newPolyLine)
  // now we update the lineString to remove the kink and polyLine
  lineString = [
    ...lineString.slice(0, startIndex + 1),
    intersect,
    ...lineString.slice(intersectIndex + 1)
  ]
  // since we found a kink, we look for more kinks incase more exist
  return removeKinks(lineString, newPolyLines)
}

function findKink (lineString: LineString): Intersections {
  let p1: Point, p2: Point, p3: Point, p4: Point
  for (let i = 0, ll = lineString.length - 1; i < ll; i++) {
    p1 = lineString[i]
    p2 = lineString[i + 1]
    for (let j = i + 2; j < ll; j++) {
      p3 = lineString[j]
      p4 = lineString[j + 1]
      // see if the two lines intersect
      const intersect = intersects(...p1, ...p2, ...p3, ...p4)
      if (intersect) return [i, j, intersect]
    }
  }
}

function findIntersect (start: number, end: number, poly: LineString) {
  const x1 = start[0]
  const y1 = start[1]
  const x2 = end[0]
  const y2 = end[1]
  for (let i = 0, pl = poly.length - 1; i < pl; i++) {
    const intersect = intersects(x1, y1, x2, y2, ...poly[i], ...poly[i + 1])
    if (intersect) return intersect
  }
}

function intersects (x1: number, y1: number, x2: number, y2: number, x3: number,
  y3: number, x4: number, y4: number): void | Point {
  const det = (x2 - x1) * (y4 - y3) - (x4 - x3) * (y2 - y1)
  if (!det) return
  const lambda = ((y4 - y3) * (x4 - x1) + (x3 - x4) * (y4 - y1)) / det
  const gamma = ((y1 - y2) * (x4 - x1) + (x2 - x1) * (y4 - y1)) / det
  if ((lambda > 0 && lambda < 1) && (gamma > 0 && gamma < 1)) {
    return [x1 + lambda * (x2 - x1), y1 + lambda * (y2 - y1)]
  }
}

export function pointInPolygon (point: Point, poly: LineString): boolean {
  const x = point[0]
  const y = point[1]

  let inside = false
  let xi, yi, xj, yj
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    xi = poly[i][0]
    yi = poly[i][1]
    xj = poly[j][0]
    yj = poly[j][1]

    // if on boundary, than definitely "inside" poly
    if (
      (y * (xi - xj) + yi * (xj - x) + yj * (x - xi) === 0) &&
      ((xi - x) * (xj - x) <= 0) && ((yi - y) * (yj - y) <= 0)
    ) { return true }

    if (((yi >= y) !== (yj >= y)) && (x <= (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside
  }

  if (inside) return true
  return false
}

// should three points in a row follow the same direction, we merge them into 1
function cleanLine (lineString: LineString) {
  // remove duplicates at beginning
  while (equal(lineString[0], lineString[1])) lineString.shift()
  // remove duplicates or 3 point lines that have equal angles
  for (let i = 1; i < lineString.length - 1; i++) {
    const before = lineString[i - 1]
    const current = lineString[i]
    const next = lineString[i + 1]
    if (
      equal(current, next) ||
      getAngle(before, current) === getAngle(current, next) ||
      getAngle(before, current) === getAngle(next, current)
    ) {
      lineString.splice(i, 1)
      i--
    }
  }
}

function equal (p1: Point, p2: Point) {
  if (p1[0] === p2[0] && p1[1] === p2[1]) return true
  return false
}

function getAngle (p1: [number, number], p2: [number, number]) {
  let rads: number = Math.atan2(p1[0] - p2[0], p1[1] - p2[1])
  // We need to map to coord system when 0 degree is at 3 O'clock, 270 at 12 O'clock
  if (rads < 0) return Math.abs(rads)
  return 2 * Math.PI - rads
}

function distance (p1: Point, p2: Point): number {
  const a = p2[0] - p1[0]
  const b = p2[1] - p1[1]

  return Math.sqrt(a * a + b * b)
}

function booleanClockwise (line: LineString): boolean {
  const ll = line.length
  let sum: number = 0
  let i: number = 1
  let prev: Point, cur: Point

  while (i < ll) {
    prev = cur || line[0]
    cur = line[i]
    sum += ((cur[0] - prev[0]) * (cur[1] + prev[1]))
    i++
  }

  return sum > 0
}
