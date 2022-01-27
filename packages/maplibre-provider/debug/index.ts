import maplibregl from "maplibre-gl";
import registerComtHandler from "../src/index";

registerComtHandler();

const map = new maplibregl.Map({
    container: "map",
    style: "http://localhost:4711/assets/style.json",
    //center: [8.529727, 47.371622],
    center: [16.335668227571986, 48.18343081801389],
    zoom: 0,
});
