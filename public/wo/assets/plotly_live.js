const WSS_URL = 'wss://116.80.60.120/wss/';

let dataSocket = new WebSocket(WSS_URL);

let hold_flag = false;
let setup;
let setup_backup;
let last_rdata;
let status_str = "チャート更新中";

// setup default value
setup = {
  "data_type": "setup",
  "title": "Ｗｅｂオシロスコープ",
  "trace_count": 3,
  "x_axis": {
    "count": 500,
    "min": 0,
    "max": 500,
    "div": 10,
    "name": "Time",
    "unit": "[ms]"
  },
  "y_axis": {
    "min": -5,
    "max": 5,
    "div": 10,
    "name": "Volt",
    "unit": "[V/div]"
  },
  "ch": [
    {
      "name": "ch0",
      "display": "on",
      "offset": 3.5,
      "color": "white"
    },
    {
      "name": "ch1",
      "display": "on",
      "offset": 0,
      "color": "yellow"
    },
    {
      "name": "ch2",
      "display": "on",
      "offset": -3,
      "color": "lime"
    }
  ],
  "sync": {
    "mode": "auto",
    "position": 10,
    "level": 0,
    "edge": "rise",
    "channel": 0
  },
  "sample_unit": "ms",
  "sample_period": 0.01,
  "update_period": 0.2
}

//
//Recieve event function.
//
const onMessage = (e) => {
  const rdata = JSON.parse(e.data);
  // console.log(rdata);

  if (rdata.data_type == 'setup') {
    setup = set_setup(rdata); //set received setup
    setup_backup = setup;
    return;
  } else if (rdata.data_type == 'data') {
    if (hold_flag == true) return;
    last_rdata = rdata;
    draw_lines(rdata);
  }
}
dataSocket.onmessage = function (e) {
  onMessage((e));
};

//
// Socket closed.
//
const onClose = (e) => {
  console.error('plotly live socket closed unexpectedly');
  dataSocket = new WebSocket(WSS_URL);
  dataSocket.onmessage = function (e) {
    onMessage((e));
  };
  dataSocket.onclose = function (e) {
    onClose((e));
  };
}
dataSocket.onclose = function (e) {
  onClose(e);
};

//
//recieved setup data change to js object.
//
function set_setup(rdata) {

  console.log(rdata);

  let js = JSON.stringify(rdata);

  setup = JSON.parse(js);

  if (setup.sync.mode.toUpperCase() === "Normal".toUpperCase()) {
    let mode = document.getElementById('trg_normal');
    mode.checked = true;
  } else if (setup.sync.mode.toUpperCase() === "Single".toUpperCase()) {
    let mode = document.getElementById('trg_single');
    mode.checked = true;
  } else {
    let mode = document.getElementById('trg_auto');
    mode.checked = true;
  }

  if (setup.sync.edge.toUpperCase() === "Rise".toUpperCase()) {
    let dir = document.getElementById('trg_rise');
    dir.checked = true;
  } else if (setup.sync.edge.toUpperCase() === "Fall".toUpperCase()) {
    let dir = document.getElementById('trg_fall');
    dir.checked = true;
  } else {
    let dir = document.getElementById('trg_both');
    dir.checked = true;
  }

  let t_level = document.getElementById('t_level');
  t_level.value = setup.sync.level;
  let t_pos = document.getElementById('t_pos');
  t_pos.value = setup.sync.position;
  let s_rate = document.getElementById('s_rate');
  s_rate.value = setup.sample_period;
  let u_rate = document.getElementById('u_rate');
  u_rate.value = setup.update_period;

  /*
    if(setup.sample_unit.toUpperCase() === "sec".toUpperCase()){
      let unit = document.getElementById('u_sec');
      unit.checked = true;
    }
    else if(setup.sample_unit.toUpperCase() === "ms".toUpperCase()){
      let unit = document.getElementById('u_ms');
      unit.checked = true;
    }
    else if(setup.sample_unit.toUpperCase() === "us".toUpperCase()){
      let unit = document.getElementById('u_us');
      unit.checked = true;
    }
    else{
      let unit = document.getElementById('u_ns');
      unit.checked = true;
    }
  */
  if (setup.ch[0].display.toUpperCase() === "on".toUpperCase()) {
    let chk = document.getElementById('chk_ch0');
    chk.checked = true;
  }
  if (setup.ch[1].display.toUpperCase() === "on".toUpperCase()) {
    let chk = document.getElementById('chk_ch1');
    chk.checked = true;
  }
  if (setup.ch[2].display.toUpperCase() === "on".toUpperCase()) {
    let chk = document.getElementById('chk_ch2');
    chk.checked = true;
  }

  let ch;
  switch (setup.sync.channel) {
    case 0:
      ch = document.getElementById('trg_ch0');
      ch.checked = true;
      break;
    case 1:
      ch = document.getElementById('trg_ch1');
      ch.checked = true;
      break;
    default:
      ch = document.getElementById('trg_ch2');
      ch.checked = true;
      break;
  }

  return JSON.parse(js);
}

