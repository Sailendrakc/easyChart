export default class layeredCanvas {

	constructor(parent, _width, _height) {
		this.coll = new Map();
		this.Container = document.createElement("div");
		this.Container.setAttribute("id", "ChartContainer");

		this.Container.style.display = "inline-block";
		this.extraBorderAndMarginPx = 3;
		this.cssWidth = _width;
		this.cssHeight = _height;

		this.minYaxixWidth = 80;
		this.minXaxisHeight = 40;

		this.Container.style.width = String(this.cssWidth) + "px";
		this.Container.style.height = String(this.cssHeight) + "px";

		parent.appendChild(this.Container);
		this.AddDivsForEvent();

		this.totalLayers = 0;
	}

	AddDivsForEvent() {
		var cvb1 = document.createElement("div");
		cvb1.setAttribute("id", "cvb1Container");

		cvb1.style.width = String(this.cssWidth - this.minYaxixWidth - this.extraBorderAndMarginPx) + "px";
		cvb1.style.height = String(this.cssHeight - this.minXaxisHeight - this.extraBorderAndMarginPx) + "px";
		cvb1.style.display = "inline-block";
		cvb1.style.marginRight = "2px"
		cvb1.style.borderBottom = "1px solid black";

		//
		var cvb2 = document.createElement("div");
		cvb2.setAttribute("id", "cvb2Container");
		cvb2.style.cursor = "ns-resize";

		cvb2.style.width = String(this.minYaxixWidth) + "px";
		cvb2.style.height = String(this.cssHeight - this.minXaxisHeight - this.extraBorderAndMarginPx) + "px";
		cvb2.style.display = "inline-block";
		cvb2.style.borderLeft = "1px solid black";
		cvb2.style.borderBottom = "1px solid black";
		//

		var cvb3 = document.createElement("div");
		cvb3.setAttribute("id", "cvb3Container");
		cvb3.style.cursor = "ew-resize";

		cvb3.style.width = cvb1.style.width;
		cvb3.style.height = String(this.minXaxisHeight) + "px";
		cvb3.style.display = "inline-block";
		cvb3.style.marginTop = "2px";

		this.cvb1 = cvb1;
		this.cvb2 = cvb2;
		this.cvb3 = cvb3;

		this.Container.appendChild(cvb1);
		this.Container.appendChild(cvb2);
		this.Container.appendChild(cvb3);
	}

	changeSize(newWidth, newHeight) {
		this.cssWidth = newWidth;
		this.cssHeight = newHeight;

		for (element of coll) {
			element.cv1.value.width = String(this.cssWidth) + "px";
			element.cv1.value.height = String(this.cssHeight) + "px";
			element.cv2.value.height = String(this.cssHeight) + "px";
		}
	}

	addLayer(id, addXaxis, addYaxix) {
		if (this.coll.has(id)) {
			console.log('Layer with that ID already exists');
			return this.getLayer(id);
		}
		else {

			var canvas1 = document.createElement("canvas");
			this.cvb1.appendChild(canvas1);

			canvas1.style.position = "absolute";
			canvas1.style.zIndex = id;
			canvas1.style.height = String(this.cssHeight - this.minXaxisHeight - this.extraBorderAndMarginPx) + "px";
			canvas1.style.width = String((this.cssWidth - this.minYaxixWidth - this.extraBorderAndMarginPx)) + "px";

			canvas1.height = Math.floor((this.cssHeight - this.minXaxisHeight - this.extraBorderAndMarginPx) * devicePixelRatio);
			canvas1.width = Math.floor((this.cssWidth - this.minYaxixWidth) * devicePixelRatio);

			var canvas2;
			var canvas3;

			if (addYaxix) {
				canvas2 = document.createElement("canvas"); //yaxis
				this.cvb2.appendChild(canvas2);
				canvas2.style.position = "absolute";
				canvas2.style.zIndex = id;

				canvas2.height = Math.floor((this.cssHeight - this.minXaxisHeight - this.extraBorderAndMarginPx) * devicePixelRatio);
				canvas2.width = Math.floor(this.minYaxixWidth * devicePixelRatio);

				canvas2.style.height = String(this.cssHeight - this.minXaxisHeight - this.extraBorderAndMarginPx) + "px";
				canvas2.style.width = String(this.minYaxixWidth) + "px";
			}

			if (addXaxis) {
				canvas3 = document.createElement("canvas"); //xaxis
				this.cvb3.appendChild(canvas3);
				canvas3.style.position = "absolute";
				canvas3.style.zIndex = id;
				canvas3.style.height = String(this.minXaxisHeight) + "px";
				canvas3.style.width = canvas1.style.width;

				canvas3.height = Math.floor(this.minXaxisHeight * devicePixelRatio);
				canvas3.width = canvas1.width;
			}

			this.coll.set(id, {
				cv1: canvas1,
				cv2: canvas2,
				cv3: canvas3,
			});

			this.totalLayers += 1;

			console.log("Layer added of id: " + id);
			return this.getLayer(id);
		}
	}

	changeID() {

	}

	removeLayer(id) {
		if (coll.has(id)) {

			this.Container.removeChild(coll.get(id));
			this.coll.delete(id);

			this.totalLayers -= 1;
			console.log("Layer has been removed");
		}
	}

	getLayer(id) {
		return this.coll.get(id);
	}

	getAllLayersWithId() {
		return this.coll.values();
	}
}