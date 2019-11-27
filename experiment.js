const fs = require('fs')
const { cleanPoly } = require('./lib')

const poly = [
  [
    [
      -91.40625,
      38.95940879245423
    ],
    [
      -132.890625,
      60.23981116999893
    ],
    [
      -153.80859375,
      53.014783245859235
    ],
    [
      -112.67578124999999,
      60.75915950226991
    ],
    [
      -124.98046874999999,
      44.465151013519616
    ],
    [
      -83.84765625,
      52.5897007687178
    ],
    [
      -160.13671875,
      15.453680224345835
    ],
    [
      -135,
      11.178401873711785
    ],
    [
      -91.40625,
      38.95940879245423
    ]
  ]
]

const newPolys = cleanPoly(poly)
console.log('newPolys', newPolys)

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