//
// Make Plotly chart data.
//
function make_lines(rdata, setup_info) {

  let trigger = {
    x: [setup_info.x_axis.max * setup_info.sync.position / 100 * setup_info.sample_period,
      setup_info.x_axis.max * setup_info.sync.position / 100 * setup_info.sample_period],
    y: [setup_info.y_axis.min, setup_info.y_axis.max],
    mode: 'lines',
    type: 'scattergl',
    name: 'T-pos',
    line: {width: 1, dash: 'dash', color: 'red'}
  };

  let level = {
    x: [setup_info.x_axis.min * setup_info.sample_period, setup_info.x_axis.max * setup_info.sample_period],
    y: [setup_info.sync.level, setup_info.sync.level],
    mode: 'lines',
    type: 'scattergl',
    name: 'T-lvl',
    line: {width: 1, dash: 'dash', color: 'orange'},
  };

  let data = [trigger, level];
  let color = ['white', 'yellow', 'pink'];
  let n = rdata["trace_count"];

  for (let i = 0; i < n; i++) {
    if (setup.ch[i].display.toUpperCase() != 'on'.toUpperCase()) continue;
    let s = 'trace' + i.toString(10);
    let trace = JSON.parse(JSON.stringify(rdata[s])); //deep copy data
    trace["type"] = "scattergl";
    trace["mode"] = "lines";
    trace["line"] = {width: 1, color: setup_info.ch[i].color};
    trace["name"] = setup_info.ch[i].name;
    for (let j = 0; j < setup_info.x_axis.count; j++) {
      trace['y'][j] += setup_info.ch[i].offset;
    }
    data.push(trace);

    let ground = {
      x: [setup_info.x_axis.min * setup_info.sample_period, setup_info.x_axis.max * setup_info.sample_period],
      y: [setup_info.ch[i].offset, setup_info.ch[i].offset],
      type: 'scattergl',
      mode: 'lines',
      line: {width: 1, color: setup_info.ch[i].color},
      name: setup_info.ch[i].name + '-G',

    }
    data.push(ground);
  }

  return data;
}

