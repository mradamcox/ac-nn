<script>
    import 'ol/ol.css';
    import 'ol-ext/dist/ol-ext.css';
    import '../style.css';

    import { env } from '$env/dynamic/public';
    import { onMount } from 'svelte';

    import Map from 'ol/Map';
    import View from 'ol/View';
    import {getCenter} from 'ol/extent';
    import Feature from 'ol/Feature';
    import {
        Circle,
        Fill,
        RegularShape,
        Stroke,
        Style,
        Text,
        Icon,
    } from 'ol/style.js';

    
    import Stamen from 'ol/source/Stamen.js';
    import XYZ from 'ol/source/XYZ';
    import VectorSource from 'ol/source/Vector';
    
    import TileLayer from 'ol/layer/Tile';
    import VectorLayer from 'ol/layer/Vector';
    import LayerGroup from 'ol/layer/Group';
    
    import WKT from 'ol/format/WKT';
    import Point from 'ol/geom/Point.js';
    import {fromLonLat, toLonLat} from 'ol/proj.js';
    import {containsCoordinate, extend} from 'ol/extent';

    const spreadsheetId = env.PUBLIC_GOOGLE_SHEET_ID;
    const googleApiKey = env.PUBLIC_GOOGLE_API_KEY;

    const apiUrl = 'https://sheets.googleapis.com/v4/spreadsheets/'

    function getStyle(feature, resolution) {
        const props = feature.getProperties()

        const fill = new Fill({
            color: 'rgba(255,255,255,0.4)',
        });
        const stroke = new Stroke({
            color: '#3399CC',
            width: 1.25,
        });
        console.log(props)
        if (props.styleId === "redstar") {
            return new Style({
                image: new RegularShape({
                    fill: new Fill({
                        color: '#ff5a34',
                    }),
                    stroke: new Stroke({
                        color: 'rgba(50, 50, 50, 0.8)',
                        width: 2,
                    }),
                    points: 5,
                    radius: 12,
                    radius2: 6,
                    angle: 0,
                }),
                text: new Text({
                    text: props.name
                })
            })
        } else if (props.styleId === "annotation") {
            return new Style({
                text: new Text({
                    text: props.name
                })
            })
        } else {
            return new Style({
                image: new Circle({
                    fill: fill,
                    stroke: stroke,
                    radius: 5,
                }),
                fill: fill,
                stroke: stroke,
            })
        }
    }
    
    const config = {}
    function getConfig() {
        const url = apiUrl + spreadsheetId + "/values/Config?key=" + googleApiKey
        return fetch(url)
            .then(response => response.json())
            .then(result => {
                result.values.forEach( function (row) {
                    config[row[0]] = row[1]
                });
            })
            .catch(error => {
                console.error("hmmmmm, what's wrong??:", error);
            })
        }
    getConfig()
        
    const layerLookup = {}
    async function getLayerList() {
        const url = apiUrl + spreadsheetId + "/values/LayerList?key=" + googleApiKey
        return fetch(url)
            .then(response => response.json())
            .then(result => {
                const headers = result.values.shift();
                result.values.forEach( function (row) {
                    const [id, name, desc, isActive, isVisible, isTogglable, isAnnotation, styleId] = row
                    if (id && isActive === "TRUE") {
                        layerLookup[id] = {
                            id: id,
                            displayName: name,
                            description: desc,
                            isVisible: isVisible === "TRUE",
                            isAnnotation: isAnnotation === "TRUE",
                            layer: new VectorLayer({
                                source: new VectorSource(),
                                style: getStyle,
                            }),
                            featureList: [],
                            styleId: styleId,
                        }
                        // if (styleId in styles) {
                        //     layerLookup[id].layer.setStyle(styles[styleId])
                        // }
                    }
                })
            })
            .catch(error => {
                console.error("hmmmmm, what's wrong??:", error);
            })
    }
    $: {
        Object.keys(layerLookup).forEach( function (layerId) {
            layerLookup[layerId].layer.setVisible(layerLookup[layerId].isVisible)
        })
    }

    async function makeLayers() {
        Object.keys(layerLookup).forEach ( function (layerId) {
            const url = apiUrl + spreadsheetId + "/values/" + layerId + "?key=" + googleApiKey
            return fetch(url)
                .then(response => response.json())
                .then(result => {
                    const headers = result.values.shift();
                    result.values.forEach( function (row) {
                        const [wkt, name, desc, imgUrl, styleId] = row
                        const feature = new WKT().readFeature(wkt, {
                            dataProjection: 'EPSG:4326',
                            featureProjection: 'EPSG:3857',
                        })
                        const props = {
                            name:name,
                            desc:desc,
                            imgUrl:imgUrl,
                            extent: feature.getGeometry().getExtent(),
                            styleId: styleId ? styleId : layerLookup[layerId].styleId,
                        }
                        feature.setProperties(props)
                        layerLookup[layerId].layer.getSource().addFeature(feature)
                        layerLookup[layerId].featureList.push(props)
                    })
                })
                .catch(error => {
                    console.error("hmmmmm, what's wrong??:", error);
                })
        })
    }

    const mbk = env.PUBLIC_MAPBOX_TOKEN
    const mbSatellite = {
        id: 'mbSatellite',
        layer: new TileLayer({
            source: new XYZ({
                url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/{z}/{x}/{y}?access_token='+mbk,
                tileSize: 512,
            })
        })
    }
    const mbOutdoors = {
        id: 'mbOutdoors',
        layer: new TileLayer({
            source: new XYZ({
                url: 'https://api.mapbox.com/styles/v1/legiongis/cldf5vrjm000w01pasy9x4lwm/tiles/{z}/{x}/{y}?access_token='+mbk,
                tileSize: 512,
            }),
            zIndex: 0,
        })
    }

    const watercolor = {
        id: 'watercolor',
        layer: new TileLayer({
            source: new Stamen({
                layer: 'watercolor',
            }),
        })
    }

    const watercolorLabels = {
        id: 'watercolorLabels',
        layer: new LayerGroup({
            layers: [
                watercolor.layer,
                new TileLayer({
                    source: new Stamen({
                        layer: 'terrain-labels',
                    }),
                }),
            ],
            zIndex: 0,
        })
    }
    const stamenTerrain = {
        id: 'stamenTerrain',
        layer: new TileLayer({
            source: new Stamen({
                layer: 'terrain',
            }),
            zIndex: 0,
        })
    }
    const basemaps = [
        mbOutdoors,
        watercolorLabels,
        stamenTerrain,
    ]
    function setBasemap(map, layerId) {
        basemaps.forEach( function (layerDef) {
            if (layerDef.id == layerId){
                map.addLayer(layerDef.layer)
            } else {
                map.removeLayer(layerDef.layer)
            }
        })
    }

    let showAboutPanel = false;
    let showLayerPanel = true;
    let layerBtnLabel;
    $: showLayerPanel ? layerBtnLabel = "×" : layerBtnLabel = "i"

    function zoomAndPopup(featureProps) {
        if (map) {
            const resolution = map.getView().getResolutionForExtent(featureProps.extent);
            const zoom = map.getView().getZoomForResolution(resolution) > 15 ? map.getView().getZoomForResolution(resolution) : 15;
            const center = getCenter(featureProps.extent);
            map.getView().animate({
                center: center,
                zoom: zoom,
            })
            handlePopup(featureProps)
            popupSponsor.hide();
            popupStudio.hide();
            if (featureProps.source == "2023-sponsors") {
                handleSponsorPopup(featureProps)
            } else if (featureProps.source == "2023-studios") {
                handleStudioPopup(featureProps)
            }
        }
    }

    function handlePopup (featureProps) {
        let popContent = `<h2>${featureProps.name}</h2>`
        if (featureProps.imgUrl) { popContent+= `<img src=${featureProps.imgUrl} style="width:100%" />`}
        popContent+= `<p><em>${featureProps.desc}</em></p>`
        const coords = getCenter(featureProps.extent)
        console.log(coords)
        const coords84 = toLonLat(coords)
        const latLonStr = `${coords84[1]},${coords84[0]}`
        popContent = popContent + `<p>
            <em><a href="https://www.google.com/maps/dir//${latLonStr}/" target="_blank">get directions &rarr;</a>
            </em></p>`
        popup.show(coords, popContent);
    }

    let map;
    let popup;
    async function initMap() {
        map = new Map({
            target: document.getElementById('map'),
            layers: [
                basemaps[0].layer,
            ],
            view: new View({
                center: fromLonLat([-90.092583,29.980209]),
                // center: transform([-90.092583,29.980209], 'EPSG:4326', 'EPSG:3857');,
                zoom: 16,
            }),
            overlays: [popup]
        });
        // setBasemap(map, 'mbOutdoors')
        await getLayerList();
        await makeLayers();

        Object.keys(layerLookup).forEach( function (layerId) {
            map.addLayer(layerLookup[layerId].layer)
        })
        // const fullExtent = layerLookup['saturday'].layer.getSource().getExtent();
        // extend(fullExtent, sponsorLayer.getSource().getExtent())
        // map.getView().fit(fullExtent, {padding: [50,50,50,50]});
        // change mouse cursor when over marker
        map.on('pointermove', function (e) {
            const pixel = map.getEventPixel(e.originalEvent);
            const hit = map.hasFeatureAtPixel(pixel);
            map.getTarget().style.cursor = hit ? 'pointer' : '';
        });
        // display popup on click
        map.on('click', function (evt) {
            popup.hide();
            const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
                return feature;
            });
            if (feature) {
                zoomAndPopup(feature.getProperties())
            }
            const lon = Number.parseFloat(toLonLat(evt.coordinate)[0]).toFixed(6);
            const lat = Number.parseFloat(toLonLat(evt.coordinate)[1]).toFixed(6);
            console.log(`${lon},${lat}`);
            console.log(`zoom: ${map.getView().getZoom()}`);
        });
        return map
    }

    let mapEl;
    $: {
        if (mapEl) {
            if (showLayerPanel) {
                document.getElementById("map").style.width = "calc(100% - 250px)"
            } else {
                document.getElementById("map").style.width = "100%"
            }
        }
    }

    onMount(async () => {
        
        // Tried a lot of different methods for creating a popup, ended
        // up with this one from ol-ext.
        // HOWEVER: this import must happen here because the Popup
        // lib uses the global `window` variable (in ol-ext/utils/input/Base.js).
        // Importing at the top of the file causes npm run build to fail with
        // a 'window is not defined' error.
        const Popup = (await import('ol-ext/overlay/Popup')).default;
        popup = new Popup ({
            popupClass: "shadow", //"tooltips", "warning" "black" "default", "tips", "shadow",
            closeBox: false,
            autoPan: {
                animation: {
                    duration: 100
                }
            }
        });
        await initMap()
        mapEl = document.getElementById("map");
    });

