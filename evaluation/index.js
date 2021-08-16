import * as hilbertCurve from "./node_modules/hilbert-curve/dist/hilbert-curve.esm.js";

const zoom = 10;

const map = new maplibregl.Map({
    container: 'map',
    style: "https://api.maptiler.com/maps/basic/style.json?key=qgQRNu4u6W1Iakf5zWTz",
    center: [11.581981, 48.135125],
    zoom: 7 //zoom
});

map.on('load', function () {
    const polygons = drawTileBounds(zoom);

    const features = [];
    for(const polygon of polygons){
        const feature =
            {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: polygon.polygon
                },
                properties: {
                    zIndex: polygon.zIndex,
                    range: polygon.range,
                    index: `${polygon.range}/${polygon.zIndex.toString().substring(polygon.zIndex.toString().length-3)}`
                }
            };
        features.push(feature);
    }

    map.addSource("tiles", {
        type: "geojson",
        data: {
            type: "FeatureCollection",
            features
        }
    });

    map.addLayer({
        'id': 'tiles',
        'type': 'fill',
        'source': 'tiles',
        'layout': {},
        'paint': {
            'fill-color': '#0080ff',
            'fill-opacity': 0.2
        }
    });

    map.addLayer({
        'id': 'outline',
        'type': 'line',
        'source': 'tiles',
        'layout': {},
        'paint': {
            'line-color': '#000',
            'line-width': 2
        }
    });

    /*map.addLayer({
        'id': 'range',
        'type': 'symbol',
        'source': 'tiles',
        'layout': {
            //"text-field": ['get', 'index'],
            //"text-size": 8
            "text-field": ['get', 'range'],
        },
    });*/

    map.addLayer({
        'id': 'range',
        'type': 'symbol',
        'source': 'tiles',
        'layout': {
            //"text-field": ['get', 'index'],
            "text-field": ['get', 'range'],
        },
    });
});

function drawTileBounds(zoom){
    /*
    * -> calculate index for lower bound and upper bound -> index in XYZ tiling scheme (Y axis direction down from the top) which corresponds to hilbert curve lib
    * -> calculate lng/lat coordinates for every tile
    * -> calculate the hilbert index for every tile
    */
    const {_ne: ne, _sw: sw} = map.getBounds();

    const swTile = getPolygon(zoom, sw.lng, sw.lat);
    const neTile = getPolygon(zoom, ne.lng, ne.lat);
    //const deltaX = neTile.xIndex - swTile.xIndex;
    //const deltaY = neTile.yIndex - swTile.yIndex;

    const tiles = [];
    const indices = [];
    for(let row = neTile.yIndex; row <= swTile.yIndex; row++){
        for(let column = swTile.xIndex; column <= neTile.xIndex; column++){
            const tile = getPolygonFromIndex(column, row);

            const zIndex = hilbertCurve.pointToIndex({ x: tile.xIndex, y: tile.yIndex }, zoom);
            tile.zIndex = zIndex;
            indices.push(zIndex);

            tiles.push(tile);
        }
    }

    indices.sort();
    let range = 1;
    for(let i = 0; i < indices.length; i++){
        if(i > 0 && (indices[i] - indices[i-1]) > 1){
            range++;
        }

        const tile = tiles.find(tile => tile.zIndex === indices[i]);
        tile.range = range;
    }

    console.info("Range: ", range);
    console.info("Num tiles: ", tiles.length);

    return tiles;
}

function getPolygonFromIndex(xyzXIndex, xyzYIndex){
    const numTilesPerSide = 1 << zoom;
    const tileSizeLng = 360 / numTilesPerSide;

    //TODO: check formula -> tileInde also has to be converted back to WGS84
    const polygon = [[  [xyzXIndex * tileSizeLng - 180, xyzIndexToLng(zoom, xyzYIndex)], //nw
        [xyzXIndex * tileSizeLng - 180, xyzIndexToLng(zoom, xyzYIndex +1)], //sw
        [(xyzXIndex+1) * tileSizeLng - 180, xyzIndexToLng(zoom, xyzYIndex +1)], //se
        [(xyzXIndex+1) * tileSizeLng - 180, xyzIndexToLng(zoom, xyzYIndex)], //ne
        [xyzXIndex * tileSizeLng - 180, xyzIndexToLng(zoom, xyzYIndex)] //nw
        //[xyzXIndex * tileSizeLng - 180, (xyzYIndex * tileSizeLng - 90) * -1] //nw
    ]];

    return {polygon, xIndex: xyzXIndex, yIndex: xyzYIndex};
}

function getPolygon(zoom, lng, lat){
    const numTilesPerSide = 1 << zoom;
    const tileSizeLng = 360 / numTilesPerSide;
    const tileSizeLat = 180 / numTilesPerSide;

    const xyzXIndex = Math.floor((lng + 180) / tileSizeLng);
    //const xyzYIndex = Math.floor((sw.lat * -1 + 90) / tileSizeLat); //xyz tiling scheme
    const mercatorY = (180 - (180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)))) / 360; // normalized to 0 .... 1
    const xyzYIndex = Math.floor(mercatorY / (1 / numTilesPerSide));
    const tmsIndex = numTilesPerSide - xyzYIndex;

    //TODO: check formula -> tileInde also has to be converted back to WGS84
    const polygon = [[  [xyzXIndex * tileSizeLng - 180, xyzIndexToLng(zoom, xyzYIndex)], //nw
        [xyzXIndex * tileSizeLng - 180, xyzIndexToLng(zoom, xyzYIndex +1)], //sw
        [(xyzXIndex+1) * tileSizeLng - 180, xyzIndexToLng(zoom, xyzYIndex +1)], //se
        [(xyzXIndex+1) * tileSizeLng - 180, xyzIndexToLng(zoom, xyzYIndex)], //ne
        [xyzXIndex * tileSizeLng - 180, xyzIndexToLng(zoom, xyzYIndex)] //nw
        //[xyzXIndex * tileSizeLng - 180, (xyzYIndex * tileSizeLng - 90) * -1] //nw
    ]];

    return {polygon, xIndex: xyzXIndex, yIndex: xyzYIndex};
}

function xyzIndexToLng(zoom, xyzYIndex){
    const n=Math.PI-2*Math.PI*xyzYIndex /Math.pow(2,zoom);
    return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}

function getOsmStyle(){
    /*style: {
        'version': 8,
        'sources': {
            'raster-tiles': {
                'type': 'raster',
                'tiles': [
                    'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                ],
                'tileSize': 256,
            }
        },
        'layers': [
            {
                'id': 'osm',
                'type': 'raster',
                'source': 'raster-tiles',
                'minzoom': 0,
                'maxzoom': 22
            }
        ]
    },*/
}