//
// to make plotly layout.
//
function make_layout(setup_info) {

  setup_info.x_axis.div = setup_info.x_axis.div == 0 ? 10 : setup_info.x_axis.div;
  setup_info.y_axis.div = setup_info.y_axis.div == 0 ? 10 : setup_info.y_axis.div;

  let strUnit = String(Number((setup_info.sample_period * setup_info.x_axis.max / setup_info.x_axis.div).toPrecision(6)));

  const baseColor = '#252525';//indigo
  let layout = {
    title: {text: status_str, x: 0.02, font: {color: 'white'}},
    autosize: false,
    width: 800,
    height: 650,
    //marker:{color:'rgb(16,32,77)'},
    xaxis: {
      title: setup_info.x_axis.name + '[' + strUnit + 's/div]',
      dtick: (setup_info.x_axis.count / setup_info.x_axis.div * setup_info.sample_period),
      range: [setup_info.x_axis.min * setup_info.sample_period, setup_info.x_axis.max * setup_info.sample_period],
      linewidth: 0.5,
      gridcolor: 'darkgreen',
      color: 'white',
      ticks: 'outside',
      showline: true,
      zeroline: false,
      tickfont: {
        color: baseColor
      },
    },

    yaxis: {
      title: setup_info.y_axis.name + setup_info.y_axis.unit,
      dtick: ((setup_info.y_axis.max - setup_info.y_axis.min) / setup_info.y_axis.div),
      range: [setup_info.y_axis.min, setup_info.y_axis.max],
      linewigth: 0.5,
      gridcolor: 'darkgreen',
      color: 'white',
      ticks: 'outside',
      showline: true,
      tickwidth: 2,
      zeroline: false,
      tickfont: {
        color: baseColor
      },
    },

    plot_bgcolor: 'black',
    paper_bgcolor: baseColor,
    margin: {l: 40, r: 40, b: 40, t: 40, pad: 0},
    //showlegend:false,
    legend: {
      font: {
        color: 'white'
      }
    },
  };

  return layout;

}

//
//send setup information
//
function send_setup() {
  setup.data_type = 'tempolary';
  let setup_json = JSON.stringify(setup);
  dataSocket.send(setup_json);
}

//
//save setup information
//
function save_setup() {
  setup.data_type = 'save';
  let setup_json = JSON.stringify(setup);
  dataSocket.send(setup_json);
}

//
//reload setup information
//
function reload_setup() {
  setup.data_type = 'reload';
  let setup_json = JSON.stringify(setup);
  dataSocket.send(setup_json);
}

//
//init setup information
//
function init_setup() {
  setup.data_type = 'init';
  let setup_json = JSON.stringify(setup);
  dataSocket.send(setup_json);
}

//
// Trigger mode selected.
//
function trg_autoClick() {
  setup.sync.mode = "Auto";
  send_setup();
}

function trg_normalClick() {
  setup.sync.mode = "Normal";
  send_setup();
}

function trg_singleClick() {
  setup.sync.mode = "Single";
  send_setup();
}

//
// Trigger direction selected.
//
function trg_riseClick() {
  setup.sync.edge = "Rise";
  send_setup();
}

function trg_fallClick() {
  setup.sync.edge = "Fall";
  send_setup();
}

function trg_bothClick() {
  setup.sync.edge = "Both";
  send_setup();
}

//
// Trigger direction selected.
//
function trg_ch0Click() {
  setup.sync.channel = 0;
  send_setup();
}

function trg_ch1Click() {
  setup.sync.channel = 1;
  send_setup();
}

function trg_ch2Click() {
  setup.sync.channel = 2;
  send_setup();
}

//
// Run/Stop clicked
//
function run_stopClick() {
  const run_stop = document.getElementById('run_stop');
  if (run_stop.textContent == "チャート更新中") {
    run_stop.textContent = "チャート更新停止";
    status_str = "チャート更新中";
    hold_flag = false;
  } else {
    run_stop.textContent = "チャート更新中";
    status_str = "チャート更新停止";
    Plotly.title = "チャート更新停止";
    hold_flag = true;
  }
  draw_lines(last_rdata);
}

//
// Draw lines
//
function draw_lines(rdata) {
  let data = make_lines(rdata, setup);  //make draw lines
  let layout = make_layout(setup);      //make chart layout
  Plotly.newPlot('chart-wo', data, layout); //draw lines
}

//
// Trigger level clicked function
//
function l_Click(id, step, min, max) {
  let t = document.getElementById(id);
  let v = Number(t.value);
  let scale;

  let str = (max - min).toExponential(1);
  let l = Number(str.substring(0, 1));
  switch (l) {
    case 1:
      scale = 1;
      break;
    case 2:
      scale = 2;
      break;
    default:
      scale = 5;
      break;
  }

  v += (max - min) * step / scale;
  if (v < min) v = min;
  if (v > max) v = max;
  v = v.toPrecision(3);
  t.value = parseFloat(v, 10);
  return v;
}

