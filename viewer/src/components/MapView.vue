<template>
  <div id="settings">
    <b>Visualize a space-filling curve with the specified method for the given zoom level and viewport</b><br>

    <div id ="options">
      <span>
        <b>Zoom &nbsp;</b>
        <select id="zoom" class="form-select" v-model="zoom" @change="onZooomChange(parseInt($event.target.value))" >
        <option>0</option>
        <option>1</option>
        <option>2</option>
        <option>3</option>
        <option>4</option>
        <option>5</option>
        <option>6</option>
        <option>7</option>
        <option>8</option>
        <option>9</option>
        <option>10</option>
        <option>11</option>
        <option>12</option>
        <option>13</option>
        <option>14</option>
      </select>
      </span>

      <span>
        <b>Space-filling curve &nbsp;</b>
        <select id="curve" v-model="curve" @change="onCurveChange($event.target.value)">
          <option>Hilbert</option>
          <option>Z-Order</option>
          <option>Row-Major</option>
        </select>
      </span>

      <span>
        <b>Display &nbsp;</b>
        <select id="display" v-model="display" @change="onDisplayChange($event.target.value)">
          <option>Index</option>
          <option>Range</option>
        </select>
      </span>
    </div>

    <b>NumTiles: {{ numTiles }} &nbsp; &nbsp;  Ranges: {{ ranges }}</b>
  </div>

  <div id="map"></div>
</template>

<script lang="ts">

import maplibregl from "maplibre-gl";
import {Options, Vue} from "vue-class-component";
import pointToIndex from "@/domain/zOrderCurve";
import tileCoordToIndex from "@/domain/rowMajorOrderCurve";
//import * as hilbertCurve from "hilbert-curve";
//TODO: fix
const hilbertCurve = (require as any)("hilbert-curve");

interface TileData{
  polygon: any;
  xIndex: number;
  yIndex: number;
  zIndex?: number;
  range?: number;
}

export default class MapView extends Vue {
  private static readonly INITIAL_ZOOM = 7;
  private map!: maplibregl.Map;

  //TODO: dynamic generate the zoom levels
  /*zoom!: HTMLSelectElement
  display!: HTMLSelectElement;
  curve!: HTMLSelectElement;*/
  //TODO: use values from outside

  zoom= "9";
  display= "Range";
  curve = "Z-Order";
  numTiles = 0;
  ranges = 0;

  mounted(){
    this.createMap();
  }

  createMap(){
    this.map = new maplibregl.Map({
      container: 'map',
      style: "https://api.maptiler.com/maps/basic/style.json?key=qgQRNu4u6W1Iakf5zWTz",
      center: [11.581981, 48.135125],
      zoom: MapView.INITIAL_ZOOM
    });

    const drawTiles = this.drawTiles.bind(this);
    this.map.on("load", () => {
      drawTiles(parseInt(this.zoom), this.curve, this.display);
    });
  }

