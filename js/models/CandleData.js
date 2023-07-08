export default class CandleData {
    constructor(barArray) {
        this.time = parseInt(barArray[0]);
        this.open = parseFloat(barArray[1]);
        this.high = parseFloat(barArray[2]);
        this.low = parseFloat(barArray[3]);
        this.close = parseFloat(barArray[4]);
        this.vol = parseFloat(barArray[5]);
        this.volFiat = parseFloat(barArray[6]);
        this.otherInfo = {};
        this.otherInfo.shapes = [];
        this.barWidth = -1;

        if (this.close === null) {
            this.complete = false;
        }
        else {
            this.complete = true;
        }
    }

}