//
//Trigger level input changed
//
function l_changeEvent() {
  let t = document.getElementById('t_level');
  let v = Number(t.value);
  if (v < setup.y_axis.min) v = setup.y_axis.min;
  if (v > setup.y_axis.max) v = setup.y_axis.max;
  v = v.toPrecision(3);
  t.value = parseFloat(v, 10);
  setup.sync.level = v;
  if ((setup.sync.update_period <= 1) || (hold_flag == true)) draw_lines(last_rdata);
  send_setup();
}

//
// Trigger level ++ cliced
//
function l_plusplusClick() {
  let lv = l_Click(id = 't_level', step = 0.1, min = setup.y_axis.min, max = setup.y_axis.max);
  setup.sync.level = lv;
  if ((setup.sync.update_period <= 1) || (hold_flag == true)) draw_lines(last_rdata);
  send_setup();
}

//
// Trigger level + cliced
//
function l_plusClick() {
  let lv = l_Click(id = 't_level', step = 0.01, min = setup.y_axis.min, max = setup.y_axis.max);
  setup.sync.level = lv;
  if ((setup.sync.update_period <= 1) || (hold_flag == true)) draw_lines(last_rdata);
  send_setup();
}

//
// Trigger level - cliced
//
function l_minusClick() {
  let lv = l_Click(id = 't_level', step = -0.01, min = setup.y_axis.min, max = setup.y_axis.max);
  setup.sync.level = lv;
  if ((setup.sync.update_period <= 1) || (hold_flag == true)) draw_lines(last_rdata);
  send_setup();
}

//
// Trigger level -- cliced
//
function l_minusminusClick() {
  let lv = l_Click(id = 't_level', step = -0.1, min = setup.y_axis.min, max = setup.y_axis.max);
  setup.sync.level = lv;
  if ((setup.sync.update_period <= 1) || (hold_flag == true)) draw_lines(last_rdata);
  send_setup();
}

//
//Trigger position input changed
//
function t_changeEvent() {
  let t = document.getElementById('t_pos');
  let v = Number(t.value);
  if (v < 0) v = 0;
  if (v > 100) v = 100;
  v = v.toPrecision(3);
  t.value = parseFloat(v, 10);
  setup.sync.position = v;
  if ((setup.sync.update_period <= 1) || (hold_flag == true)) draw_lines(last_rdata);
  send_setup();
}

//
// Trigger posision clicked function
//
function t_Click(id, step) {
  let t = document.getElementById(id);
  let v = Number(t.value);
  v += step;
  if (v < 0) v = 0;
  if (v > 100) v = 100;
  v = v.toPrecision(3);
  t.value = parseFloat(v, 10);

  return v;
}

//
// Trigger position << clicked
//
function t_leftleftClick() {
  let pos = t_Click(id = 't_pos', step = -10);
  setup.sync.position = pos;
  if ((setup.sync.update_period <= 1) || (hold_flag == true)) draw_lines(last_rdata);
  send_setup();
}

//
// Trigger position < clicked
//
function t_leftClick() {
  let pos = t_Click(id = 't_pos', step = -1);
  setup.sync.position = pos;
  if ((setup.sync.update_period <= 1) || (hold_flag == true)) draw_lines(last_rdata);
  send_setup();
}

//
// Trigger position > clicked
//
function t_rightClick() {
  let pos = t_Click(id = 't_pos', step = 1);
  setup.sync.position = pos;
  if ((setup.sync.update_period <= 1) || (hold_flag == true)) draw_lines(last_rdata);
  send_setup();
}

//
// Trigger position >> clicked
//
function t_rightrightClick() {
  let pos = t_Click(id = 't_pos', step = 10);
  setup.sync.position = pos;
  if ((setup.sync.update_period <= 1) || (hold_flag == true)) draw_lines(last_rdata);
  send_setup();
}