  drawTiles(zoom: number, curve: string, display: string){
    const polygons = this.drawTileBounds(zoom, curve, display);

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
              index: `${polygon.range}/${polygon?.zIndex?.toString().substring(polygon.zIndex.toString().length-3)}`
            }
          };
      features.push(feature);
    }

    this.map.addSource("tiles", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features
      }
    });

    this.map.addLayer({
      'id': 'tiles',
      'type': 'fill',
      'source': 'tiles',
      'layout': {},
      'paint': {
        'fill-color': '#0080ff',
        'fill-opacity': 0.2
      }
    });

    this.map.addLayer({
      'id': 'outline',
      'type': 'line',
      'source': 'tiles',
      'layout': {},
      'paint': {
        'line-color': '#000',
        'line-width': 2
      }
    });

    this.map.addLayer({
      'id': 'range',
      'type': 'symbol',
      'source': 'tiles',
      'layout': {
        "text-field": display === "Range" ? ['get', 'range'] : ['get', 'zIndex'],
      },
    });
  }

  drawTileBounds(zoom: number, curve: string, display: string){
    /*
    * -> calculate index for lower bound and upper bound -> index in XYZ tiling scheme (Y axis direction down from the top) which corresponds to hilbert curve lib
    * -> calculate lng/lat coordinates for every tile
    * -> calculate the hilbert index for every tile
    */
    //const {_ne: ne, _sw: sw} = this.map.getBounds();
    const {_ne: ne, _sw: sw} = this.map.getBounds() as any;

    const swTile = this.getPolygon(zoom, sw.lng, sw.lat);
    const neTile = this.getPolygon(zoom, ne.lng, ne.lat);
    //const deltaX = neTile.xIndex - swTile.xIndex;
    //const deltaY = neTile.yIndex - swTile.yIndex;

    const tiles = [];
    const indices: number[] = [];
    for(let row = neTile.yIndex; row <= swTile.yIndex; row++){
      for(let column = swTile.xIndex; column <= neTile.xIndex; column++){
        const tile = this.getPolygonFromIndex(zoom, column, row);

        let zIndex = 0;
        if(curve === "Row-Major"){
          zIndex = tileCoordToIndex(tile.xIndex, tile.yIndex, zoom)
        }
        else if(curve === "Z-Order"){
          zIndex = pointToIndex(tile.xIndex, tile.yIndex, zoom)
        }
        else{
          zIndex = hilbertCurve.pointToIndex({ x: tile.xIndex, y: tile.yIndex }, zoom);
        }

        Object.assign(tile, {zIndex});
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
      Object.assign(tile, {range});
    }

    this.numTiles = tiles.length;
    this.ranges = range;

    return tiles;
  }

  //getPolygonFromIndex(zoom: number, xyzXIndex: number, xyzYIndex: number): {polygon: number[][][], xIndex: number, yIndex: number}{
  getPolygonFromIndex(zoom: number, xyzXIndex: number, xyzYIndex: number): TileData{
    const numTilesPerSide = 1 << zoom;
    const tileSizeLng = 360 / numTilesPerSide;

    //TODO: check formula -> tileInde also has to be converted back to WGS84
    const polygon = [[  [xyzXIndex * tileSizeLng - 180, this.xyzIndexToLng(zoom, xyzYIndex)], //nw
      [xyzXIndex * tileSizeLng - 180, this.xyzIndexToLng(zoom, xyzYIndex +1)], //sw
      [(xyzXIndex+1) * tileSizeLng - 180, this.xyzIndexToLng(zoom, xyzYIndex +1)], //se
      [(xyzXIndex+1) * tileSizeLng - 180, this.xyzIndexToLng(zoom, xyzYIndex)], //ne
      [xyzXIndex * tileSizeLng - 180, this.xyzIndexToLng(zoom, xyzYIndex)] //nw
      //[xyzXIndex * tileSizeLng - 180, (xyzYIndex * tileSizeLng - 90) * -1] //nw
    ]];

    return {polygon, xIndex: xyzXIndex, yIndex: xyzYIndex};
  }

  getPolygon(zoom: number, lng: number, lat: number){
    const numTilesPerSide = 1 << zoom;
    const tileSizeLng = 360 / numTilesPerSide;
    const tileSizeLat = 180 / numTilesPerSide;

    const xyzXIndex = Math.floor((lng + 180) / tileSizeLng);
    //const xyzYIndex = Math.floor((sw.lat * -1 + 90) / tileSizeLat); //xyz tiling scheme
    const mercatorY = (180 - (180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)))) / 360; // normalized to 0 .... 1
    const xyzYIndex = Math.floor(mercatorY / (1 / numTilesPerSide));
    const tmsIndex = numTilesPerSide - xyzYIndex;

    //TODO: check formula -> tileIndex also has to be converted back to WGS84
    const polygon = [[  [xyzXIndex * tileSizeLng - 180, this.xyzIndexToLng(zoom, xyzYIndex)], //nw
      [xyzXIndex * tileSizeLng - 180, this.xyzIndexToLng(zoom, xyzYIndex +1)], //sw
      [(xyzXIndex+1) * tileSizeLng - 180, this.xyzIndexToLng(zoom, xyzYIndex +1)], //se
      [(xyzXIndex+1) * tileSizeLng - 180, this.xyzIndexToLng(zoom, xyzYIndex)], //ne
      [xyzXIndex * tileSizeLng - 180, this.xyzIndexToLng(zoom, xyzYIndex)] //nw
      //[xyzXIndex * tileSizeLng - 180, (xyzYIndex * tileSizeLng - 90) * -1] //nw
    ]];

    return {polygon, xIndex: xyzXIndex, yIndex: xyzYIndex};
  }

  xyzIndexToLng(zoom: number, xyzYIndex: number): number{
    const n=Math.PI-2*Math.PI*xyzYIndex /Math.pow(2,zoom);
    return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
  }

  onZooomChange(zoom: number){
    this.map.removeLayer("tiles");
    this.map.removeLayer("outline");
    this.map.removeLayer("range");
    this.map.removeSource("tiles");

    //TODO: use direct binding
    this.drawTiles(zoom, this.display, this.curve);
  }

  onCurveChange(curve: string){
    this.map.removeLayer("tiles");
    this.map.removeLayer("outline");
    this.map.removeLayer("range");
    this.map.removeSource("tiles");

    //TODO: use direct binding
    this.drawTiles(parseInt(this.zoom), curve, this.display);
  }

  onDisplayChange(display: string){
    this.map.removeLayer("tiles");
    this.map.removeLayer("outline");
    this.map.removeLayer("range");
    this.map.removeSource("tiles");

    //TODO: use direct binding
    this.drawTiles(parseInt(this.zoom), this.curve, display);
  }
}
</script>

<style scoped>
#map { position: absolute; top: 0; bottom: 0; width: 100%;}
#settings { position: fixed; z-index: 2; padding: 20px; background: rgba(204, 204, 204, 0.8); top: 5px; left: 15px; border-radius: 5px;}
#options {display: flex; justify-content: space-between;margin: 0 auto;padding: 10px 0;}
span {
  width: 250px;
}
</style>