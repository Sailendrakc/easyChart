
export default function OnMouseDragEvent(targetElementOrID, callbackObj) {
    /*if (!(targetElement instanceof HTMLDivElement) || !(targetElement instanceof HTMLCanvasElement)) {
        throw new Error("Target element is not html div element");
    }*/

    var targetElement = targetElementOrID
    if (typeof targetElementOrID == typeof "a") {
        targetElement = document.getElementById(targetElementOrID);
        if (!targetElement) {
            throw new Error("Element with id: " + targetElementOrID + " does not exists");
        }
    }

    targetElement.deltaTime = 50;
    targetElement.mouseDownn = false;
    targetElement.lastUpdate = Date.now();
    targetElement.prevMouseDetail = undefined;
    targetElement.currentEventDetail = undefined;
    targetElement.callbackObj = callbackObj;

    targetElement.addEventListener("mousedown", (e) => {
        var obj = e.currentTarget;
        document.mouseDownnElement = obj;
        obj.mouseDownn = true;
        obj.prevMouseDetail = {
            x: e.screenX,
            y: e.screenY,
        };
    });

    document.addEventListener("mouseup", (e) => {
        var obj = document.mouseDownnElement;
        if (obj == undefined) {
            return;
        }
        obj.mouseDownn = false;
        obj.prevMouseDetail = {
            x: 0,
            y: 0,
        };

        document.mouseDownnElement = undefined;
    });

    targetElement.addEventListener("mousemove", (e) => {
        var obj = e.currentTarget;
        if (obj.mouseDownn === true && (Date.now() - obj.lastUpdate >= obj.deltaTime)) {
            e.prevMouseDetail = obj.prevMouseDetail;
            obj.lastUpdate = Date.now();
            obj.callbackObj.cb(e, obj.callbackObj.parent);
            obj.prevMouseDetail = {
                x: e.screenX,
                y: e.screenY,
            };
        }

    });
}





