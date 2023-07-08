import CandleData from "./models/CandleData.js";

export default function toNonStringObj(array) {
    if (!(array instanceof Array)) {
        throw new Error("the object to parse needs to be arrray.");
    }
    var newArr = [];

    array.forEach(element => {
        var cls = new CandleData(element);
        newArr.push(cls);
    });

    return newArr;
}