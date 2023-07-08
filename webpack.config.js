import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let ex;

export default ex = {
    entry: "C:/Users/saile/OneDrive/Desktop/easyChart/easyChart/js/dataRenderer.js",

    output: {
        path: __dirname + "/dist",
        filename: "easyChart.js",
        library: {
            name: "easyChart",
            umdNamedDefine: true,
            type: "umd",
        },
    },
    mode: "development",

};
