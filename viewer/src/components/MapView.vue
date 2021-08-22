<template>
  <div id="settings">
    <b>Visualize a space-filling curve with the specified method for the given zoom level and viewport</b><br>

    <div id ="options">
      <span>
        <b>Zoom &nbsp;</b>
        <select id="zoom" v-model="zoom" @change="onZooomChange(parseInt($event.target.value))" >
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
        <select id="curve" v-model="curve">
          <option>Hilbert</option>
          <option>Z-Order</option>
          <option>Row-Major</option>
        </select>
      </span>

      <span>
        <b>Display &nbsp;</b>
        <select id="display" v-model="display">
          <option>Index</option>
          <option>Range</option>
        </select>
      </span>
    </div>
  </div>

  <div id="map"></div>
</template>

<script lang="ts">
import maplibregl from "maplibre-gl";
import {Options, Vue} from "vue-class-component";

@Options({
  props: {
    zoom: Number,
    display: String,
    curve: String,
  },
})
export default class MapView extends Vue {
  //TODO: dynamic generate the zoom levels
  zoom!: number;
  display!: string;
  curve!: string;

  mounted(){
    console.log("mounted");

    const map = new maplibregl.Map({
      container: 'map',
      style: "https://api.maptiler.com/maps/basic/style.json?key=qgQRNu4u6W1Iakf5zWTz",
      center: [11.581981, 48.135125],
      zoom: 7 //zoom
    });
  }

  onZooomChange(zoom: number){
    console.log(zoom);
    console.log(typeof zoom);
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