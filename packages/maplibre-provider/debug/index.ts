import maplibregl from "maplibre-gl";
import { MapLibreComtProvider, TileFetchStrategy } from "../src/index";

MapLibreComtProvider.register(TileFetchStrategy.SINGLE);

const map = new maplibregl.Map({
    container: "map",
    style: "http://localhost:4711/assets/style.json",
    center: [16.335668227571986, 48.18343081801389],
    zoom: 0,
});

map.addControl(new maplibregl.NavigationControl({}));
