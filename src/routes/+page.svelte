<script>
    import 'ol/ol.css';
    import 'ol-ext/dist/ol-ext.css';
    import '../style.css';

    import { env } from '$env/dynamic/public';
    import { onMount } from 'svelte';

    import Map from 'ol/Map';
    import View from 'ol/View';
    import {getBottomLeft, getCenter} from 'ol/extent';
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
    import { construct_svelte_component } from 'svelte/internal';

    const spreadsheetId = env.PUBLIC_GOOGLE_SHEET_ID;
    const googleApiKey = env.PUBLIC_GOOGLE_API_KEY;

    const apiUrl = 'https://sheets.googleapis.com/v4/spreadsheets/'

    let showAboutPanel = true;
    let showLayerPanel = true;
    let layerBtnLabel;
    $: showLayerPanel ? layerBtnLabel = "×" : layerBtnLabel = "i"

    let modalHeader = "...";
    let modalContent = "...";
    function openModal(header, content) {
        modalHeader = header;
        modalContent = content;
        showAboutPanel = true;
    }

    function getStyle(feature, resolution) {
        const props = feature.getProperties()

        const mainRed = '#ff5a34';
        const darkRed = 'rgba(123, 30, 39, .5)'
        const teal = 'rgb(16, 196, 162)'
        const fill = new Fill({
            color: 'rgba(255,255,255,0.4)',
        });
        const stroke = new Stroke({
            color: teal,
            width: 1.75,
        });
        console.log("getting style")
        console.log(props)
        if (props.styleId === "redstar") {
            return new Style({
                image: new RegularShape({
                    fill: new Fill({
                        color: mainRed,
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
                    text: props.name,
                    offsetY: -20,
                    font: "bold 20px sans-serif",
                    stroke: new Stroke({
                        color: "white",
                        width: 2,
                    }),
                })
            })
        } else if (props.styleId === "annotation") {
            return new Style({
                text: new Text({
                    text: props.name
                })
            })
        } else if (props.styleId === "reddashline") {
            return new Style({
                stroke: new Stroke({
                    color: mainRed,
                    width: 3,
                    lineDash: [4,8]
                }),
            })
        } else if (props.styleId === "ccc") {
            return new Style({
                stroke: new Stroke({
                    color: darkRed,
                    width: 3,
                }),
            })
        } else {
            return new Style({
                image: new Circle({
                    fill: new Fill({
                        color: 'rgba(50,50,255)',
                    }),
                    stroke: stroke,
                    radius: 5,
                }),
                // fill: fill,
                // stroke: stroke,
                text: new Text({
                    text: props.name,
                    offsetY: -12,
                    font: "bold 12px sans-serif",
                    stroke: new Stroke({
                        color: "white",
                        width: 2,
                    }),
                })
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
                modalHeader = config.infoBoxHeader;
                modalContent = config.infoBoxContent;
            })
            .catch(error => {
                console.error("hmmmmm, what's wrong??:", error);
            })
        }
    getConfig()
        
    const layerList = [];
    async function getLayerList() {
        const url = apiUrl + spreadsheetId + "/values/LayerList?key=" + googleApiKey
        return fetch(url)
            .then(response => response.json())
            .then(result => {
                const headers = result.values.shift();
                result.values.forEach( function (row) {
                    const [id, name, desc, isActive, isVisible, isTogglable, isAnnotation, styleId, zIndex] = row
                    if (id && isActive === "TRUE") {
                        const layer = new VectorLayer({
                            source: new VectorSource(),
                            style: getStyle,
                            zIndex: zIndex ? zIndex : 10,
                        })
                        layerList.push({
                            id: id,
                            displayName: name,
                            description: desc,
                            isVisible: isVisible === "TRUE",
                            isAnnotation: isAnnotation === "TRUE",
                            layer: layer,
                            featureList: [],
                            styleId: styleId,
                            extent: layer.getSource().extent,
                        })
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
            if (layerLookup[layerId].isTogglable) {
                layerLookup[layerId].layer.setVisible(layerLookup[layerId].isVisible)
            }
        })
    }

    const layerLookup = {}
    let panelList = [];
    async function makeLayers() {
        const localList = [];
        layerList.forEach ( function (layerDef) {
            const url = apiUrl + spreadsheetId + "/values/" + layerDef.id + "?key=" + googleApiKey
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
                        styleId: styleId ? styleId : layerDef.styleId,
                    }
                    feature.setProperties(props)
                    layerDef.layer.getSource().addFeature(feature)
                    layerDef.featureList.push(props)
                })
                layerLookup[layerDef.id] = layerDef
                localList.push(layerDef)
                // sortedLayers = Object.entries(layerLookup).map(a => layerLookup[a]);
            })
            .catch(error => {
                console.error("hmmmmm, what's wrong??:", error);
            })
        })
        console.log(localList)
        panelList = localList
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

    function zoomToLayer(layer) {
        map.getView().fit(layer.getSource().getExtent(), {padding:[150,150,150,150], duration:1000})
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
        console.log("adsf")
        console.log(panelList)

        // Object.keys(layerLookup).forEach( function (layerId) {
        layerList.forEach( function (layerDef) {
            map.addLayer(layerDef.layer)
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
            console.log(`POINT (${lon} ${lat})`);
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
            },
            positioning: "bottom",
            offsetBox: [20, -20],
        });
        await initMap()
        mapEl = document.getElementById("map");
        // document.getElementById('modal-bg').onclick(() => {showAboutPanel=false});
    });