//
// View Update unit sec clicked
//
function u_secClick() {
  let t = document.getElementById('s_rate');
  let v = Number(t.value);

  let unit = setup.sample_unit;

  if (unit == 'ms') {
    v /= 1000;
  } else if (unit == 'us') {
    v /= 1000000;
  }

  v = v.toPrecision(3);
  t.value = parseFloat(v, 10);

  setup.sample_unit = "sec";

  send_setup();
}

//
// View Update unit milli sec clicked
//
function u_msClick() {
  let t = document.getElementById('s_rate');
  let v = Number(t.value);

  let unit = setup.sample_unit;

  if (unit == 'sec') {
    v *= 1000;
  } else if (unit == 'us') {
    v /= 1000;
  }

  v = v.toPrecision(3);
  t.value = parseFloat(v, 10);

  setup.sample_unit = "ms";

  send_setup();
}

//
// View Update unit micro sec clicked
//
function u_usClick() {
  let t = document.getElementById('s_rate');
  let v = Number(t.value);

  let unit = setup.sample_unit;

  if (unit == 'sec') {
    v *= 1000000;
  } else if (unit == 'ms') {
    v *= 1000;
  }

  v = v.toPrecision(3);
  t.value = parseFloat(v, 10);

  setup.sample_unit = "us";
  send_setup();
}

//
// Sampling rate changed ivent
//
function s_changeEvent() {
  let t = document.getElementById('s_rate');
  let rate = Number(t.value);

  t.value = parseFloat(rate, 10);

  setup.sample_period = rate;

  send_setup();
}

//
//check rate
//
function check_rate() {
  let ts = document.getElementById('s_rate');
  let s = Number(ts.value);
  let tu = document.getElementById('u_rate');
  let u = Number(tu.value);

  if (s > u && u < 1) {
    setup.update_period = s;
    tu.value = s;
    send_setup();
  }
}


//
// Sampling rate clicked function larger equol 1
//
function sl_Click(id, step, min, max) {
  let t = document.getElementById(id);
  let v = Number(t.value);
  let s;
  let l = v.toString().length;

  if (step >= 10) {
    if (v < 100) {
      s = 10;
    } else {
      s = 100;
    }
  } else if (step >= 1) {
    if (v < 100) {
      s = 1;
    } else {
      s = 10;
    }
  } else if (step >= -1) {
    if (v <= 100) {
      s = -1;
    } else {
      s = -10;
    }
  } else {
    if (v <= 100) {
      s = -10;
    } else {
      s = -100;
    }
  }

  v += s;

  if (v <= 0) v = 1;
  if (v < min) v = min;
  if (max < v) v = max;

  let p = v.toString().length;
  if (l < p) v = Math.pow(10, l);

  t.value = parseInt(v, 10);

  return v;
}

//
// Sampling rate clicked function
//
function s_Click(id, step, min, max) {
  let t = document.getElementById(id);
  let v = Number(t.value);

  if (v > 1 || v == 0) return sl_Click(id, step, min, max);

  let scale;

  let str = v.toExponential(1);
  let l = Number(str.substring(0, 1));

  if (step >= 10) {
    scale = 10;
  } else if (step >= 1) {
    switch (l) {
      case 1:
        scale = 2;
        break;
      case 2:
        scale = 2.5;
        break;
      default:
        scale = 2;
        break;
    }
  } else if (step >= -1) {
    switch (l) {
      case 1:
        scale = 0.5;
        break;
      case 2:
        scale = 0.5;
        break;
      default:
        scale = 0.4;
        break;
    }
  } else {
    scale = 0.1;
  }

  v = v * scale;

  if (v < min) v = min;
  if (max < v) v = max;

  v = Number(v.toPrecision(3));

  if (v.toString().length >= 6) { // >= 0.0001
    t.value = v.toExponential(1);
  } else {
    t.value = parseFloat(v, 10);
  }
  return v;
}


//
// Sampling rate ++ clicked
//
function s_fastfastClick() {
  let rate = s_Click(id = 's_rate', step = 10, min = 1e-6, max = 1e6);
  setup.sample_period = rate;
  check_rate();
  send_setup();
}

