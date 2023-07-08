import { utilities } from "../../ccxtWrapper/utility.js";
import CandleData from "./models/CandleData.js";
import toNonStringObj from "./ochlParser.js";
//SEE DOUBLE BUFFERING TECHNIQUE
export default class candleRenderer {
    constructor(mainRenderer) {
        this.canvas = mainRenderer.layredCanvas.addLayer(mainRenderer.candlestickLayerID, true, true);
        this.backGroundCanvas = mainRenderer.layredCanvas.addLayer(mainRenderer.backgroundLayerID, true, true);
        this.frontCanvas = mainRenderer.layredCanvas.addLayer(mainRenderer.candlestickLayerID + 1, true, true); //for 
        this.f1Canvas = mainRenderer.layredCanvas.addLayer(mainRenderer.candlestickLayerID + 2, false, false); // for price action

        this.mainRenderer = mainRenderer;

        this.dataToRender = undefined;
        this.renderingOptions = undefined;

        this.defaultRenderingOptions = {
            halfBarWidth: 7,
            gapSize: 14,
            lowHiddenPixels: 0,
            highHiddenPixels: 0,
            lowOffsetPixels: 0,
            highHiddenPixels: 0,
            candleColor1: "green",
            candleColor2: "red",
            YZoomRate: 1,
            candleStickBorderColor: 'black',
            candleStickbgColor: null,
            shapeDefaultVerticalSpacing: 5,//px
        }

        this.defaultRenderingOptions.barWidth = ((2 * this.defaultRenderingOptions.halfBarWidth) + 1 + this.defaultRenderingOptions.gapSize);
        this.lastMouseHoverDate = Date.now();
        this.mouseHoverFrameRate = 80;
        this.isCanvasDragging = false;
        this.newDataAdded = false;
        this.lastHoverPosition = {};
        // so whenever new data is added we can update rendering options.
        this.createEvents();
    }

    createEvents() {
        this.onMouseHover = this.onMouseHover.bind(this);
        this.mainRenderer.layredCanvas.cvb1.addEventListener("mousemove", this.onMouseHover);

        this.draggingHasStopped = this.draggingHasStopped.bind(this);
        document.addEventListener("mouseup", this.draggingHasStopped);
    }

    draggingHasStopped() {
        this.isCanvasDragging = false;
    }

    //convert different types of input to an object with oldest, current, interval and candleData.
    //dont deal with replacing dataTorender etc, just prepare data
    prepareDataAndSrc1(dataSrc) {
        if (typeof dataSrc == typeof "a") {
            try {
                dataSrc = JSON.parse(dataSrc);
                if (!Array.isArray(dataSrc)) {
                    throw new Error("data source is not a JSON-array string");
                }
            }
            catch (e) {
                console.log(e);
                return;
            }
        }

        if (Array.isArray(dataSrc)) {
            //convert it to map, coz we store it as a map.

            if (dataSrc.length <= 0) {
                console.log("No data to insert");
                return;
            }

            if (typeof dataSrc[0] == typeof 'a') {
                dataSrc = toNonStringObj(dataSrc);
            }

            var _oldestTime;
            var _currentTime;
            var _intervalMS;
            var _candleData = new Map();

            if (dataSrc.length == 1) {
                if (this.dataToRender) {
                    _intervalMS = this.dataToRender.intervalMS;
                }
                else {
                    _intervalMS = 0;
                }

                _oldestTime = dataSrc[0].time;
                _currentTime = dataSrc[0].time;
                _candleData.set(dataSrc[0].time, dataSrc[0]);

            }
            else {
                _oldestTime = dataSrc[1].time > dataSrc[0].time ? dataSrc[0].time : dataSrc[dataSrc.length - 1].time;
                _currentTime = dataSrc[1].time > dataSrc[0].time ? dataSrc[dataSrc.length - 1].time : dataSrc[0].time;
                _intervalMS = Math.abs(dataSrc[0].time - dataSrc[1].time);

                //convert the array into map
                dataSrc.forEach(elem => {
                    _candleData.set(elem.time, elem);
                });
            }

            var newData = {
                oldestDate: _oldestTime,
                latestDate: _currentTime,
                intervalMS: _intervalMS,
                candleData: _candleData,
            }
            return newData;
        }

        //if data src is dataToRender object
        if (dataSrc.candleData instanceof Map && dataSrc.oldestDate && dataSrc.latestDate && dataSrc.intervalMS && dataSrc.candleData.size > 1) {
            return dataSrc;
        }

        if (dataSrc.oldestDate && dataSrc.latestDate && dataSrc.intervalMS && dataSrc.dataMap instanceof Map) {
            var newData = {
                oldestDate: dataSrc.oldestDate,
                latestDate: dataSrc.latestDate,
                intervalMS: dataSrc.intervalMS,
                candleData: dataSrc.dataMap,
            }

            return newData;
        }

        if (dataSrc.constructor.name == "CandleData") {
            let newData = {
                oldestDate: dataSrc.time,
                latestDate: dataSrc.time,
                intervalMS: 0,
                candleData: new Map(),
                tickerData: {},
            }
            newData.candleData.set(dataSrc.time, dataSrc);

            return newData;
        }

        //return it anyway
        return dataSrc;
    }

    prepareDataAndSrc(dataSrc) {
        if (!dataSrc) {
            return;
        }

        //if data src is dataToRender object
        if (dataSrc.candleData instanceof Map && dataSrc.oldestDate && dataSrc.latestDate && dataSrc.intervalMS && dataSrc.candleData.size > 1) {
            return dataSrc;
        }

        //directly parsing coz i know data will be ordered
        var newData = {
            oldestDate: dataSrc.askedFromDate,
            latestDate: dataSrc.askedToDate,
            intervalMS: dataSrc.intervalMS,
            candleData: dataSrc.data,
        }
        return newData;

    }

