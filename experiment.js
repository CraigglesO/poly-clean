const fs = require('fs')
const { cleanPoly } = require('./lib')

const poly = [
          [
            [
              -104.0185546875,
              44.63739123445585
            ],
            [
              -96.85546875,
              47.88688085106901
            ],
            [
              -96.08642578125,
              52.6030475337285
            ],
            [
              -102.63427734374999,
              53.73571574532637
            ],
            [
              -103.55712890625,
              54.29088164657006
            ],
            [
              -100.4150390625,
              54.303704439898084
            ],
            [
              -103.16162109375,
              51.86292391360244
            ],
            [
              -94.37255859375,
              52.06600028274635
            ],
            [
              -98.7890625,
              51.0275763378024
            ],
            [
              -94.482421875,
              50.12057809796008
            ],
            [
              -104.67773437499999,
              48.28319289548349
            ],
            [
              -104.0185546875,
              44.63739123445585
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
