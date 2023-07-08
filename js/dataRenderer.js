import candleRenderer from "./candleRenderer.js";
import layeredCanvas from "./layeredCanvas.js";
import OnMouseDragEvent from "./onMouesDrag.js";

export default class dataRenderer {
    constructor(container, settings) {

        this.mainContainer = container;
        this.layredCanvas;
        //data renderer will expose function that can be called from analyzer to display certain data.
        this.candlestickLayerID = 10;
        this.backgroundLayerID = 5;
        this.indicatorLayerID = 15;

        this.canvas1HeightCSS = settings.height;
        this.canvas1WidthCSS = settings.width;
        this.canvas2HeightCSS = this.canvas1HeightCSS;
        this.canvas2WidthCSS = 80;///todo 

        this.renderers = new Map();

        this.generateLayredCanvas();

        OnMouseDragEvent("cvb1Container", {
            cb: this.onPanning,
            parent: this,
        });

        OnMouseDragEvent("cvb2Container", {
            cb: this.OnYZooming,
            parent: this,
        });
    }

    addRenderer(typeID) {
        let newRenderer;
        if (typeID == "candle") {
            newRenderer = new candleRenderer(this);
        }
        this.renderers.set(typeID, newRenderer);
        return newRenderer;
    }

    getRenderer(typeID) {
        return this.renderers.get(typeID);
    }


    createBackgroundLayer() {
        if (!this.layredCanvas) {
            this.generateLayredCanvas();
        }
        this.layredCanvas.addLayer(this.backgroundLayerID);
    }

    createCandlestickLayer() {
        if (!this.candlestickLayerID) {
            this.generateLayredCanvas();
        }

        var layeerObj = this.layredCanvas.addLayer(this.candlestickLayerID);

        //also add the renderer
        if (!this.renderers.get("candle")) {
            var candlestickRenderer = new candleRenderer(this);
            this.renderers.set("candle", candlestickRenderer);
        }
    }

    createIndicatorLayer() {
        if (!this.indicatorLayerID) {
            generateLayredCanvas();
        }
        this.layredCanvas.addLayer(this.indicatorLayerID);
    }

    generateLayredCanvas() {
        if (!(this.mainContainer instanceof HTMLDivElement)) {
            throw new Error("Unable to generate layered canvas, Container for data renderer is not a html divElement");
        }

        this.layredCanvas = new layeredCanvas(this.mainContainer, this.canvas1WidthCSS, this.canvas1HeightCSS);
        return this.layredCanvas;
    }

    getPairData(pairObj) {
        if (!this.dataManager) {
            return;
        }
        //load the exchange first.
        var conn = this.dataManager.tradingExchange(pairObj.exchange);

        if (!conn) {
            return;
        }

        var pairdata = conn.pairData.get(pairObj);

        return pairdata;
    }

    loadCandlestick(dataPairValue, _renderingOptions) {

        //process it and render it.
        //data {//candleMap, oldestDate, latestTicker, interval}

        var candleRenderer = this.renderers.get("candle");
        candleRenderer.drawCandlesticks(dataPairValue, _renderingOptions);
    }

    onPanning(detail, parent) {

        //calculate the change.
        var rawDiffX = detail.screenX - detail.prevMouseDetail.x;
        var rawDiffY = detail.screenY - detail.prevMouseDetail.y;


        //distance from second latest is important.
        //after calculating diff.

        var diff = Math.abs(rawDiffX);
        var cr = parent.renderers.get("candle");
        var isXpan = false;
        var isYpan = false;

        //x pan
        if (rawDiffX > 0) {
            isXpan = cr.goRight(diff);
        }
        else {
            isXpan = cr.goLeft(diff);
        }

        // y pan
        if (rawDiffY != 0) {
            isYpan = cr.goYpan(rawDiffY);
        }

        if (isYpan || isXpan) {
            cr.refresh();
        }

    }

    OnYZooming(detail, parent) {
        //var rawDiffX = detail.screenX - detail.prevMouseDetail.x;
        var rawDiffY = detail.screenY - detail.prevMouseDetail.y;
        if (rawDiffY != 0) {
            var cr = parent.renderers.get("candle");
            cr.goYZoom(rawDiffY);
            cr.refresh();
        }
    }

    OnTickerData(candleObject) {
        //candle object is the actual ticker data.
        var cv = this.renderers.get("candle");
        cv.updateCandlestick(candleObject);
    }

}