    //expose this method
    appendDataSource(data) {
        //first prepare the data
        let readyData = this.prepareDataAndSrc(data);
        if (!readyData) {
            return;
        }

        if (!this.dataToRender) {
            this.addNewDataSource(readyData);
            return;
        }
        else {
            if (this.dataToRender.intervalMS == 0) {
                if (readyData.intervalMS != 0) {
                    this.dataToRender.intervalMS = readyData.intervalMS
                }
                else {
                    //find diference between two dates and thats the intervalMS
                    this.dataToRender.intervalMS = Math.abs(readyData.latestDate - this.dataToRender.latestDate);
                }
            }
            else {
                if (readyData.intervalMS != 0 && readyData.intervalMS != this.dataToRender.intervalMS) {
                    Error("Appending data has different interval, cannot append. Are you trying to add as new data source?");
                    return;
                }
            }

            this.dataToRender.candleData = new Map([...this.dataToRender.candleData, ...readyData.candleData]);
            this.dataToRender.oldestDate = this.dataToRender.oldestDate < readyData.oldestDate ? this.dataToRender.oldestDate : readyData.oldestDate;
            this.dataToRender.latestDate = this.dataToRender.latestDate > readyData.latestDate ? this.dataToRender.latestDate : readyData.latestDate;
            this.newDataAdded = true;
        }

        //only refresh if the added data is out of range.
        this.refresh();
    }

    addNewDataSource(dataSrc) {

        let readyData = this.prepareDataAndSrc(dataSrc);

        if (!readyData) {
            return;
        }

        this.clearCurrentDataSrc();
        if (readyData.intervalMS == 0) {
            if (readyData.candleData.get(readyData.candleData.oldestDate).isTicker)
                this.unManagedData[tickerData] = readyData.candleData.get(readyData.candleData.oldestDate);
        }
        else {

        }
        this.dataToRender = readyData;

        this.adjustYboundsInitially();
        this.refresh();
    }

    //expose this method
    updateTradeData(newTrade) {
        //console.log("Ticker received");
        //no need to prepare ticker data.
        if (!newTrade) {
            return;
        }

        if (!this.dataToRender) {
            console.log("Please add some bar data before adding trades/ticker.");
            return;
        }

        this.addLatestBar(newTrade);
        this.updateCandlestick(newTrade);
    }

    addLatestBar(bar) {

        if (bar.lastPrice) {
            bar.lastPrice = parseFloat(bar.lastPrice);
        }
        console.log("Times are bar: " + utilities.getReadableDate(bar.time) + " latest: " + utilities.getReadableDate(this.dataToRender.latestDate));
        if (bar.time == this.dataToRender.latestDate) {
            var lastState = this.dataToRender.candleData.get(bar.time);
            bar.otherInfo = lastState.otherInfo;

            bar.volume = bar.lastVolume + lastState.volume;
            bar.open = lastState.open;
            bar.high = lastState.high > bar.lastPrice ? lastState.high : bar.lastPrice;
            bar.low = lastState.low < bar.lastPrice ? lastState.low : bar.lastPrice;
            bar.close = bar.lastPrice;
        }

        if (this.dataToRender.latestDate < bar.time) {
            console.log("New bar added of time : " + bar.time.toString() + " prev: " + this.dataToRender.latestDate.toString());
            this.dataToRender.latestDate += this.dataToRender.intervalMS;

            if (this.renderingOptions.highOffsetPixels > 0) {
                this.renderingOptions.highDate += this.dataToRender.intervalMS;
                this.renderingOptions.highOffsetPixels -= this.renderingOptions.barWidth;
                if (this.renderingOptions.highOffsetPixels < 0) {
                    this.renderingOptions.highHiddenPixels = Math.abs(this.renderingOptions.highOffsetPixels);
                    this.renderingOptions.highOffsetPixels = 0;
                }
            }

            //new ticker
            let prevCandle = this.dataToRender.candleData.get(bar.time - this.dataToRender.intervalMS);
            if (!prevCandle) {
                console.log("Ticker without candles??");
                debugger;
            }
            bar.volime = bar.lastVolume;
            bar.open = prevCandle.close;
            bar.close = bar.lastPrice;
            bar.high = bar.close;
            bar.low = bar.close;
        }

        this.dataToRender.candleData.set(bar.time, bar);
        this.drawTickerPriceLine(bar.lastPrice);
        //now also update the horizontal ticker price line.

    }

    //old version of add latest bar
    addLatestBar2(bar) {
        if (!bar || !this.dataToRender) {
            return;
        }
        bar.close = bar.price;
        if (bar.time == this.dataToRender.latestDate) {
            let lastBar = this.dataToRender.candleData.get(bar.time);

            //This is trade to trade update,, 
            bar.open = lastBar.open;

            bar.high = bar.close > lastBar.high ? bar.close : lastBar.high;
            bar.low = bar.close < lastBar.low ? bar.close : lastBar.low;

            this.dataToRender.candleData.set(bar.time, bar);
            console.log("Bar replaced..");
            return;
        }

        if (bar.time != this.dataToRender.latestDate + this.dataToRender.intervalMS) {
            console.log("Not latest bar");
            return;
        }

        this.dataToRender.candleData.set(bar.time, bar);

        if (bar.time > this.dataToRender.latestDate) {
            let lastBar = this.dataToRender.candleData.get(this.dataToRender.latestDate);
            this.dataToRender.latestDate = bar.time;
            //this is new trade, previous bar is just ohlcv..
            bar.high = bar.close;
            bar.low = bar.close;
            bar.open = lastBar.close;
            console.log("New bar added..");
        }

        if (this.renderingOptions.highOffsetPixels > 0) {
            this.renderingOptions.highDate += this.dataToRender.intervalMS;
            this.renderingOptions.highOffsetPixels -= this.renderingOptions.barWidth;
            if (this.renderingOptions.highOffsetPixels < 0) {
                this.renderingOptions.highHiddenPixels = Math.abs(this.renderingOptions.highOffsetPixels);
                this.renderingOptions.highOffsetPixels = 0;
            }
        }
    }

    //expose this method
    clearCurrentDataSrc() {
        //clear everything
        this.dataToRender = null;
        this.renderingOptions = null;
        //other variables too clear it.
    }

    //expose this method
    refresh(newOptions) {
        //redraw.
        //clear the canvas and redraw
        this.clearCandles();
        this.setOrCreateRenderingOptions(newOptions);
        this.plotAvailableData();
    }