//
// Sampling rate + clicked
//
function s_fastClick() {
  let rate = s_Click(id = 's_rate', step = 1, min = 1e-6, max = 1e6);
  setup.sample_period = rate;
  check_rate();
  send_setup();
}

//
// Sampling rate - clicked
//
function s_slowClick() {
  let rate = s_Click(id = 's_rate', step = -1, min = 1e-6, max = 1e6);
  setup.sample_period = rate;
  send_setup();
}

//
// Sampling rate -- clicked
//
function s_slowslowClick() {
  let rate = s_Click(id = 's_rate', step = -10, min = 1e-6, max = 1e6);
  setup.sample_period = rate;
  send_setup();
}

//
// Update rate changed evnent
//
function v_changeEvent() {
  let t = document.getElementById('u_rate');
  let v = Number(t.value);
  t.value = parseFloat(v, 10);
  setup.update_period = v;
  send_setup();
}

//
// Update rate ++ clicked
//
function u_fastfastClick() {
  let rate = s_Click(id = 'u_rate', step = 10, min = 1e-6, max = 3);
  setup.update_period = rate;
  send_setup();
}

//
// Update rate + clicked
//
function u_fastClick() {
  let rate = s_Click(id = 'u_rate', step = 1, min = 1e-6, max = 3);
  setup.update_period = rate;
  send_setup();
}

//
// Update rate - clicked
//
function u_slowClick() {
  let min = Number(document.getElementById('s_rate').value);
  if (min > 1) min = 1;
  let rate = s_Click(id = 'u_rate', step = -1, min = min, max = 3);
  setup.update_period = rate;
  send_setup();
}

//
// Update rate -- clicked
//
function u_slowslowClick() {
  let min = Number(document.getElementById('s_rate').value);
  if (min > 1) min = 1;
  let rate = s_Click(id = 'u_rate', step = -10, min = min, max = 3);
  setup.update_period = rate;
  console.log('rate', rate, min);
  send_setup();
}


function y_clClick() {
  setup.y_axis.min = setup_backup.y_axis.min;
  setup.y_axis.max = setup_backup.y_axis.max;
  if ((setup.sync.update_period <= 1) || (hold_flag == true)) draw_lines(last_rdata);
}

//
// setup paramiter calcurate 1/2/5
//
function y_mul125(scale) {
  str = Number.parseFloat(scale).toExponential(1);
  y = Number(str.substring(0, 1));
  switch (y) {
    case 1:
      return 2;
    case 2:
      return 2.5;
    default:
      return 2;
  }
}

//
// setup paramiter calcurate 1/2/5
//
function y_div125(scale) {
  str = Number.parseFloat(scale).toExponential(1);
  y = Number(str.substring(0, 1));
  switch (y) {
    case 1:
      return 1 / 2;
    case 2:
      return 1 / 2;
    default:
      return 1 / 2.5;
  }
}


//
// Y-axis plus clicked
//
function y_plusClick() {
  let y = y_mul125(Math.abs(setup.y_axis.max - setup.y_axis.min));
  setup.y_axis.min = setup.y_axis.min * y;
  setup.y_axis.max = setup.y_axis.max * y;
  if ((setup.sync.update_period <= 1) || (hold_flag == true)) draw_lines(last_rdata);
}

//
// Y-axis minus clicked
//
function y_minusClick() {
  let y = y_div125(Math.abs(setup.y_axis.max - setup.y_axis.min));
  setup.y_axis.min = setup.y_axis.min * y;
  setup.y_axis.max = setup.y_axis.max * y;
  if ((setup.sync.update_period <= 1) || (hold_flag == true)) draw_lines(last_rdata);
}

//
// Y-axis Up clicked
//
function y_moveupClick() {
  let offset = setup.y_axis.max - setup.y_axis.min;
  offset = offset / 10;
  setup.y_axis.min -= offset;
  setup.y_axis.max -= offset;
  if ((setup.sync.update_period <= 1) || (hold_flag == true)) draw_lines(last_rdata);
}