</script>
{#if showAboutPanel}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div id="modal-bg" on:click={() => {showAboutPanel=false}} class="about-modal-bg">
    <div class="about-modal-content" on:click={{}}>
        <h1>{modalHeader}</h1>
        <p>{@html modalContent}</p>
        <button on:click={() => {showAboutPanel=false}}>close</button>
    </div>
</div>
{/if}
<main>
    {#if showLayerPanel}
    <div id="layer-panel">
        <div class="logo-header">
            <h1 style="font-size:3em;">AC💍NN</h1> 
        </div>
        <div class="layer-section" style="margin-bottom: 15px;">
            <button on:click={() => {openModal(config.infoBoxHeader, config.infoBoxContent)}}>{config.infoBoxLabel ? config.infoBoxLabel : 'loading...'}</button>
        </div>
        <div>
            <!-- <p>Basemap testing
            <button on:click={() => {setBasemap('mbOutdoors')}}>1</button>
            <button on:click={() => {setBasemap('stamenTerrain')}}>2</button>
            <button on:click={() => {setBasemap('watercolorLabels')}}>3</button>
            </p> -->
        </div>
        <div class="panel-content">
            {#if layerLookup['friday']}
            <div class=layer-section>
                <div class="layer-header">
                    <button class="zoom-to-layer" on:click={() => {zoomToLayer(layerLookup['friday'].layer)}}>{layerLookup['friday'].displayName}</button>
                    <button on:click={() => {zoomToLayer(layerLookup['friday'].layer)}}>ZOOM</button>
                    <button on:click={() => {openModal(layerLookup['friday'].displayName, layerLookup['friday'].description)}}>MORE INFO</button>
                </div>
                {#if layerLookup['friday'].isVisible}
                <div class="layer-item-list">
                    <ul>
                        {#each layerLookup['friday'].featureList as f}
                        <li>
                            <button class="zoom-to" on:click={() => {zoomAndPopup(f)}}><strong>{f.name}</strong></button>
                        </li>
                        {/each}
                    </ul>
                </div>
                {/if}
            </div>
            {/if}
            {#if layerLookup['saturday']}
            <div class=layer-section>
                <div class="layer-header">
                    <button class="zoom-to-layer" on:click={() => {zoomToLayer(layerLookup['saturday'].layer)}}>{layerLookup['saturday'].displayName}</button>
                    <button on:click={() => {zoomToLayer(layerLookup['saturday'].layer)}}>ZOOM</button>
                    <button on:click={() => {openModal(layerLookup['saturday'].displayName, layerLookup['saturday'].description)}}>MORE INFO</button>
                </div>
                {#if layerLookup['saturday'].isVisible}
                <div class="layer-item-list">
                    <ul>
                        {#each layerLookup['saturday'].featureList as f}
                        {#if f.name}
                        <li>
                            <button class="zoom-to" on:click={() => {zoomAndPopup(f)}}><strong>{f.name}</strong></button>
                        </li>
                        {/if}
                        {/each}
                    </ul>
                </div>
                {/if}
            </div>
            {/if}
            {#if layerLookup['general']}
            <div class=layer-section>
                <div class="layer-header">
                    <button class="zoom-to-layer" on:click={() => {zoomToLayer(layerLookup['general'].layer)}}>{layerLookup['general'].displayName}</button>
                    <button on:click={() => {zoomToLayer(layerLookup['general'].layer)}}>ZOOM</button>
                    <button on:click={() => {openModal(layerLookup['general'].displayName, layerLookup['general'].description)}}>MORE INFO</button>
                </div>
                {#if layerLookup['general'].isVisible}
                <div class="layer-item-list">
                    <ul>
                        {#each layerLookup['general'].featureList as f}
                        <li>
                            <button class="zoom-to" on:click={() => {zoomAndPopup(f)}}><strong>{f.name}</strong></button>
                        </li>
                        {/each}
                    </ul>
                </div>
                {/if}
            </div>
            {/if}
            {#if layerLookup['recs']}
            <div class=layer-section>
                <div class="layer-header">
                    <button class="zoom-to-layer" on:click={() => {zoomToLayer(layerLookup['recs'].layer)}}>{layerLookup['recs'].displayName}</button>
                    <button on:click={() => {zoomToLayer(layerLookup['recs'].layer)}}>ZOOM</button>
                    <button on:click={() => {openModal(layerLookup['recs'].displayName, layerLookup['recs'].description)}}>MORE INFO</button>
                </div>
                {#if layerLookup['recs'].isVisible}
                <div class="layer-item-list">
                    <ul>
                        {#each layerLookup['recs'].featureList as f}
                        <li>
                            <button class="zoom-to" on:click={() => {zoomAndPopup(f)}}><strong>{f.name}</strong></button>
                        </li>
                        {/each}
                    </ul>
                </div>
                {/if}
            </div>
            {/if}
            {#if layerLookup['easter']}
            <div class=layer-section>
                <div class="layer-header">
                    <button class="zoom-to-layer" on:click={() => {zoomToLayer(layerLookup['easter'].layer)}}>{layerLookup['easter'].displayName}</button>
                    <button on:click={() => {zoomToLayer(layerLookup['easter'].layer)}}>ZOOM</button>
                    <button on:click={() => {openModal(layerLookup['easter'].displayName, layerLookup['easter'].description)}}>MORE INFO</button>
                </div>
                {#if layerLookup['easter'].isVisible}
                <div class="layer-item-list">
                    <ul>
                        {#each layerLookup['easter'].featureList as f}
                        <li>
                            <button class="zoom-to" on:click={() => {zoomAndPopup(f)}}><strong>{f.name}</strong></button>
                        </li>
                        {/each}
                    </ul>
                </div>
                {/if}
            </div>
            {/if}
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
        text-align: center;
    }

    .layer-section {
        margin-bottom: 5px;
    }

    .layer-item-list {
        padding: 0px 10px;
    }

    .panel-content ul {
        list-style: none;
        padding-left: 0px;
    }

    .layer-header {
        border: none;
        background: rgb(61, 64, 143);
        color: rgb(232, 222, 210);
        font-size: 1.25em;
        width: 100%;
        padding: 5px;
        text-align: center;
    }
    .layer-header button.zoom-to-layer {
        border: none;
        background: rgb(61, 64, 143);
        color: rgb(232, 222, 210);
        font-size: 1em;
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
