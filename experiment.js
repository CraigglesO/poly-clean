const fs = require('fs')
const { cleanPoly } = require('./lib')

const poly = [
  [
    [
      -139.39453125,
      32.39851580247402
    ],
    [
      -109.6875,
      18.312810846425442
    ],
    [
      -75.41015624999999,
      42.5530802889558
    ],
    [
      -107.57812499999999,
      62.431074232920906
    ],
    [
      -118.30078125,
      56.07203547180089
    ],
    [
      -85.95703125,
      63.15435519659187
    ],
    [
      -73.125,
      59.62332522313024
    ],
    [
      -91.93359375,
      46.92025531537451
    ],
    [
      -65.0390625,
      49.26780455063753
    ],
    [
      -139.39453125,
      32.39851580247402
    ]
  ]
]

cleanPoly(poly)

const featureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: poly
      }
    }
  ]
}

fs.writeFileSync('./out.geojson', JSON.stringify(featureCollection, null, 2))