//
// Y-axis dwon clicked
//
function y_movedownClick() {
  let offset = setup.y_axis.max - setup.y_axis.min;
  offset = offset / 10;
  setup.y_axis.min += offset;
  setup.y_axis.max += offset;
  if ((setup.sync.update_period <= 1) || (hold_flag == true)) draw_lines(last_rdata);
}


//
// Y-axis Up clicked
//
function y0_moveupClick() {
  moveY(0, 1 / 20);
}

//
// Y-axis dwon clicked
//
function y0_movedownClick() {
  moveY(0, -1 / 20);
}

//
// Y-axis Up clicked
//
function y1_moveupClick() {
  moveY(1, 1 / 20);
}

//
// Y-axis dwon clicked
//
function y1_movedownClick() {
  moveY(1, -1 / 20);
}

//
// Y-axis Up clicked
//
function y2_moveupClick() {
  moveY(2, 1 / 20);
}

//
// Y-axis dwon clicked
//
function y2_movedownClick() {
  moveY(2, -1 / 20);
}


//
//Move up/down Y-axis
//
function moveY(ch, dir) {
  let step = (setup.y_axis.max - setup.y_axis.min) * dir;
  let offset = Math.round(setup.ch[ch].offset / Math.abs(step)) * Math.abs(step);
  setup.ch[ch].offset = offset + step;
//  if((setup.sync.update_period <= 1) || (hold_flag==true))draw_lines(last_rdata);
}

//
// X-axis x2 clicked
//
function x_plusClick() {
  let range = setup.x_axis.max - setup.x_axis.min;
  setup.x_axis.min -= range / 2;
  setup.x_axis.max += range / 2;
//  if((setup.sync.update_period <= 1) || (hold_flag==true))draw_lines(last_rdata);
}

//
// X-axis /2 clicked
//
function x_minusClick() {
  let range = setup.x_axis.max - setup.x_axis.min;
  setup.x_axis.min += range / 4;
  setup.x_axis.max -= range / 4;
//  if((setup.sync.update_period <= 1) || (hold_flag==true))draw_lines(last_rdata);
}

//
// X-axis < clicked
//
function x_moveleftClick() {
  let offset = setup.x_axis.max - setup.x_axis.min;
  offset = offset / 10;
  setup.x_axis.min += offset;
  setup.x_axis.max += offset;
//  if((setup.sync.update_period <= 1) || (hold_flag==true))draw_lines(last_rdata);
}

//
// X-axis > clicked
//
function x_moverightClick() {
  let offset = setup.x_axis.max - setup.x_axis.min;
  offset = offset / 10;
  setup.x_axis.min -= offset;
  setup.x_axis.max -= offset;
//  if((setup.sync.update_period <= 1) || (hold_flag==true))draw_lines(last_rdata);
}

//
//channel 0 chkbox clicked
//
function chk_ch0Click() {
  let chk = document.getElementById('chk_ch0');
  if (chk.checked == true) {
    setup.ch[0].display = 'on';
  } else {
    setup.ch[0].display = 'off';
  }
  if ((setup.sync.update_period <= 1) || (hold_flag == true)) draw_lines(last_rdata);
}

//
//channel 1 chkbox clicked
//
function chk_ch1Click() {
  let chk = document.getElementById('chk_ch1');
  if (chk.checked == true) {
    setup.ch[1].display = 'on';
  } else {
    setup.ch[1].display = 'off';
  }
  if ((setup.sync.update_period <= 1) || (hold_flag == true)) draw_lines(last_rdata);
}

//
//channel 2 chkbox clicked
//
function chk_ch2Click() {
  let chk = document.getElementById('chk_ch2');
  if (chk.checked == true) {
    setup.ch[2].display = 'on';
  } else {
    setup.ch[2].display = 'off';
  }
  if ((setup.sync.update_period <= 1) || (hold_flag == true)) draw_lines(last_rdata);
}

//
//Save button clicked
//
function save_setupClick() {
  save_setup();
  //alert('saved');
}

//
//Reload button clicked
//
function reload_setupClick() {
  reload_setup();
}

//
//init button clicked
//
function init_setupClick() {
  init_setup();
}