    plotAvailableData() {
        if (!this.dataToRender) {
            return;
        }

        this.setOrCreateRenderingOptions();

        if (!this.renderingOptions.Ylow || !this.renderingOptions.YHigh) {
            //first time.
            this.adjustYboundsInitially();
        }

        var tempLow = this.renderingOptions.lowDate;
        var pos = this.renderingOptions.lowOffsetPixels - this.renderingOptions.lowHiddenPixels;

        //this.canvas.cv1.style.display = "none";
        while (tempLow <= this.renderingOptions.highDate) {
            var pricee = this.dataToRender.candleData.get(tempLow);
            this.drawACandleStick(pricee, { width: this.renderingOptions.barWidth, position: pos });
            if (this.dataToRender.intervalMS == 0) {
                break;
            }
            tempLow += this.dataToRender.intervalMS;
            pos += this.renderingOptions.barWidth;
            //console.log("CandleStick drawn");
        }

        //this.canvas.cv1.style.display = "inline-block";

        this.DrawBackgroundLines();
    }

    drawACandleStick(_priceInfo, _positionInfo) {
        if (!_priceInfo) {
            debugger;
        }
        var metricsInfo = this.calculateMetricsFromCandlestick(_priceInfo, _positionInfo);
        var ctx = this.canvas.cv1.getContext("2d");

        if (_priceInfo.otherInfo.candleStickbgColor) {
            ctx.fillStyle = _priceInfo.otherInfo.candleStickbgColor;
            ctx.fillRect(metricsInfo.bodysx, 0,
                _positionInfo.width, this.backGroundCanvas.cv1.height);
        }

        if (_priceInfo.otherInfo.shapes) {
            //loop through and draw shapes above the candestick.
            _priceInfo.otherInfo.shapes.forEach(element => {
                if (element.name == "upArrow") {
                    //Draw up arrow
                    this.drawArrow(true, metricsInfo.wickx, metricsInfo.wickbottomy + element.margin, ctx, element.bodyColor);
                }

                if (element.name == "downArrow") {
                    this.drawArrow(false, metricsInfo.wickx, metricsInfo.wicktopy - element.margin, ctx, element.bodyColor);
                }

                if (element.name == "triangle") {

                }

                if (element.name == "circle") {
                    let radius = Math.floor(this.renderingOptions.barWidth / 2);

                    if (element.aboveCandlestick) {
                        this.drawCircle(metricsInfo.bodytopy - radius - element.margin, metricsInfo.wickx, element.bodyColor, radius, ctx);
                    }
                    else {
                        this.drawCircle(metricsInfo.bodybtmy + radius + element.margin, metricsInfo.wickx, element.bodyColor, radius, ctx);
                    }
                }
            });
        }

        ctx.fillStyle = _priceInfo.otherInfo.candleStickBodyColor ? _priceInfo.otherInfo.candleStickBodyColor : metricsInfo.color;
        ctx.strokeStyle = ctx.fillStyle;
        // draw wick
        this.drawVerticalLine(ctx, metricsInfo.wickx, metricsInfo.wicktopy, metricsInfo.wickbottomy);

        ctx.strokeStyle = _priceInfo.otherInfo.candleStickBorderColor ? _priceInfo.otherInfo.candleStickBorderColor : this.renderingOptions.candleStickBorderColor;
        var strokeWidthOffset = 2; // stroking will increase the width by lineWidth px, i.e. 2 atm.
        //draw body
        this.drawRectangle(metricsInfo.bodysx, metricsInfo.bodytopy, metricsInfo.width - strokeWidthOffset, metricsInfo.bodybtmy - metricsInfo.bodytopy - strokeWidthOffset, ctx);

        //draw any extra flag above the candlestick if provided.#TODO
    }

    //expose this method.
    feedLiveData(liveData) {
        if (!liveData) {
            return;
        }
        if (liveData.isTrade) {
            if (!liveData.time) {
                if (!this.dataToRender) {
                    console.log("Please add some bars first..");
                    return;
                }
                liveData.time = liveData.eventTime - (liveData.eventTime % this.dataToRender.intervalMS);
            }

            //dont parse, feed it, it will be parsed in updateTradeData and addLatestBar methods.
            this.updateTradeData(liveData);
        }

        if (liveData.isCandle) {
            if (!liveData.time) {
                liveData.time = liveData.eventTime - (liveData.eventTime % this.dataToRender.intervalMS);
            }

            //parse
            liveData = this.parseOLHC(liveData);

            this.dataToRender.candleData.set(liveData.time, liveData);
            this.dataToRender.latestDate = this.dataToRender.latestDate > liveData.time ? liveData.time : this.dataToRender.latestDate;
            this.refresh();
        }

        if (liveData.isCandleStick) {
            if (!this.dataToRender) {
                console.log(" maybe adding data for first time  ");

            }
            this.appendDataSource(liveData);
        }
    }

