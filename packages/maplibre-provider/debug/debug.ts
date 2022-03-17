import maplibregl from "maplibre-gl";
import { MapLibreComtProvider } from "../src/index";

MapLibreComtProvider.register();

const map = new maplibregl.Map({
    container: "map",
    style: "http://localhost:4711/assets/style.json",
    center: [16.335668227571986, 48.18343081801389],
    zoom: 0,
});

/*
 *
 * -> TileSetLimit         -> minTileCol: 8625, minTileRow: 10579, maxTileCol: 8973, maxTileRow: 10759
 * -> sparseFragmentBounds -> minTileCol: 8704, minTileRow: 10624, maxTileCol: 8767, maxTileRow: 10687
 *
 * */

const minTileCol = 8625;
const minTileRow = 10579;
const maxTileCol = 8973;
const maxTileRow = 10759;
const numTilesPerSide = 1 << 14;
const minX = (minTileCol / numTilesPerSide) * 360 - 180;
const minY = xyzIndexToLng(14, minTileRow) * -1;
const maxX = (maxTileCol / numTilesPerSide) * 360 - 180;
const maxY = xyzIndexToLng(14, maxTileRow) * -1;

const denseFragmentBounds = {
    minX: ((Math.floor(minTileCol / 64) * 64) / numTilesPerSide) * 360 - 180,
    minY: xyzIndexToLng(14, Math.floor(minTileRow / 64) * 64) * -1,
    maxX: ((Math.ceil(maxTileCol / 64) * 64) / numTilesPerSide) * 360 - 180,
    maxY: xyzIndexToLng(14, Math.ceil(maxTileRow / 64) * 64) * -1,
};

function calculateIndexFragments() {
    const minX = Math.floor(minTileCol / 64) * 64;
    const minY = Math.floor(minTileRow / 64) * 64;
    const maxX = Math.ceil(maxTileCol / 64) * 64;
    const maxY = Math.ceil(maxTileRow / 64) * 64;

    const fragments = [];
    const numColFragments = (maxX - minX) / 64;
    const numRowFragments = (maxY - minY) / 64;
    for (let i = 0; i < numRowFragments; i++) {
        for (let j = 0; j < numColFragments; j++) {
            const fragMinX = minX + j * 64;
            const fragMinY = minY + i * 64;
            const fragMaxX = fragMinX + 64 - 1;
            const fragMaxY = fragMinY + 64 - 1;
            const minTileX = (fragMinX / numTilesPerSide) * 360 - 180;
            const minTileY = xyzIndexToLng(14, fragMinY) * -1;
            const maxTileX = (fragMaxX / numTilesPerSide) * 360 - 180;
            const maxTileY = xyzIndexToLng(14, fragMaxY) * -1;

            const bounds = [
                [minTileX, minTileY],
                [maxTileX, minTileY],
                [maxTileX, maxTileY],
                [minTileX, maxTileY],
                [minTileX, minTileY],
            ];
            fragments.push(bounds);
        }
    }

    return fragments;
}

function xyzIndexToLng(zoom: number, xyzYIndex: number): number {
    const n = Math.PI - (2 * Math.PI * xyzYIndex) / Math.pow(2, zoom);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

map.on("load", function () {
    map.addSource("tileset-bounds", {
        type: "geojson",
        data: {
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [minX, minY],
                        [maxX, minY],
                        [maxX, maxY],
                        [minX, maxY],
                        [minX, minY],
                    ],
                ],
            },
        },
    });
    map.addLayer({
        id: "tileset-bounds",
        type: "fill",
        source: "tileset-bounds",
        layout: {},
        paint: {
            "fill-color": "#088",
            "fill-opacity": 0.5,
        },
    });
    /*map.addSource("sparse-bounds", {
        type: "geojson",
        data: {
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [denseFragmentBounds.minX, denseFragmentBounds.minY],
                        [denseFragmentBounds.maxX, denseFragmentBounds.minY],
                        [denseFragmentBounds.maxX, denseFragmentBounds.maxY],
                        [denseFragmentBounds.minX, denseFragmentBounds.maxY],
                        [denseFragmentBounds.minX, denseFragmentBounds.minY],
                    ],
                ],
            },
        },
    });
    map.addLayer({
        id: "sparse-bounds",
        type: "fill",
        source: "sparse-bounds",
        layout: {},
        paint: {
            "fill-color": "#ff0000",
            "fill-opacity": 0.8,
        },
    });*/

    const fragments = calculateIndexFragments();
    const features = fragments.map((fragment) => {
        return {
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: [fragment],
            },
        };
    });
    map.addSource("fragment-bounds", {
        type: "geojson",
        data: {
            type: "FeatureCollection",
            features: features,
        },
    });
    map.addLayer({
        id: "fragment-bounds",
        type: "fill",
        source: "fragment-bounds",
        layout: {},
        paint: {
            "fill-color": "#ff0000",
            "fill-opacity": 0.8,
        },
    });

    const x = 8705;
    const y = 10634;
    const lon = (x / numTilesPerSide) * 360 - 180;
    const lat = xyzIndexToLng(14, numTilesPerSide - y - 1);

    map.addSource("tile", {
        type: "geojson",
        data: {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [lon, lat],
            },
        },
    });
    map.addLayer({
        id: "tile",
        type: "circle",
        source: "tile",
        layout: {},
        paint: {
            "circle-radius": 6,
            "circle-color": "#B42222",
        },
    });
});
