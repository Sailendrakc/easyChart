import candleRenderer from "./candleRenderer.js";
import dataRenderer from "./dataRenderer.js";
import OnMouseDrag from "./onMouesDrag.js";

var mainDisplay;
var displays = new Map();

//a src of data.
var dataa =
    [
        [
            "1662604200000",
            "19232.4",
            "19251.8",
            "19209.6",
            "19209.6",
            "12.16140589",
            "233937.42673334"
        ],
        [
            "1662603300000",
            "19214",
            "19251.7",
            "19214",
            "19232.4",
            "18.82377226",
            "362025.10382242"
        ],
        [
            "1662602400000",
            "19181.7",
            "19221.7",
            "19181.6",
            "19213.1",
            "26.66955311",
            "512029.48621692"
        ],
        [
            "1662601500000",
            "19173.6",
            "19212.1",
            "19171.9",
            "19181.6",
            "161.60600666",
            "3102054.85359121"
        ],
        [
            "1662600600000",
            "19297.9",
            "19304.4",
            "19151",
            "19173.7",
            "207.81301216",
            "3994602.23649912"
        ],
        [
            "1662599700000",
            "19296.8",
            "19309.5",
            "19271.7",
            "19297.9",
            "11.10312414",
            "214243.14563261"
        ],
        [
            "1662598800000",
            "19304.2",
            "19323.8",
            "19294",
            "19295.8",
            "34.54588178",
            "667055.92383459"
        ],
        [
            "1662597900000",
            "19268.3",
            "19306.3",
            "19258.2",
            "19304.4",
            "33.85726698",
            "653104.99814556"
        ],
        [
            "1662597000000",
            "19346.2",
            "19347",
            "19240",
            "19268.1",
            "50.37685471",
            "971268.4302847"
        ],
        [
            "1662596100000",
            "19349",
            "19380.8",
            "19338.4",
            "19346.1",
            "43.80190428",
            "847994.51417928"
        ],
        [
            "1662595200000",
            "19289",
            "19364.5",
            "19284.2",
            "19349",
            "175.24926381",
            "3389528.47618046"
        ],
        [
            "1662594300000",
            "19280.5",
            "19307.3",
            "19245.2",
            "19289.1",
            "34.82023345",
            "671222.74374699"
        ],
        [
            "1662593400000",
            "19311.4",
            "19313.2",
            "19280.3",
            "19280.9",
            "25.14270109",
            "485158.04858216"
        ],
        [
            "1662592500000",
            "19302.3",
            "19333.4",
            "19283.3",
            "19312.2",
            "43.22817498",
            "834740.67753033"
        ],
        [
            "1662591600000",
            "19336.4",
            "19351.7",
            "19293.4",
            "19301.7",
            "45.80956957",
            "884741.37562596"
        ],
        [
            "1662590700000",
            "19340.2",
            "19351.4",
            "19323.8",
            "19337.8",
            "65.43284027",
            "1265463.14671473"
        ],
        [
            "1662589800000",
            "19380.6",
            "19402.1",
            "19315.8",
            "19340.2",
            "47.98195679",
            "928283.56243671"
        ],
        [
            "1662588900000",
            "19395.8",
            "19417.8",
            "19371.7",
            "19381.3",
            "40.62579794",
            "787868.44625193"
        ],
        [
            "1662588000000",
            "19362.6",
            "19426.5",
            "19352.6",
            "19395.7",
            "69.51129443",
            "1347729.13105192"
        ],
        [
            "1662587100000",
            "19313.2",
            "19392.5",
            "19313.2",
            "19362.9",
            "47.50156355",
            "919432.55775296"
        ],
        [
            "1662586200000",
            "19357.7",
            "19376.6",
            "19269.7",
            "19313.1",
            "64.82621308",
            "1252971.63695457"
        ],
        [
            "1662585300000",
            "19394.6",
            "19410",
            "19332.7",
            "19357.7",
            "63.98502401",
            "1239113.36001981"
        ],
        [
            "1662584400000",
            "19385.2",
            "19457.6",
            "19382",
            "19394.6",
            "120.4137126",
            "2338232.96140668"
        ],
        [
            "1662583500000",
            "19310.6",
            "19450.2",
            "19310.5",
            "19384.8",
            "295.98949247",
            "5739051.55205903"
        ],
        [
            "1662582600000",
            "19214.8",
            "19339.6",
            "19202.6",
            "19310.6",
            "432.8694578",
            "8344650.60779802"
        ],
        [
            "1662581700000",
            "18998",
            "19260.7",
            "18998",
            "19214.1",
            "500.00122053",
            "9589141.56615362"
        ],
        [
            "1662580800000",
            "18991.7",
            "19034.4",
            "18989.8",
            "18996.8",
            "66.34543423",
            "1261177.6193704"
        ],
        [
            "1662579900000",
            "19054.3",
            "19073.6",
            "18993",
            "18994.2",
            "53.8778911",
            "1025891.23697392"
        ],
        [
            "1662579000000",
            "19106.7",
            "19133.4",
            "19053.1",
            "19054.3",
            "90.86046088",
            "1732984.38170179"
        ],
        [
            "1662578100000",
            "19160.2",
            "19195.3",
            "19106.7",
            "19106.7",
            "120.80842976",
            "2314101.12673375"
        ],
        [
            "1662577200000",
            "19075.3",
            "19163.9",
            "19051.8",
            "19159.3",
            "95.52902317",
            "1825568.15019806"
        ],
        [
            "1662576300000",
            "19024.8",
            "19182.2",
            "19019.2",
            "19075.2",
            "258.13232925",
            "4935501.90568886"
        ],
        [
            "1662575400000",
            "18982.7",
            "19031.2",
            "18960.7",
            "19024.7",
            "135.29068958",
            "2568494.00380628"
        ],
        [
            "1662574500000",
            "18983.9",
            "19002.5",
            "18969.4",
            "18983",
            "9.75477489",
            "185154.0350738"
        ],
        [
            "1662573600000",
            "18995.6",
            "19047.8",
            "18974.9",
            "18984.8",
            "59.17996126",
            "1125090.91787263"
        ],
        [
            "1662572700000",
            "18987",
            "19031.3",
            "18970.1",
            "18995",
            "605.58020143",
            "11507854.98089542"
        ],
        [
            "1662571800000",
            "18908.9",
            "18995.1",
            "18908.9",
            "18987.7",
            "34.66426042",
            "656345.2958998"
        ],
        [
            "1662570900000",
            "18937.5",
            "18961.9",
            "18905.3",
            "18908.9",
            "67.80723012",
            "1284517.57274179"
        ],
        [
            "1662570000000",
            "18917.6",
            "18950",
            "18913.2",
            "18935.7",
            "155.46391494",
            "2943741.82346006"
        ],
        [
            "1662569100000",
            "18941.1",
            "18999.9",
            "18894.2",
            "18914.3",
            "218.66827959",
            "4147537.01645596"
        ],
        [
            "1662568200000",
            "18887.5",
            "18969.4",
            "18879.9",
            "18941.8",
            "68.5704279",
            "1298253.85970582"
        ],
        [
            "1662567300000",
            "18891.6",
            "18896.9",
            "18853.1",
            "18887.8",
            "37.09575412",
            "700395.64255116"
        ],
        [
            "1662566400000",
            "18871",
            "18950",
            "18866",
            "18893.1",
            "79.94008469",
            "1511548.41969601"
        ],
        [
            "1662565500000",
            "18857.1",
            "18908.8",
            "18857.1",
            "18870.9",
            "64.23688019",
            "1213421.61128847"
        ],
        [
            "1662564600000",
            "18869.2",
            "18890",
            "18850.7",
            "18857",
            "24.94487786",
            "470721.39332012"
        ],
        [
            "1662563700000",
            "18926.5",
            "18928.1",
            "18868.8",
            "18869.1",
            "66.69988381",
            "1260397.87662524"
        ],
        [
            "1662562800000",
            "18903.9",
            "18935.2",
            "18893.7",
            "18925.5",
            "89.6395483",
            "1695740.79741745"
        ],
        [
            "1662561900000",
            "18912.7",
            "18933.9",
            "18886.2",
            "18902.8",
            "63.57297228",
            "1202497.63834257"
        ],
        [
            "1662561000000",
            "18915.5",
            "18961.9",
            "18890",
            "18911.4",
            "116.96826314",
            "2213661.25077942"
        ],
        [
            "1662560100000",
            "18845.8",
            "18916.6",
            "18816.8",
            "18911.7",
            "53.01675005",
            "1000882.70803368"
        ],
        [
            "1662559200000",
            "18840.2",
            "18861.8",
            "18817",
            "18846.5",
            "53.29625148",
            "1004334.27102163"
        ],
        [
            "1662558300000",
            "18886.5",
            "18897.7",
            "18832.9",
            "18841.7",
            "73.48057041",
            "1385694.36794107"
        ],
        [
            "1662557400000",
            "18839.5",
            "18930",
            "18838.8",
            "18886.4",
            "165.31468278",
            "3122352.12992589"
        ],
        [
            "1662556500000",
            "18823.3",
            "18862.4",
            "18810.3",
            "18837.8",
            "68.48947411",
            "1290594.67927813"
        ],
        [
            "1662555600000",
            "18780.8",
            "18891.8",
            "18776",
            "18822.8",
            "313.34550294",
            "5904557.65062366"
        ],
        [
            "1662554700000",
            "18739.4",
            "18786.3",
            "18721.7",
            "18780.9",
            "88.02629029",
            "1650278.49080594"
        ],
        [
            "1662553800000",
            "18718",
            "18747.7",
            "18717",
            "18739.5",
            "69.09052373",
            "1294739.45759712"
        ],
        [
            "1662552900000",
            "18711.2",
            "18749.8",
            "18680.4",
            "18717.9",
            "48.62675395",
            "909790.96132801"
        ],
        [
            "1662552000000",
            "18738.9",
            "18752.5",
            "18696.6",
            "18712.9",
            "31.11558452",
            "582367.15665393"
        ],
        [
            "1662551100000",
            "18747.8",
            "18751.6",
            "18727.5",
            "18738.3",
            "12.05653857",
            "225942.64469059"
        ],
        [
            "1662550200000",
            "18757.6",
            "18781.8",
            "18711.3",
            "18746.6",
            "23.81804725",
            "446520.04649877"
        ],
        [
            "1662549300000",
            "18721.9",
            "18763.2",
            "18703.3",
            "18757.6",
            "40.2221247",
            "753813.06610499"
        ],
        [
            "1662548400000",
            "18744",
            "18752.2",
            "18698.1",
            "18721.9",
            "80.175996",
            "1500373.43920225"
        ],
        [
            "1662547500000",
            "18749.1",
            "18762.7",
            "18736.4",
            "18743.9",
            "16.47386756",
            "308863.51187598"
        ],
        [
            "1662546600000",
            "18766.4",
            "18767",
            "18742.5",
            "18749",
            "25.61296037",
            "480354.62566478"
        ],
        [
            "1662545700000",
            "18761.2",
            "18774.9",
            "18729.6",
            "18766.4",
            "51.31438167",
            "962112.52419873"
        ],
        [
            "1662544800000",
            "18790",
            "18798.4",
            "18753.5",
            "18761.7",
            "34.85208356",
            "654225.53676478"
        ],
        [
            "1662543900000",
            "18786.3",
            "18802.6",
            "18778.8",
            "18789.4",
            "15.42384943",
            "289823.05059614"
        ],
        [
            "1662543000000",
            "18780.1",
            "18792.7",
            "18770",
            "18786.2",
            "19.22494032",
            "361070.23813309"
        ],
        [
            "1662542100000",
            "18770.2",
            "18793",
            "18769.5",
            "18780.6",
            "17.63275896",
            "331195.0491099"
        ],
        [
            "1662541200000",
            "18807.6",
            "18820.1",
            "18765.7",
            "18770.2",
            "38.00047873",
            "714123.89407136"
        ],
        [
            "1662540300000",
            "18795.4",
            "18819.4",
            "18777.1",
            "18807.5",
            "78.22149595",
            "1470324.11809978"
        ],
        [
            "1662539400000",
            "18792",
            "18801.1",
            "18776",
            "18795.2",
            "21.78039064",
            "409295.27853181"
        ],
        [
            "1662538500000",
            "18805.6",
            "18811.2",
            "18771.9",
            "18792",
            "79.40185433",
            "1492454.66291861"
        ],
        [
            "1662537600000",
            "18800.7",
            "18859",
            "18790.3",
            "18805.2",
            "42.89141726",
            "807151.43294457"
        ],
        [
            "1662536700000",
            "18793.5",
            "18825.8",
            "18777.3",
            "18800.7",
            "57.4743579",
            "1080733.9632651"
        ],
        [
            "1662535800000",
            "18757.7",
            "18793.5",
            "18747.7",
            "18793.5",
            "30.08776994",
            "564813.62837463"
        ],
        [
            "1662534900000",
            "18774.8",
            "18781",
            "18727.8",
            "18757.6",
            "60.93293507",
            "1142797.47745555"
        ],
        [
            "1662534000000",
            "18795.9",
            "18806.3",
            "18760.3",
            "18774.7",
            "28.29238263",
            "531469.02565655"
        ],
        [
            "1662533100000",
            "18799.1",
            "18840.8",
            "18793.6",
            "18793.6",
            "63.6337608",
            "1197561.53451654"
        ],
        [
            "1662532200000",
            "18782.8",
            "18803.7",
            "18770.4",
            "18799.2",
            "19.15263613",
            "359812.78661988"
        ],
        [
            "1662531300000",
            "18801.4",
            "18801.6",
            "18763.7",
            "18783",
            "47.01934158",
            "882878.19406646"
        ],
        [
            "1662530400000",
            "18759.9",
            "18821.5",
            "18730.1",
            "18804.3",
            "89.52470845",
            "1680215.3315873"
        ],
        [
            "1662529500000",
            "18782.3",
            "18795.2",
            "18744.7",
            "18760",
            "128.78313804",
            "2417332.34457762"
        ],
        [
            "1662528600000",
            "18769.9",
            "18781.5",
            "18762.9",
            "18781.5",
            "25.017495",
            "469515.04824149"
        ],
        [
            "1662527700000",
            "18754.4",
            "18789.9",
            "18745",
            "18769.9",
            "28.16835671",
            "528728.88542818"
        ],
        [
            "1662526800000",
            "18722.7",
            "18772.4",
            "18712.2",
            "18754.2",
            "66.56409923",
            "1247533.13993871"
        ],
        [
            "1662525900000",
            "18727.2",
            "18760.2",
            "18716",
            "18722.6",
            "64.45988627",
            "1207932.67773479"
        ],
        [
            "1662525000000",
            "18700.1",
            "18737.5",
            "18683.4",
            "18727.3",
            "92.28519284",
            "1726033.71198192"
        ],
        [
            "1662524100000",
            "18704.6",
            "18734.3",
            "18673.2",
            "18700",
            "41.72654604",
            "780170.87349468"
        ],
        [
            "1662523200000",
            "18743.6",
            "18744.2",
            "18695.4",
            "18704.7",
            "24.83728243",
            "464824.95688513"
        ],
        [
            "1662522300000",
            "18704.6",
            "18746.5",
            "18690",
            "18744.7",
            "60.43287745",
            "1130781.50380937"
        ],
        [
            "1662521400000",
            "18702.1",
            "18734.3",
            "18683",
            "18704.8",
            "67.78632186",
            "1268593.91082534"
        ],
        [
            "1662520500000",
            "18655",
            "18704.6",
            "18610.2",
            "18702.9",
            "40.53703214",
            "756360.40139353"
        ],
        [
            "1662519600000",
            "18613.4",
            "18666.5",
            "18612.7",
            "18653.5",
            "31.00673786",
            "577885.99683696"
        ],
        [
            "1662518700000",
            "18665",
            "18686.5",
            "18613",
            "18613.4",
            "164.3781442",
            "3066831.2968326"
        ],
        [
            "1662517800000",
            "18639.3",
            "18700.8",
            "18617.7",
            "18665",
            "113.5628914",
            "2118534.51810493"
        ],
        [
            "1662516900000",
            "18748.5",
            "18766.3",
            "18505.7",
            "18639.4",
            "519.21412694",
            "9649689.5305154"
        ],
        [
            "1662516000000",
            "18787.9",
            "18825",
            "18714.4",
            "18745.5",
            "138.66471116",
            "2602549.03682204"
        ],
        [
            "1662515100000",
            "18789.3",
            "18834.6",
            "18784.1",
            "18788",
            "68.62772367",
            "1290922.46874694"
        ]
    ];

init();


function init() {
    //data renderer should take a empty div as a container.
    //maindisplay should take settings to initialize
    mainDisplay = new dataRenderer(document.getElementById("holder"), {
        height: 700,
        width: 1000,
    }
    );

    //add different renderers/display to mainDisplay
    var candleDisplay = mainDisplay.addRenderer(new candleRenderer(mainDisplay), "candle");


    //call a function in candleDisplay to add a data source.
    candleDisplay.addNewDataSource(dataa); //append

    //listen for keyboard space and call the function
    var boundhandler = generateRandomTickerData.bind(this);
    document.addEventListener('keydown', boundhandler);

}