    drawCircle(centery, centerx, color, radius, ctx) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerx, centery, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
    }

    //draws an arrow, up or down, for now height and width is fixed inside the function.
    // point x and point y is the coordinate of the pointy part of arrow.
    drawArrow(upArrow, pointX, pointY, ctx, color) {

        let arrowHalfWidth = 12;
        let arrowHeight = 12;
        let bodyHeight = 12;
        let bodyHalfWidth = 6;

        ctx.fillStyle = color;
        //ctx.translate(0.5, 0);
        ctx.beginPath();

        let strokeWidthOffset = 2; //stroking will increase the width by linewidth px, i.e 2 atm
        if (upArrow) {
            ctx.moveTo(pointX, pointY);
            ctx.lineTo(pointX + arrowHalfWidth, pointY + arrowHeight);
            ctx.lineTo(pointX + bodyHalfWidth, pointY + arrowHeight);
            ctx.lineTo(pointX + bodyHalfWidth, pointY + arrowHeight + bodyHeight);
            ctx.lineTo(pointX - bodyHalfWidth, pointY + arrowHeight + bodyHeight);
            ctx.lineTo(pointX - bodyHalfWidth, pointY + arrowHeight);
            ctx.lineTo(pointX - arrowHalfWidth, pointY + arrowHeight);
            ctx.lineTo(pointX, pointY);
        }
        else {
            ctx.moveTo(pointX, pointY);
            ctx.lineTo(pointX - arrowHalfWidth, pointY - arrowHeight); //..
            ctx.lineTo(pointX - bodyHalfWidth, pointY - arrowHeight);//..
            ctx.lineTo(pointX - bodyHalfWidth, pointY - arrowHeight - bodyHeight);//..
            ctx.lineTo(pointX + bodyHalfWidth, pointY - arrowHeight - bodyHeight);//..
            ctx.lineTo(pointX + bodyHalfWidth, pointY - arrowHeight);//..
            ctx.lineTo(pointX + arrowHalfWidth, pointY - arrowHeight);//..
            ctx.lineTo(pointX, pointY);
        }

        ctx.fill();
        ctx.stroke();
    }

    parseOLHC(item) {
        if (!item) {
            return;
        }

        item.high = parseFloat(item.high);
        item.low = parseFloat(item.low);

        if (item.lastPrice) {
            item.close = parseFloat(item.lastPrice);
        }

        if (item.close) {
            item.close = parseFloat(item.close);
        }

        item.open = parseFloat(item.open);
        item.volume = parseFloat(item.volume);
        return item;
    }

    drawHorizontalLine(ctx, y, x2, x1) {
        ctx.translate(0, 0.5);
        ctx.beginPath();
        ctx.moveTo(x2, y);
        ctx.lineTo(x1, y);
        ctx.stroke();
        ctx.translate(0, -0.5);
    }

    drawVerticalLine(ctx, x, y2, y1) {
        ctx.translate(0.5, 0);
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.stroke();
        ctx.translate(-0.5, 0);
    }

    drawRectangle(x1, y1, width, height, ctx) {
        ctx.beginPath();
        ctx.fillRect(x1, y1, width, height);

        ctx.strokeRect(x1, y1, width, height);
        ctx.stroke();
    }

    calculateMetricsFromCandlestick(priceInfo, positionInfo) {

        if (!priceInfo) {
            debugger;
        }

        var candleDrawData = {};
        candleDrawData.wicktopy = this.getYPointFromPriceUnsafe(priceInfo.high);
        candleDrawData.wickbottomy = this.getYPointFromPriceUnsafe(priceInfo.low);

        //var localHalfBarSize = Math.ceil((positionInfo.width - 1) / 3); //positionInfo.width is total with including gap
        var localHalfBarSize = this.renderingOptions.halfBarWidth;

        candleDrawData.width = (localHalfBarSize * 2) + 1; //bar width without gap
        var localGapSize = positionInfo.width - candleDrawData.width;
        candleDrawData.bodysx = positionInfo.position;
        candleDrawData.wickx = candleDrawData.bodysx + localHalfBarSize;

        //candleDrawData.bodysx = positionInfo.position;
        //candleDrawData.width = positionInfo.width - this.renderingOptions.visibleRange.gapSize;
        //candleDrawData.wickx = positionInfo.position + this.renderingOptions.visibleRange.halfBarSize;
        if (priceInfo.open < priceInfo.close) {
            //green
            candleDrawData.bodytopy = this.getYPointFromPriceUnsafe(priceInfo.close);
            candleDrawData.bodybtmy = this.getYPointFromPriceUnsafe(priceInfo.open);
            candleDrawData.color = priceInfo.otherInfo.upColor ? priceInfo.otherInfo.upColor : this.renderingOptions.candleColor1;
        }
        else {
            candleDrawData.bodytopy = this.getYPointFromPriceUnsafe(priceInfo.open);
            candleDrawData.bodybtmy = this.getYPointFromPriceUnsafe(priceInfo.close);
            candleDrawData.color = priceInfo.otherInfo.downColor ? priceInfo.otherInfo.downColor : this.renderingOptions.candleColor2;
        }
        return candleDrawData;
    }

    eraseCandlestick(date) {
        //find out the position of the date
        let _positionInfo = {};

        if (date < this.renderingOptions.lowDate || date > this.renderingOptions.highDate) {
            return;
        }

        //find the distance from low
        _positionInfo.position = ((date - this.renderingOptions.lowDate) / this.dataToRender.intervalMS) * this.renderingOptions.barWidth
            - this.renderingOptions.lowHiddenPixels + this.renderingOptions.lowOffsetPixels;
        _positionInfo.width = this.renderingOptions.barWidth;

        this.canvas.cv1.getContext('2d').clearRect(_positionInfo.position, 0, _positionInfo.width, this.canvas.cv1.height);
        return _positionInfo;
    }

    updateCandlestick(newTradeData) {
        //get other properties first.
        var posinfo = this.eraseCandlestick(newTradeData.time);

        if (posinfo) {
            this.drawACandleStick(newTradeData, posinfo);
        }
    }

    getYPointFromPriceUnsafe(price) {
        var pricePerPx = (this.renderingOptions.YHigh - this.renderingOptions.Ylow) / (this.canvas.cv1.height);
        return (this.renderingOptions.YHigh - price) / pricePerPx;
    }

    setOrCreateRenderingOptions(options) {

        if (!this.dataToRender) {
            throw new Error("Cannot set or create rendering options without rendering data");
        }

        if (options) {
            this.renderingOptions = { ...this.renderingOptions, ...options };
            return;
        }

        if (!options && !this.renderingOptions) {
            this.renderingOptions = {};
            Object.assign(this.renderingOptions, this.defaultRenderingOptions);
            //this.renderingOptions = this.defaultRenderingOptions;

            //calculate low and high
            var maxtotalBars = Math.floor((this.canvas.cv1.width) / this.renderingOptions.barWidth);
            var totalBars = this.dataToRender.candleData.size >= maxtotalBars ? maxtotalBars : this.dataToRender.candleData.size;
            this.renderingOptions.lowOffsetPixels = 0;
            this.renderingOptions.lowHiddenPixels = 0;
            this.renderingOptions.highOffsetPixels = (this.canvas.cv1.width) - (totalBars * this.renderingOptions.barWidth);
            this.renderingOptions.highDate = this.dataToRender.latestDate;
            this.renderingOptions.lowDate = this.renderingOptions.highDate - ((totalBars - 1) * this.dataToRender.intervalMS);
            this.renderingOptions.yPartDistance = Math.floor(180 / devicePixelRatio);
            this.renderingOptions.panOffsetY = 0;
            this.renderingOptions.ypartBreaking = { min: Math.floor(120 / devicePixelRatio), max: (200 / devicePixelRatio) };
            this.renderingOptions.xpartBreaking = { min: Math.floor(0.12 * this.canvas.cv1.width), max: Math.floor(0.15 * this.canvas.cv1.width) };
            this.renderingOptions.dateLinesMinGap = 100; //min 100 px, clamp to nearest candles midpoint so maybe lesser than 100px
            this.renderingOptions.xPanDisplacement = 0;

        }

        if (this.newDataAdded) {
            this.newDataAdded = false;

            if (this.renderingOptions.highOffsetPixels > 0) {
                if (this.renderingOptions.highDate < this.dataToRender.latestDate) {
                    let diffpx = ((this.dataToRender.latestDate - this.renderingOptions.highDate) / this.dataToRender.intervalMS) * this.renderingOptions.barWidth;
                    if (diffpx > this.renderingOptions.highOffsetPixels) {
                        this.renderingOptions.highHiddenPixels = this.renderingOptions.barWidth - (this.renderingOptions.highOffsetPixels % this.renderingOptions.barWidth)
                        this.renderingOptions.highOffsetPixels = 0;
                        this.renderingOptions.highDate +=
                            ((Math.ceil(this.renderingOptions.highOffsetPixels / this.renderingOptions.barWidth) * this.dataToRender.intervalMS))
                    }
                    else {
                        this.renderingOptions.highDate = this.dataToRender.latestDate;
                        this.renderingOptions.highOffsetPixels -= diffpx;
                    }
                }
            }

            if (this.renderingOptions.lowOffsetPixels > 0) {
                if (this.renderingOptions.lowDate > this.dataToRender.oldestDate) {
                    let diffpx = ((this.renderingOptions.lowDate - this.dataToRender.oldestDate) / this.dataToRender.intervalMS) * this.renderingOptions.barWidth;
                    if (diffpx > this.renderingOptions.lowOffsetPixels) {
                        this.renderingOptions.lowHiddenPixels = this.renderingOptions.lowOffsetPixels % this.renderingOptions.barWidth;
                        this.renderingOptions.lowOffsetPixels = 0;
                        this.renderingOptions.lowDate = this.dataToRender.oldestDate +
                            ((Math.ceil(this.renderingOptions.lowOffsetPixels / this.renderingOptions.barWidth) * this.dataToRender.intervalMS))
                    }
                    else {
                        this.renderingOptions.lowDate = this.dataToRender.oldestDate;
                        this.renderingOptions.lowOffsetPixels -= diffpx;
                    }
                }
            }
        }
    }

    adjustYboundsInitially() {

        if (!this.renderingOptions) {
            this.setOrCreateRenderingOptions();
        }

        //use the activechartdata and xpointers.
        var pointerDate = this.renderingOptions.lowDate;

        var highesty = 0;
        var lowesty = Number.MAX_SAFE_INTEGER;

        while (pointerDate <= this.renderingOptions.highDate) {

            var candledata = this.dataToRender.candleData.get(pointerDate);
            if (!candledata) {
                console.log("Non existent date, unable to adjust bounds.");
                console.log(pointerDate);
                break;
            }

            console.log("adjusting");
            if (highesty < candledata.high) {
                highesty = candledata.high + (0.03 * candledata.high);
                console.log("High set to: " + highesty.toString());
            }

            if (lowesty > candledata.low) {
                lowesty = candledata.low - (0.03 * candledata.low);
                console.log("Low set to: " + lowesty.toString());
            }
            if (this.dataToRender.intervalMS == 0) {
                break;
            }
            pointerDate += this.dataToRender.intervalMS;
        }

        this.renderingOptions.Ylow = lowesty;
        this.renderingOptions.YHigh = highesty;
    }

    //mouse going left.
    goLeft(diff) {

        this.isCanvasDragging = true;
        //clamp
        var ThirdLatestBar = this.dataToRender.latestDate - (this.dataToRender.intervalMS * 2);
        var distFromLowToSecondLatest = ((((ThirdLatestBar - this.renderingOptions.lowDate) / this.dataToRender.intervalMS) + 1)
            * this.renderingOptions.barWidth) - this.renderingOptions.lowHiddenPixels + this.renderingOptions.lowOffsetPixels;

        diff = diff > distFromLowToSecondLatest ? distFromLowToSecondLatest : diff;

        if (diff <= 0) {
            return false;
        }

        this.renderingOptions.xPanDisplacement -= diff;

        //adjust lowOffsetPx
        this.renderingOptions.lowOffsetPixels -= diff;
        if (this.renderingOptions.lowOffsetPixels < 0) {
            diff = Math.abs(this.renderingOptions.lowOffsetPixels);
            this.renderingOptions.lowOffsetPixels = 0;
        }
        else {
            diff = 0;
        }

        var internalCWidth = (this.canvas.cv1.width);

        var times = Math.floor(diff / this.renderingOptions.barWidth);
        var rem = Math.floor(diff % this.renderingOptions.barWidth);

        if (rem + this.renderingOptions.lowHiddenPixels > this.renderingOptions.barWidth) {
            times += 1;
            this.renderingOptions.lowHiddenPixels = rem - (this.renderingOptions.barWidth - this.renderingOptions.lowHiddenPixels);
        }
        else {
            this.renderingOptions.lowHiddenPixels += rem;
        }

        this.renderingOptions.lowDate += (times * this.dataToRender.intervalMS);

        var lowHighDiff = Math.floor((internalCWidth - this.renderingOptions.lowOffsetPixels) / this.renderingOptions.barWidth);
        var remPxDiff = (internalCWidth - this.renderingOptions.lowOffsetPixels) % this.renderingOptions.barWidth;

        if (this.renderingOptions.lowHiddenPixels + remPxDiff > this.renderingOptions.barWidth) {
            lowHighDiff += 1;
            this.renderingOptions.highHiddenPixels = (2 * this.renderingOptions.barWidth) - (this.renderingOptions.lowHiddenPixels + remPxDiff); //just calc no need.
        }
        else {
            this.renderingOptions.highHiddenPixels = this.renderingOptions.barWidth - (this.renderingOptions.lowHiddenPixels + remPxDiff);

        }

        this.renderingOptions.highDate = this.renderingOptions.lowDate + (lowHighDiff * this.dataToRender.intervalMS);

        if (this.renderingOptions.highDate > this.dataToRender.latestDate) {
            this.renderingOptions.highDate = this.dataToRender.latestDate;
            this.renderingOptions.highHiddenPixels = 0;
        }

        return true;
    }

    //mouse going right
    goRight(diff) {

        this.isCanvasDragging = true;
        //second oldest is the minimum possible high, clamp
        var DistHighToSecondOldest = (((this.renderingOptions.highDate - this.dataToRender.oldestDate - this.dataToRender.intervalMS)
            / this.dataToRender.intervalMS) * this.renderingOptions.barWidth) - this.renderingOptions.highHiddenPixels;
        var tempHighOffsetPixels = this.canvas.cv1.width - (((((this.renderingOptions.highDate - this.renderingOptions.lowDate) / this.dataToRender.intervalMS) + 1)
            * this.renderingOptions.barWidth) - this.renderingOptions.lowHiddenPixels - this.renderingOptions.highHiddenPixels + this.renderingOptions.lowOffsetPixels);

        DistHighToSecondOldest += tempHighOffsetPixels;
        diff = diff > DistHighToSecondOldest ? DistHighToSecondOldest : diff;

        if (diff <= 0) {
            return false;
        }

        this.renderingOptions.xPanDisplacement += diff;
        //distance from low to oldest
        var DistLowToOldest = (((this.renderingOptions.lowDate - this.dataToRender.oldestDate) / this.dataToRender.intervalMS) *
            this.renderingOptions.barWidth) + this.renderingOptions.lowHiddenPixels;

        if (this.renderingOptions.lowOffsetPixels > 0) {
            this.renderingOptions.lowOffsetPixels += diff;
        }
        else {
            if (diff >= DistLowToOldest) {
                this.renderingOptions.lowDate = this.dataToRender.oldestDate;
                this.renderingOptions.lowHiddenPixels = 0;
                this.renderingOptions.lowOffsetPixels += (diff - DistLowToOldest);
            }
            else {
                //calculate low 
                var times = Math.floor(diff / this.renderingOptions.barWidth);
                var rem = diff % this.renderingOptions.barWidth;
                if (this.renderingOptions.lowHiddenPixels < rem) {
                    times += 1;
                    this.renderingOptions.lowHiddenPixels = this.renderingOptions.barWidth - (rem - this.renderingOptions.lowHiddenPixels);
                }
                else {
                    this.renderingOptions.lowHiddenPixels -= rem;
                }

                this.renderingOptions.lowDate -= (times * this.dataToRender.intervalMS);

            }
        }

        //now calculate the new high.
        var internalCWidth = (this.canvas.cv1.width);
        var lowHighDiff = Math.floor((internalCWidth - this.renderingOptions.lowOffsetPixels) / this.renderingOptions.barWidth);
        var remPxDiff = (internalCWidth - this.renderingOptions.lowOffsetPixels) % this.renderingOptions.barWidth;

        if (this.renderingOptions.lowHiddenPixels + remPxDiff > this.renderingOptions.barWidth) {
            lowHighDiff += 1;
            this.renderingOptions.highHiddenPixels = (2 * this.renderingOptions.barWidth) - (this.renderingOptions.lowHiddenPixels + remPxDiff); //just calc no need.
        }
        else {
            this.renderingOptions.highHiddenPixels = this.renderingOptions.barWidth - (this.renderingOptions.lowHiddenPixels + remPxDiff);
        }

        this.renderingOptions.highDate = this.renderingOptions.lowDate + (lowHighDiff * this.dataToRender.intervalMS);

        if (this.renderingOptions.highDate > this.dataToRender.latestDate) {
            this.renderingOptions.highDate = this.dataToRender.latestDate;
            this.renderingOptions.highHiddenPixels = 0;
        }

        return true;
    }

    goYpan(diffY) {
        if (diffY != 0) {

            //calculate new pixel ratio
            var priceToPxRatio = (this.renderingOptions.YHigh - this.renderingOptions.Ylow) / this.canvas.cv1.height;
            var offsetVal = Math.round((diffY * priceToPxRatio) * 1000) / 1000;
            var newylow = this.renderingOptions.Ylow + offsetVal;
            var newyhigh = this.renderingOptions.YHigh + offsetVal;

            this.renderingOptions.panOffsetY += (offsetVal / priceToPxRatio);

            this.renderingOptions.Ylow = newylow;
            this.renderingOptions.YHigh = newyhigh;

            if (Math.abs(this.renderingOptions.panOffsetY) >= this.renderingOptions.yPartDistance) {

                if (this.renderingOptions.panOffsetY < 0) {
                    this.renderingOptions.panOffsetY += this.renderingOptions.yPartDistance;
                }
                else {
                    this.renderingOptions.panOffsetY -= this.renderingOptions.yPartDistance;
                }
                //this.renderingOptions.panOffsetY = 0;
            }

            return true;
        }
        else {
            return false;
        }
    }

    goYZoom(diff) {
        if (diff == 0) {
            return false;
        }
        var diff = diff / this.renderingOptions.YZoomRate;
        var rdiff = Math.round((diff) * 100) / 100;
        var ih = this.backGroundCanvas.cv2.height;
        var ldiff = rdiff * ((ih - 2 * this.renderingOptions.panOffsetY) / (ih + 2 * this.renderingOptions.panOffsetY));

        //now this price needs to be maintained until next breaking
        var pr1 = (this.renderingOptions.YHigh - this.renderingOptions.Ylow) / ih;
        var yPriceDist = this.renderingOptions.yPartDistance * pr1;

        if (diff > 0) {
            //mouse went down
            this.renderingOptions.Ylow -= ldiff * pr1;
            this.renderingOptions.YHigh += rdiff * pr1;
        }
        else {

            this.renderingOptions.Ylow -= ldiff * pr1;
            this.renderingOptions.YHigh += rdiff * pr1;
        }

        //calculate ypartdistance based on new pixel ratio.
        this.renderingOptions.yPartDistance = yPriceDist / ((this.renderingOptions.YHigh - this.renderingOptions.Ylow) / ih);

        if (this.renderingOptions.yPartDistance < this.renderingOptions.ypartBreaking.min) {
            //breaking into big
            this.renderingOptions.yPartDistance = this.renderingOptions.ypartBreaking.max;
            console.log("Breaking into big");
        }

        if (this.renderingOptions.yPartDistance > this.renderingOptions.ypartBreaking.max) {
            //breaking into small
            this.renderingOptions.yPartDistance = this.renderingOptions.ypartBreaking.min;
            console.log("Breaking into small");
        }
        //console.log("Y, zooming");
        return true;
    }

    DrawBackgroundLines() {

        //horizontal pricel lines
        var midPointToDraw = Math.floor(this.canvas.cv2.height / 2);
        var newOffsetPoint = midPointToDraw + this.renderingOptions.panOffsetY;
        var ctx = this.backGroundCanvas.cv1.getContext('2d');
        var ctx1 = this.backGroundCanvas.cv2.getContext('2d');
        var ctx3 = this.backGroundCanvas.cv3.getContext('2d');

        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgb(212, 208, 207)";
        ctx1.font = '20px serif';

        this.drawHorizontalLine(ctx, newOffsetPoint, this.backGroundCanvas.cv1.width, 0);
        this.WriteInCanvas(ctx1, this.getPriceFromInternalPoint(newOffsetPoint).toFixed(6).toString(), newOffsetPoint);

        while (newOffsetPoint > 0) {
            this.drawHorizontalLine(ctx, newOffsetPoint, this.backGroundCanvas.cv1.width, 0);
            this.WriteInCanvas(ctx1, this.getPriceFromInternalPoint(newOffsetPoint).toFixed(6).toString(), newOffsetPoint, 0);
            newOffsetPoint -= this.renderingOptions.yPartDistance;
        }

        newOffsetPoint = midPointToDraw + this.renderingOptions.panOffsetY + this.renderingOptions.yPartDistance;
        ctx3.font = '20px serif';
        while (newOffsetPoint < this.canvas.cv1.height) {
            this.drawHorizontalLine(ctx, newOffsetPoint, this.backGroundCanvas.cv1.width, 0);
            this.WriteInCanvas(ctx1, this.getPriceFromInternalPoint(newOffsetPoint).toFixed(6).toString(), newOffsetPoint, 0);
            newOffsetPoint += this.renderingOptions.yPartDistance;
        }

        //vertical date lines.

        //calculate nearest number of bars for minimum distance.
        var barsPerLine = Math.floor(this.canvas.cv1.width / this.renderingOptions.dateLinesMinGap);
        var distWidth = barsPerLine * this.renderingOptions.barWidth;
        this.renderingOptions.xPanDisplacement = this.renderingOptions.xPanDisplacement % distWidth;
        var xpos = this.renderingOptions.gapSize + this.renderingOptions.halfBarWidth + this.renderingOptions.xPanDisplacement;
        while (barsPerLine > 0) {
            this.drawVerticalLine(ctx, xpos, this.backGroundCanvas.cv1.height, 0);
            var writeDate = new Date(this.getCurrentHoveringCandleDate(xpos));
            var timePart = writeDate.toLocaleTimeString();
            var datePart = writeDate.toLocaleDateString();

            this.WriteInCanvas(ctx3, timePart, 20, xpos - 30);
            this.WriteInCanvas(ctx3, datePart, 40, xpos - 30)
            barsPerLine -= 1;
            xpos += distWidth;
        }
    }

    getPriceFromInternalPoint(ypoint) {
        var pxRatio = (this.renderingOptions.YHigh - this.renderingOptions.Ylow) / this.canvas.cv1.height;
        return (this.renderingOptions.YHigh - (pxRatio * ypoint));
    }

    WriteInCanvas(ctx, txt, y, x) {
        ctx.fillText(txt, x, y);
    }

    clearCandles() {
        this.canvas.cv1.getContext("2d").clearRect(0, 0, (this.canvas.cv1.width), (this.canvas.cv1.height));
        this.backGroundCanvas.cv1.getContext("2d").clearRect(0, 0, (this.backGroundCanvas.cv1.width), (this.backGroundCanvas.cv1.height));
        this.backGroundCanvas.cv2.getContext("2d").clearRect(0, 0, (this.backGroundCanvas.cv2.width), (this.backGroundCanvas.cv2.height));
        this.backGroundCanvas.cv3.getContext("2d").clearRect(0, 0, (this.backGroundCanvas.cv3.width), (this.backGroundCanvas.cv3.height));
        //also clear rect of cv2 --- todo later

        this.frontCanvas.cv1.getContext('2d').clearRect(0, 0, this.frontCanvas.cv1.width, this.frontCanvas.cv1.height);
        this.frontCanvas.cv2.getContext('2d').clearRect(0, 0, this.frontCanvas.cv2.width, this.frontCanvas.cv2.height);
        this.frontCanvas.cv3.getContext('2d').clearRect(0, 0, this.frontCanvas.cv3.width, this.frontCanvas.cv3.height);
    }

    getCurrentHoveringCandleDate(xpos) {
        xpos += (this.renderingOptions.lowHiddenPixels - this.renderingOptions.lowOffsetPixels);
        var addBars = Math.floor(xpos / this.renderingOptions.barWidth);

        return this.renderingOptions.lowDate + (addBars * this.dataToRender.intervalMS);
    }

    getHoveringCandleMidPoint(xpos) {
        let bigXpos = xpos + this.renderingOptions.lowHiddenPixels - this.renderingOptions.lowOffsetPixels;
        let fullXpos = Math.ceil(bigXpos / this.renderingOptions.barWidth) * this.renderingOptions.barWidth;

        let candleMidPoint = fullXpos - this.renderingOptions.lowHiddenPixels + this.renderingOptions.lowOffsetPixels - this.renderingOptions.halfBarWidth - this.renderingOptions.gapSize;
        return candleMidPoint;
    }

    writeHoveringCandleDetails(date) {
        if (!this.dataToRender || !this.renderingOptions || !date) {
            return;
        }

        if (date < this.renderingOptions.lowDate || date > this.renderingOptions.highDate) {
            return;
        }

        let candleDetails = this.dataToRender.candleData.get(date);
        let ctx1 = this.frontCanvas.cv1.getContext("2d");

        if (!candleDetails) {
            debugger;
        }

        ctx1.font = '30px serif';
        let txtToWrite = "O: " + candleDetails.open.toFixed(6).toString() + " H: " + candleDetails.high.toFixed(6).toString() +
            " L: " + candleDetails.low.toFixed(6).toString() + " C: " + candleDetails.close.toFixed(6).toString();

        //for now put the coordinates here
        let x1 = 20;
        let y1 = 20;
        let width = ctx1.measureText(txtToWrite).width + 40;
        let height = 40;


        ctx1.globalAlpha = 0.7;
        ctx1.fillStyle = "white";
        ctx1.setLineDash([]);
        //create a white rectangle above in the front canvas
        this.drawRectangle(x1, y1, width, height, ctx1);

        ctx1.globalAlpha = 1;

        //now draw texts
        let txtColor = "green";
        if (candleDetails.close < candleDetails.open) {
            //red
            txtColor = "red";
        }

        ctx1.fillStyle = candleDetails.otherInfo.candleStickBodyColor ? _priceInfo.otherInfo.candleStickBodyColor : txtColor;
        this.WriteInCanvas(ctx1, txtToWrite, y1 + 30, x1 + 10);


    }

    onMouseHover(e) {

        if (this.isCanvasDragging || !this.renderingOptions || !this.dataToRender) {
            return;
        }
        //get the x and y position of mouse.
        if (Date.now() - this.lastMouseHoverDate < this.mouseHoverFrameRate) {
            return;
        }

        this.frontCanvas.cv1.getContext('2d').clearRect(0, 0, this.frontCanvas.cv1.width, this.frontCanvas.cv1.height);
        this.frontCanvas.cv2.getContext('2d').clearRect(0, 0, this.frontCanvas.cv2.width, this.frontCanvas.cv2.height);
        this.frontCanvas.cv3.getContext('2d').clearRect(0, 0, this.frontCanvas.cv3.width, this.frontCanvas.cv3.height);

        var rect = e.target.getBoundingClientRect();
        var xpos = (e.clientX - rect.left) * devicePixelRatio; //x position within the element.
        var ypos = (e.clientY - rect.top) * devicePixelRatio;  //y position within the element.
        this.lastHoverPosition = e;

        //get date from x pos
        var hoveringDate = this.getCurrentHoveringCandleDate(xpos);

        if (hoveringDate < this.renderingOptions.lowDate || hoveringDate > this.renderingOptions.highDate) {
            return;
        }

        this.writeHoveringCandleDetails(hoveringDate);

        this.renderingOptions.hoveringCandleDate = hoveringDate;

        //get date data
        var hoveringCandleMidpoint = this.getHoveringCandleMidPoint(xpos);
        //display that date in tooltip --later


        //also draw a shade in candlestick canvas as candlestick background and cursor cross

        var ctx1 = this.frontCanvas.cv1.getContext("2d");
        var ctx2 = this.frontCanvas.cv2.getContext("2d");
        var ctx3 = this.frontCanvas.cv3.getContext("2d");

        ctx1.setLineDash([10, 10]);
        this.drawHorizontalLine(ctx1, ypos, 0, this.frontCanvas.cv1.width);
        this.drawVerticalLine(ctx1, hoveringCandleMidpoint, 0, this.frontCanvas.cv1.height);

        //now draw date as well.
        var writeDate = new Date(hoveringDate);
        var timePart = writeDate.toLocaleTimeString();
        var datePart = writeDate.toLocaleDateString();

        //----------------------------------

        ctx3.fillStyle = "orange";
        ctx3.fillRect(hoveringCandleMidpoint - 60, 0, 130, 50);
        //ctx3.strokeRect(hoveringCandleMidpoint - 30, 0, 100, 40);
        ctx3.strokeStyle = "rgb(212, 208, 207)";
        ctx3.font = '20px serif';
        ctx3.fillStyle = "black";
        this.WriteInCanvas(ctx3, timePart, 20, hoveringCandleMidpoint - 45);
        this.WriteInCanvas(ctx3, datePart, 40, hoveringCandleMidpoint - 45)

        //-------------------
        var priceInY = this.renderingOptions.YHigh - (ypos * (this.renderingOptions.YHigh - this.renderingOptions.Ylow) / this.frontCanvas.cv2.height);
        ctx2.fillStyle = "orange";
        ctx2.fillRect(0, ypos - 20, this.frontCanvas.cv2.width, 40);
        //ctx3.strokeRect(0, ypos - 10, this.frontCanvas.cv2.width, 20);
        ctx2.strokeStyle = "rgb(212, 208, 207)";
        ctx2.font = '20px serif';
        ctx2.fillStyle = "black";
        this.WriteInCanvas(ctx2, priceInY.toFixed(6).toString(), ypos + 10, 0);
        this.lastMouseHoverDate = Date.now();
    }

    drawTickerPriceLine(price) {
        //get contect
        var ctx1 = this.f1Canvas.cv1.getContext("2d");
        ctx1.clearRect(0, 0, this.f1Canvas.cv1.width, this.f1Canvas.cv1.height);
        let ypos = this.getYPointFromPriceUnsafe(price);
        ctx1.setLineDash([10, 10]);
        this.drawHorizontalLine(ctx1, ypos, 0, this.f1Canvas.cv1.width);
    }

}