</script>
{#if showAboutPanel}
<div class="about-modal-bg">
    <div class="about-modal-content">
        <h1>{config.infoBoxHeader}</h1>
        <p>{@html config.infoBoxContent}</p>
        <button on:click={() => {showAboutPanel=false}}>close</button>
    </div>
</div>
{/if}
<main>
    {#if showLayerPanel}
    <div id="layer-panel">
        <div class="logo-header">
            <h1 hidden=true>AC / NN</h1>
            <img class="logo-img" src="/image.png" alt="ac+nn"/>   
        </div>
        <div class="layer-section" style="margin-bottom: 15px;">
            <button on:click={() => {showAboutPanel=true}}>{config.infoBoxLabel ? config.infoBoxLabel : 'loading...'}</button>
        </div>
        <div>
            <!-- <p>Basemap testing
            <button on:click={() => {setBasemap('mbOutdoors')}}>1</button>
            <button on:click={() => {setBasemap('stamenTerrain')}}>2</button>
            <button on:click={() => {setBasemap('watercolorLabels')}}>3</button>
            </p> -->
        </div>
        <div class="panel-content">
            {#each Object.entries(layerLookup) as [layerId, layerDef]}
            {#if layerDef.isAnnotation != true}
            <div class=layer-section>
                <div><button class="layer-header" on:click={() => {layerDef.isVisible=!layerDef.isVisible}}>{layerDef.displayName} {@html layerDef.isVisible ? '&blacktriangledown;' : '&blacktriangleright;'}</button></div>
                {#if layerDef.isVisible}
                <div class="layer-description">{layerDef.description}</div>
                <div class="layer-item-list">
                    <ul>
                        {#each layerDef.featureList as f}
                        <li>
                            <button class="zoom-to" on:click={() => {zoomAndPopup(f)}}><strong>{f.name}</strong></button>
                        </li>
                        {/each}
                    </ul>
                </div>
                {/if}
            </div>
            {/if}
            {/each}
        </div>
    </div>
    {/if}
    <div id="map"></div>
</main>
<div id="panel-btn"><button on:click={() => {showLayerPanel=!showLayerPanel}} style="{showLayerPanel ? 'border-color:#333; color:#333;' : ''};">{layerBtnLabel}</button></div>
<style>

    main {
        display: flex;
    }
    #map {
        height: 100vh;
    }
    #panel-btn {
        position: absolute;
        top: .5em;
        right: .5em;
        width: 35px;
        height: 1.5em;
        text-align: center;
        z-index: 1000;
    }

    #panel-btn button {
        color: #666666;
        background: white;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.75);
        cursor: pointer;
        width: 35px;
        font-size: 1.2em;
    }

    #panel-btn button:hover {
        color: #333333;
        border-color: #333333;
    }

    #layer-panel {
        display: flex;
        flex-direction: column;
        color: #333333;
        width: 250px;
        max-width: 100%;
        max-height: 100vh;
        background-color: rgb(232, 222, 210);
        border-right: 2px solid rgb(61, 64, 143);
        align-items: center;
        z-index: 999;
        overflow-y:scroll;
    }

    .logo-header {
        padding: 10px;
    }

    .logo-img {
        max-width: 100%;
    }

    .layer-section {
        margin-bottom: 5px;
    }

    .layer-description {
        padding: 5px;
    }

    .layer-item-list {
        padding: 0px 10px;
    }

    .panel-content ul {
        list-style: none;
        padding-left: 0px;
    }
    
    .panel-content button {
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
    }

    .panel-content button.layer-header {
        border: none;
        background: rgb(61, 64, 143);
        color: rgb(232, 222, 210);
        font-size: 1.25em;
        width: 100%;
        padding: 5px;
        text-align: center;
    }
    
    .panel-content button.zoom-to {
        border: none;
        font-weight: 300;
        width: unset;
        font-size: 1em;
    }
    .panel-content button.zoom-to:hover {
        text-decoration: underline;
    }

    .about-modal-bg {
        position: absolute;
        background: rgba(255, 255, 255, .6);
        z-index: 999999;
        height: 100vh;
        width: 100%;
    }
    .about-modal-content {
        position: absolute;
        background: rgb(232, 222, 210);
        border-radius: 4px;
        top: 3em;
        right: 0;
        left: 0;
        margin: auto;
        width: 400px;
        max-width: 80%;
        padding: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        border-radius: 4px;
        border: 2px solid #494583;
    }

    .about-modal-content p {
        margin: 0 0 15px 0;
    }

    .panel-content {
        width: 100%;
    }

    :global(.ol-popup ) {
        background: rgb(232, 222, 210);
        outline: 1px solid rgb(61, 64, 143);
    }
        
    /*
    .ol-popup:after, .ol-popup:before {
        top: 100%;
        border: solid transparent;
        content: " ";
        height: 0;
        width: 0;
        position: absolute;
        pointer-events: none;
    }
    .ol-popup:after {
        border-top-color: white;
        border-width: 10px;
        left: 48px;
        margin-left: -10px;
    }
    .ol-popup:before {
        border-top-color: #cccccc;
        border-width: 11px;
        left: 48px;
        margin-left: -11px;
    }
    .ol-popup-closer {
        text-decoration: none;
        position: absolute;
        top: 2px;
        right: 8px;
    }
    .ol-popup-closer:after {
        content: "✖";
    } */
</style>
