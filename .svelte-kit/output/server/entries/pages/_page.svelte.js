import { c as create_ssr_component, e as escape } from "../../chunks/index.js";
import { p as public_env } from "../../chunks/shared.js";
import { Style, RegularShape, Fill, Stroke, Icon } from "ol/style.js";
import Stamen from "ol/source/Stamen.js";
import XYZ from "ol/source/XYZ.js";
import VectorSource from "ol/source/Vector.js";
import TileLayer from "ol/layer/Tile.js";
import VectorLayer from "ol/layer/Vector.js";
import LayerGroup from "ol/layer/Group.js";
import "ol/proj.js";
const ol = "";
const olExt = "";
const style = "";
const _page_svelte_svelte_type_style_lang = "";
const css = {
  code: "main.svelte-11lw3ju.svelte-11lw3ju{display:flex}#map.svelte-11lw3ju.svelte-11lw3ju{height:100vh}#panel-btn.svelte-11lw3ju.svelte-11lw3ju{position:absolute;top:.5em;right:.5em;width:35px;height:1.5em;text-align:center;z-index:1000}#panel-btn.svelte-11lw3ju button.svelte-11lw3ju{color:#666666;background:white;border-radius:4px;border:1px solid rgba(255, 255, 255, 0.75);cursor:pointer;width:35px;font-size:1.2em}#panel-btn.svelte-11lw3ju button.svelte-11lw3ju:hover{color:#333333;border-color:#333333}#layer-panel.svelte-11lw3ju.svelte-11lw3ju{display:flex;flex-direction:column;color:#333333;width:250px;max-width:100%;max-height:100vh;background:white;border-right:1px solid #333333;align-items:center;z-index:999;overflow-y:scroll}.logo-header.svelte-11lw3ju.svelte-11lw3ju{padding:10px}.logo-img.svelte-11lw3ju.svelte-11lw3ju{max-width:100%}.layer-section.svelte-11lw3ju.svelte-11lw3ju{margin-bottom:5px}.layer-item-list.svelte-11lw3ju.svelte-11lw3ju{overflow-y:scroll;padding:0px 10px}.panel-content.svelte-11lw3ju ul.svelte-11lw3ju{list-style:none;padding-left:0px}.panel-content.svelte-11lw3ju button.svelte-11lw3ju{border:none;background:none;text-align:left;cursor:pointer}.panel-content.svelte-11lw3ju button.layer-header.svelte-11lw3ju{border:none;background:#597544;color:white;font-size:1.25em;width:100%;padding:5px;text-align:center}.panel-content.svelte-11lw3ju button.zoom-to.svelte-11lw3ju{border:none;font-weight:300;width:unset;font-size:1em}.panel-content.svelte-11lw3ju button.zoom-to.svelte-11lw3ju:hover{text-decoration:underline}.about-modal-bg.svelte-11lw3ju.svelte-11lw3ju{position:absolute;background:rgba(255, 255, 255, .6);z-index:999999;height:100vh;width:100%}.about-modal-content.svelte-11lw3ju.svelte-11lw3ju{position:absolute;background:white;border-radius:4px;top:3em;right:0;left:0;margin:auto;width:400px;max-width:80%;padding:10px;display:flex;flex-direction:column;align-items:center}.panel-content.svelte-11lw3ju.svelte-11lw3ju{width:100%}",
  map: null
};
const mbk = "pk.eyJ1IjoibGVnaW9uZ2lzIiwiYSI6ImNsYmNvazRvdTB2YWQzdm50YzRmcG5wYjAifQ.eOGJmZJHrXLo46_yTdftqQ";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  public_env.PUBLIC_GOOGLE_SHEET_ID;
  public_env.PUBLIC_GOOGLE_API_KEY;
  const sponsorStyle = new Style({
    image: new RegularShape({
      fill: new Fill({ color: "#ff5a34" }),
      stroke: new Stroke({ color: "rgba(50, 50, 50, 0.8)", width: 2 }),
      points: 5,
      radius: 12,
      radius2: 6,
      angle: 0
    })
  });
  new VectorLayer({
    source: new VectorSource(),
    style: sponsorStyle,
    zIndex: 1
  });
  new VectorLayer({
    source: new VectorSource(),
    style(feature) {
      return new Style({
        image: new Icon({
          anchor: [0.5, 46],
          anchorXUnits: "fraction",
          anchorYUnits: "pixels",
          src: "/icons/stop-icon-" + feature.get("Number") + ".png",
          scale: 0.28
        })
      });
    },
    zIndex: 2
  });
  ({
    id: "mbSatellite",
    layer: new TileLayer({
      source: new XYZ({
        url: "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/{z}/{x}/{y}?access_token=" + mbk,
        tileSize: 512
      })
    })
  });
  ({
    id: "mbOutdoors",
    layer: new TileLayer({
      source: new XYZ({
        url: "https://api.mapbox.com/styles/v1/legiongis/cldf5vrjm000w01pasy9x4lwm/tiles/{z}/{x}/{y}?access_token=" + mbk,
        tileSize: 512
      }),
      zIndex: 0
    })
  });
  const watercolor = {
    id: "watercolor",
    layer: new TileLayer({
      source: new Stamen({ layer: "watercolor" })
    })
  };
  ({
    id: "watercolorLabels",
    layer: new LayerGroup({
      layers: [
        watercolor.layer,
        new TileLayer({
          source: new Stamen({ layer: "terrain-labels" })
        })
      ],
      zIndex: 0
    })
  });
  ({
    id: "stamenTerrain",
    layer: new TileLayer({
      source: new Stamen({ layer: "terrain" }),
      zIndex: 0
    })
  });
  let layerBtnLabel;
  $$result.css.add(css);
  {
    layerBtnLabel = "×";
  }
  return `${``}
<main class="${"svelte-11lw3ju"}">${`<div id="${"layer-panel"}" class="${"svelte-11lw3ju"}"><div class="${"logo-header svelte-11lw3ju"}"><h1 hidden="${"true"}">Winding Roads Art Tour</h1>
            <img class="${"logo-img svelte-11lw3ju"}" src="${"/logo_green.png"}" alt="${"Winding Roads Art Tour logo"}"></div>
        <div class="${"layer-section svelte-11lw3ju"}"><button>learn more</button></div>
        
        <div class="${"panel-content svelte-11lw3ju"}"><div class="${"layer-section svelte-11lw3ju"}"><div><button class="${"layer-header svelte-11lw3ju"}">Visit our sponsors! <!-- HTML_TAG_START -->${"&blacktriangleright;"}<!-- HTML_TAG_END --></button></div>
                ${``}</div>
            <div class="${"layer-section svelte-11lw3ju"}"><div><button class="${"layer-header svelte-11lw3ju"}">Tour Stops <!-- HTML_TAG_START -->${"&blacktriangleright;"}<!-- HTML_TAG_END --></button></div>
                ${``}</div></div></div>`}
    <div id="${"map"}" class="${"svelte-11lw3ju"}"></div></main>
<div id="${"panel-btn"}" class="${"svelte-11lw3ju"}"><button style="${escape("border-color:#333; color:#333;", true) + ";"}" class="${"svelte-11lw3ju"}">${escape(layerBtnLabel)}</button></div>`;
});
export {
  Page as default
};
