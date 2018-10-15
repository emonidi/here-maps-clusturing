// import { data } from './data.geo';
import {data} from './data.geo'
import { throttle, filter, forEach, map, reduce } from 'lodash';
const container = document.getElementById('display');

const display = new here.xyz.maps.Map(
    container,
    {
        zoomLevel: 3,
        center: {
            longitude: data.features[0].geometry.coordinates[0],
            latitude: data.features[0].geometry.coordinates[1]
        },
        // add layers to display
        layers: [
            new here.xyz.maps.layers.TileLayer({
                name: 'Image Layer',
                min: 1,
                max: 20,
                // image layer for displaying satellite images
                provider: new here.xyz.maps.providers.ImageProvider({
                    name: 'Live Map',
                    url: 'https://{SUBDOMAIN_INT_1_4}.mapcreator.tilehub.api.here.com/tilehub/wv_livemap_bc/png/map/256/{QUADKEY}?access_token=IzOHLHLyynLPwG28V26Hcw'
                })
            })
        ]
    }
);

display.resize(window.innerWidth, window.innerHeight)
const provider = new here.xyz.maps.providers.LocalProvider({
    min: 1,
    max: 20
});
const dataLayer = new here.xyz.maps.layers.TileLayer({
    name: 'DataLayer',
    min: 1,
    max: 20,
    provider,
    style: {
        styleGroups: {
            'point': [{ type: "Circle", radius: 0, fill: "transparent" }],
        }, assign(feature) {
            return { zIndex: 0, type: "Circle", radius: 0, fill: "red" }
        }
    }
})

let oldFeature = [];

dataLayer.addFeature(data.features)
display.refresh();

const clusterLayer = new here.xyz.maps.layers.TileLayer({
    min: 1,
    max: 20,
    provider,
    style: {
        styleGroups: {
            'point': [{ zIndex: 0, type: "Circle", radius: 8, fill: "red" }],
        },
        assign(feature) {
            if (!feature.properties.type) return;
            if (feature.properties.type === "cluster") {
                return { zIndex: 0, type: "Circle", radius: 16, fill: "green", opacity: 0.8 }
            } else if (feature.properties.type === 'feature') {
                return { zIndex: 0, type: "Circle", radius: 8, fill: "red" }
            }
        }
    }
})

display.addLayer(dataLayer);
display.addLayer(clusterLayer);
cluster1(display.getZoomlevel())
display.refresh();

function isVisible(point, rect) {
    const { minLat, minLon, maxLat, maxLon } = rect;
    const coords = point.geometry.coordinates;
    return maxLon > coords[0] && coords[0] > minLon
        && maxLat > coords[1] && coords[1] > minLat
}

display.addObserver('zoomlevel', (i, zoom) => {
    cluster1(8)
})


function search(rect, data) {
    return filter(data, (item) => {
        if (isVisible(item, rect)) return item;
    })
}

function cluster1(zoom) {
    const grids = makeGrid(zoom, zoom)

    let clusters = map(grids, (rect, index) => {
        const features = search(rect, data.features);
        if (features.length > 2) {
            return reduce(features,(curr, next) => {
                const BBox = [
                    Math.min(curr.geometry.coordinates[0], next.geometry.coordinates[0]),
                    Math.max(curr.geometry.coordinates[0], next.geometry.coordinates[0]),
                    Math.min(curr.geometry.coordinates[1], next.geometry.coordinates[1]),
                    Math.max(curr.geometry.coordinates[1], next.geometry.coordinates[1])
                ]
                return {
                    id: 'cluster' + curr.id.toString().replace('cluster', ''),
                    geometry: {
                        type: 'Point',
                        coordinates: [
                            BBox[0] + ((BBox[1] - BBox[0])/2),
                            BBox[2] + ((BBox[3] - BBox[2])/2)
                        ]
                    }
                }
            }, features[0]);
        } else {
            return features;
        }
    })

    let flat = [];
    forEach(clusters, (item) => {
        if (Array.isArray(item) && item.length > 0) {

            item.forEach((f) => {
                f.properties.type = "feature"
                flat.push(f)
            })
        } else if (!Array.isArray(item)) {
            item.properties = { type: "cluster" }
            flat.push(item);
        }
    })

    forEach(oldFeature, f => clusterLayer.removeFeature(f))
    clusterLayer.addFeature(flat)
    oldFeature = flat;
    display.refresh();
}

function makeGrid(width, height) {
    const BBox = display.getViewBounds();
    const widthStep = (BBox.maxLon - BBox.minLon) / width;
    const heightStep = (BBox.maxLat - BBox.minLat) / height;
    let grid = [];
    for (var i = 0; i < width; i++) {
        for (var j = 0; j < height; j++) {
            // grid.push([widthStep*i,widthStep*(i+1), heightStep*j,heightStep*(j+1)])
            grid.push({
                minLon: BBox.minLon + (widthStep * i),
                maxLon: BBox.minLon + (widthStep * (i + 1)),
                minLat: BBox.minLat + (heightStep * j),
                maxLat: BBox.minLat + (heightStep * (j + 1))
            })
        }
    }
    return grid;
}