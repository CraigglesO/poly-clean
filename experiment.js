const fs = require('fs')
const { cleanPoly } = require('./lib')

const poly = [
          [
            [
              -371.953125,
              11.867350911459308
            ],
            [
              -302.51953125,
              11.867350911459308
            ],
            [
              -302.51953125,
              56.65622649350222
            ],
            [
              -371.953125,
              56.65622649350222
            ],
            [
              -371.953125,
              11.867350911459308
            ]
          ],
          [
            [
              -309.90234374999994,
              34.74161249883172
            ],
            [
              -294.2578125,
              31.052933985705163
            ],
            [
              -295.3125,
              44.715513732021336
            ],
            [
              -309.90234374999994,
              34.74161249883172
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
