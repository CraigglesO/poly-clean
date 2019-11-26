const fs = require('fs')
const { cleanPoly } = require('./lib')

const poly = [
  [
    [
      -81.82617187499999,
      46.13417004624326
    ],
    [
      -101.865234375,
      55.229023057406344
    ],
    [
      -112.67578124999999,
      52.96187505907603
    ],
    [
      -117.24609374999999,
      56.26776108757582
    ],
    [
      -111.70898437499999,
      56.17002298293205
    ],
    [
      -125.24414062499999,
      46.437856895024204
    ],
    [
      -81.82617187499999,
      46.13417004624326
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
