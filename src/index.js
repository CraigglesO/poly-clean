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

export function cleanPoly (poly: Polygon) {
  const outerRing = poly[0]
  // step 1: Fix outer-rings
  poly[0] = removeKinks(outerRing)
  // step 2: Fix holes
  for (let i = 1; i < poly.length; i++) {
    cleanHoles(poly[i], outerRing)
    if (!poly[i]) {
      poly.splice(i, 1)
      i--
    }
  }
}

function cleanHoles (hole: LineString, outerRing: LineString) {
  // first remove kinks
  removeKinks(hole)
  // next ensure points are within outerRing
  const outside = []
  const inside = []
  let isInside = true
  let inPoly: boolean
  let line = [hole[0]]
  // start at the beginning
  inPoly = pointInPolygon(hole[0], outerRing)
  if (!inPoly) isInside = false
  // we now know our "starting" state
  const startState = inPoly
  // loop
  for (let i = 1, hl = hole.length; i < hl; i++) {
    inPoly = pointInPolygon(hole[i], outerRing)
    if (isInside !== inPoly) {
      if (isInside) inside.push(line)
      else outside.push(line)
      line = []
    }
    line.push(i)
  }
  // store the last line
  if (line.length) {
    if (isInside) inside.push(line)
    else outside.push(line)
    line = []
  }
  // if no inside points, just "remove" the hole. If no outside points, we don't have to edit the hole
  if (!inside.length) {
    hole = null
    return
  } else if (!outside.length) { return }
  // now we simplify the lines during merge... zig-zag between the inside and outside lines working from "startState"
  isInside = startState
  const newHole = []
  let start: Point, end: Point
  while (inside.length) {
    if (isInside) {
      line = inside.shift()
      if (start) {
        end = line[0]
        // find intersection
        const intersection = findIntersect(start, end, poly)
        // store intersection
        if (intersection) newHole.push(intersection)
        else newHole.push(start)
      }
      // add inside line points
      newHole.push(...line)
      // prep for next intersection
      start = line[line.length - 1]
    } else {
      line = outside.shift()
      if (start) {
        end = line[0]
        // find intersection
        const intersection = findIntersect(start, end, poly)
        // store intersection
        if (intersection) newHole.push(intersection)
        else newHole.push(start)
      }
      // prep for next intersection
      start = line[line.length - 1]
    }
  }
  // ensure newHole ends at start
  const nhl = newHole.length
  if (newHole[0][0] !== newHole[nhl][0] || newHole[0][1] !== newHole[nhl][1]) newHole.push([newHole[0][0], newHole[0][1]])
  // clean line
  cleanLine(newHole)
  // last, check if length is larger than 3, otherwise "remove" it
  if (newHole.length < 4) hole = null
  else hole = newHole
}

// remove kinks
function removeKinks (lineString: LineString): LineString {
  // first find all the kinks
  const intersections = findKinks(lineString)
  // gather up the starts
  const starts = Object.keys(intersections)
  // if no kinks, just return
  if (!starts.length) return lineString
  // prep new lineString and other variables
  const newLineString = []
  let currentIndex: number = 0
  let start: number, intersectionList: Intersection
  for (let i = 0, sl = starts.length; i < sl; i++) {
    start = +starts[i]
    intersectionList = intersections[start]
    // add all before intersection
    newLineString.push(...lineString.slice(currentIndex, start + 1))
    // now if there is only one, go to intersection, add up to intersection again reversed, than move on
    if (intersectionList.length === 1) {
      const { index, intersect } = intersectionList[0]
      newLineString.push(
        intersect,
        ...(lineString.slice(start + 1, index + 1).reverse()),
        intersect
      )
      // update last index
      currentIndex = index + 1
    } else {
      // sort by intersections distance to start
      const startingPoint = lineString[start]
      intersectionList = intersectionList.sort((a, b) => {
        return distance(startingPoint, a.intersect) - distance(startingPoint, b.intersect)
      })
      // seperate
      for (let j = 0, ill = intersectionList.length; j < ill; j++) {
        // first store the first intersect
        newLineString.push(intersectionList[j].intersect)
        // store up to the next intersect
        if (j + 1 < ill) 
      }
      // end on the starting intersect
      newLineString.push(intersectionList[0].intersect)
    }
  }
  if (currentIndex < lineString.length - 1) newLineString.push(...lineString.slice(currentIndex, lineString.length))
  return newLineString
}

function findKinks (lineString: LineString): Intersections
 {
  let p1: Point, p2: Point, p3: Point, p4: Point
  // find self-intersections
  const intersections: Intersections = {}
  for (let i = 0, ll = lineString.length - 1; i < ll; i++) {
    p1 = lineString[i]
    p2 = lineString[i + 1]
    for (let j = i + 2; j < ll; j++) {
      p3 = lineString[j]
      p4 = lineString[j + 1]
      // see if the two lines intersect
      const intersect = intersects(...p1, ...p2, ...p3, ...p4)
      if (intersect) {
        const intersection = { index: j, intersect }
        if (intersections[i]) intersections[i].push(intersection)
        else intersections[i] = [intersection]
      }
    }
  }
  console.log('intersections', intersections)
  return intersections
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
function cleanLine (poly: LineString) {
  for (const lineString of poly) {
    // remove duplicates at beginning
    while (equal(lineString[0], lineString[1])) lineString.shift()
    // remove duplicates or 3 point lines that have equal angles
    for (let i = 1; i < lineString.length - 1; i++) {
      const before = lineString[i - 1]
      const current = lineString[i]
      const next = lineString[i + 1]
      if (
        equal(current, next) ||
        getAngle(before, current) === getAngle(current, next)
      ) {
        lineString.splice(i, 1)
        i--
      }
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
