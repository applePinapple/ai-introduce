// Native SVG reconstruction of the supplied 003 video, adapted to ReinBee light slides.
// All audience-facing text and pixel data are supplied by slide.neuralData.
const C = { ink: '#0B1220', gray: '#5B6B7F', blue: '#194DF9', yellow: '#F7AC01', lightBlue: '#E7EDFF', lightYellow: '#FFF2CC', white: '#FFF' };
// Content tokens retain their original semantic names for backward compatibility.
const tokenColors = { white: C.ink, green: C.blue, yellow: C.blue };
const f = n => Number(n.toFixed(3));

export function renderNeuralBlack(s, e) {
  const d = s.neuralData;
  const T = (x, y, value, size = 24, color = C.ink, anchor = 'start', extra = '') => `<text data-fit x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" ${extra}>${e(String(value))}</text>`;
  const L = (x1, y1, x2, y2, color = C.gray, width = .65, opacity = 1) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" opacity="${opacity}"/>`;
  const circle = (x, y, r, fill = C.white, stroke = C.blue, sw = .8) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const shade = value => {
    const v = Math.max(0, Math.min(1, value));
    const pale = [231, 237, 255], blue = [25, 77, 249];
    return `rgb(${pale.map((channel, i) => Math.round(channel + (blue[i] - channel) * v)).join(',')})`;
  };
  const brace = (x, y1, y2, label) => {
    const mid = (y1 + y2) / 2;
    return `<path d="M${x + 9},${y1} Q${x},${y1} ${x},${y1 + 12} V${mid - 10} Q${x},${mid} ${x - 6},${mid} Q${x},${mid} ${x},${mid + 10} V${y2 - 12} Q${x},${y2} ${x + 9},${y2}" fill="none" stroke="${C.gray}" stroke-width="1.1"/>${T(x - 22, mid + 9, label, 28, C.ink, 'end')}`;
  };
  const pixels = (key, x, y, size, { frame = true, grid = false, dots = false, values = false, color = C.blue, faint = false } = {}) => {
    const a = d.grids[key];
    if (!a) return '';
    const cell = size / 28;
    let out = frame ? `<rect x="${x - 4}" y="${y - 4}" width="${size + 8}" height="${size + 8}" fill="none" stroke="${C.blue}" stroke-width="1.2"/>` : '';
    for (let i = 0; i < 784; i++) {
      const v = a[i], px = x + (i % 28) * cell, py = y + Math.floor(i / 28) * cell;
      if (dots) {
        out += circle(f(px + cell / 2), f(py + cell / 2), f(cell * .38), shade(v), C.lightBlue, .5);
        if (values) out += T(f(px + cell / 2), f(py + cell * .64), v.toFixed(1), f(cell * .39), v > .8 ? C.white : C.ink, 'middle', 'font-family="Arial,sans-serif"');
      } else {
        if (v > .015) out += `<rect x="${f(px)}" y="${f(py)}" width="${f(cell + .03)}" height="${f(cell + .03)}" fill="${color}" opacity="${f(v * (faint ? .6 : 1))}"/>`;
        if (grid) out += `<rect x="${f(px)}" y="${f(py)}" width="${f(cell)}" height="${f(cell)}" fill="none" stroke="${C.gray}" stroke-opacity=".3" stroke-width=".32"/>`;
      }
    }
    return out;
  };
  const dimensions = (x, y, size) => {
    const top = y - 21, left = x - 21;
    return `<path d="M${x},${top + 7} V${top} H${x + size} V${top + 7}" fill="none" stroke="${C.gray}" stroke-width="1"/><path d="M${left + 7},${y} H${left} V${y + size} H${left + 7}" fill="none" stroke="${C.gray}" stroke-width="1"/>${T(x + size / 2, top - 8, d.labels.dimension, 30, C.ink, 'middle')}${T(left - 16, y + size / 2 + 8, d.labels.dimension, 30, C.ink, 'end')}`;
  };
  const inputY = [...Array.from({ length: 8 }, (_, i) => 34 + i * 24), ...Array.from({ length: 8 }, (_, i) => 278 + i * 24)];
  const hiddenY = Array.from({ length: 16 }, (_, i) => 60 + i * 24);
  const outputY = Array.from({ length: 10 }, (_, i) => 132 + i * 24);
  const ellipsis = (x, y = 230) => [0, 12, 24].map(v => circle(x, y + v, 1.3, C.gray, 'none')).join('');
  const network = ({ x = 307, active = false, feature = false, spacing = 108, yOffset = 0, yScale = 1, radius = 8.8 } = {}) => {
    const xs = [x, x + spacing, x + spacing * 2, x + spacing * 3], ys = [inputY, hiddenY, hiddenY, outputY].map(column => column.map(y => yOffset + y * yScale));
    let out = '';
    for (let layer = 0; layer < 3; layer++) {
      for (let i = 0; i < ys[layer].length; i++) for (let j = 0; j < ys[layer + 1].length; j++) {
        const high = feature && layer === 1 && i === 0 && j < 8;
        out += L(xs[layer], ys[layer][i], xs[layer + 1], ys[layer + 1][j], high ? C.yellow : C.gray, high ? 1.4 : .45, high ? 1 : .24);
      }
    }
    const keys = ['input', 'hidden1', 'hidden2', 'output'];
    for (let layer = 0; layer < 4; layer++) ys[layer].forEach((y, i) => {
      const v = d.activations?.[keys[layer]]?.[i] || 0;
      out += circle(xs[layer], y, radius, active ? shade(v) : C.white);
      if (layer === 3) out += T(xs[layer] + 15, y + 5, d.labels.outputDigits[i], 17);
    });
    out += ellipsis(xs[0], yOffset + 230 * yScale) + brace(xs[0] - 29, yOffset + 25 * yScale, yOffset + 454 * yScale, d.architecture[0]);
    return out;
  };
  const fan = ({ weighted = false, active = false, result = .02 } = {}) => {
    let out = '';
    for (let i = 0; i < inputY.length; i++) {
      const sign = [1, 1, 1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1, 1, -1, 1][i];
      out += L(124, inputY[i], 232, 228, weighted ? (sign > 0 ? C.blue : C.yellow) : C.gray, weighted ? 1.2 : .7, weighted ? .9 : .6);
    }
    inputY.forEach((y, i) => out += circle(124, y, 8.8, active ? shade(d.activations?.input?.[i] ?? [.64, .72, .63, 1, 0, .46, .6, .7][i % 8]) : C.white));
    return out + circle(232, 228, 8.8, shade(result)) + ellipsis(124) + brace(95, 25, 454, d.labels.inputCount);
  };
  const formula = (x, y, size = 28) => `<text data-fit x="${x}" y="${y}" font-size="${size}" font-style="italic">${d.formulaTokens.map(token => `<tspan fill="${tokenColors[token.color || 'white']}">${e(token.text)}</tspan>`).join('')}</text>`;
  const weightMap = (x, y, size, { overlay = false } = {}) => {
    const cell = size / 28;
    let out = '';
    if (!overlay) for (let i = 0; i <= 28; i++) {
      out += L(f(x + i * cell), y, f(x + i * cell), y + size, C.gray, .32, .3);
      out += L(x, f(y + i * cell), x + size, f(y + i * cell), C.gray, .32, .3);
    }
    for (let row = 5; row < 13; row++) for (let col = 8; col < 19; col++) {
      const positive = row >= 8 && row <= 10 && col >= 9 && col <= 17;
      const opacity = positive ? .72 : .55;
      out += `<rect x="${f(x + col * cell)}" y="${f(y + row * cell)}" width="${f(cell)}" height="${f(cell)}" fill="${positive ? C.blue : C.yellow}" opacity="${overlay ? opacity * .75 : opacity}"/>`;
    }
    return out;
  };
  let body = '';
  switch (s.neuralKind) {
    case 'black-network':
      body = pixels('seven', 30, 24, 124) + network({ active: true });
      break;
    case 'black-recognition':
      body = pixels('nine', 30, 24, 124) + network({ active: true });
      break;
    case 'black-pixels':
      body = pixels('nine', 109, 83, 364, { dots: true, frame: false, values: true }) + dimensions(109, 83, 364) + T(535, 100, d.labels.pixelEquation, 31);
      break;
    case 'black-strokes': {
      const rows = [34, 181, 328], side = 124;
      body = pixels('nine', 103, rows[0], side) + pixels('eight', 103, rows[1], side) + pixels('four', 103, rows[2], side);
      rows.forEach(y => body += T(265, y + 78, d.labels.equals, 49, C.ink, 'middle'));
      body += pixels('loop', 304, rows[0], side, { color: C.blue }) + pixels('tail', 505, rows[0], side, { color: C.yellow });
      body += pixels('loop', 304, rows[1], side, { color: C.blue }) + pixels('lowerLoop', 505, rows[1], side, { color: C.yellow });
      body += pixels('tail', 304, rows[2], side, { color: C.blue }) + pixels('leftStem', 505, rows[2], side, { color: C.yellow }) + pixels('crossbar', 706, rows[2], side, { color: shade(.58) });
      rows.forEach(y => body += T(466, y + 78, d.labels.plus, 49, C.ink, 'middle'));
      body += T(667, rows[2] + 78, d.labels.plus, 49, C.ink, 'middle');
      break;
    }
    case 'black-features':
      body = network({ x: 310, active: true, feature: true, spacing: 97, yOffset: 132, yScale: .7, radius: 6.2 }) + pixels('nine', 270, 48, 83) + pixels('loop', 375, 44, 78, { frame: false, color: C.blue }) + pixels('tail', 375, 44, 78, { frame: false, color: C.yellow });
      break;
    case 'black-pixel-neuron':
      body = pixels('nine', 109, 83, 364, { dots: true, frame: false }) + dimensions(109, 83, 364);
      break;
    case 'black-feature-detector':
      body = fan() + pixels('bar', 301, 108, 242, { grid: true });
      break;
    case 'black-weights':
      body = fan({ weighted: true }) + T(283, 62, d.labels.weights, 34, C.blue) + `<path d="M300,72 L199,121 L202,112 M199,121 L209,119" fill="none" stroke="${C.blue}" stroke-width="1.4"/>` + pixels('bar', 647, 142, 171, { grid: true });
      d.weights.forEach((v, i) => body += T(311, 145 + i * 30, `${d.labels.weightSymbols[i]}: ${v.toFixed(2).replace('-', '−')}`, 23, C.ink, 'start', 'font-style="italic"'));
      body += T(345, 404, d.labels.ellipsis, 25, C.ink, 'middle');
      break;
    case 'black-weighted-sum':
      body = fan({ weighted: true, active: true }) + formula(171, 48, 28) + weightMap(460, 142, 171) + pixels('bar', 647, 142, 171, { grid: true });
      break;
    case 'black-feature-match':
      body = fan({ weighted: true, active: true, result: .8 }) + formula(171, 48, 28) + weightMap(430, 142, 171) + pixels('nine', 647, 142, 171, { grid: true, faint: true }) + weightMap(647, 142, 171, { overlay: true });
      break;
    case 'black-sigmoid': {
      body = L(66, 300, 786, 300, C.gray, .8) + L(426, 60, 426, 420, C.gray, .8);
      d.labels.xTicks.forEach((v, i) => { const x = 138 + i * 72; body += L(x, 296, x, 304, C.gray, .8) + T(x, 329, v, 25, C.ink, 'middle'); });
      d.labels.yTicks.forEach((v, i) => { const y = [420, 180, 60][i]; body += L(422, y, 430, y, C.gray, .8) + T(414, y + 8, v, 25, C.ink, 'end'); });
      const points = Array.from({ length: 201 }, (_, i) => { const x = -5 + i / 20; return `${f(426 + x * 72)},${f(300 - 120 / (1 + Math.exp(-x)))}`; }).join(' ');
      body += `<polyline points="${points}" fill="none" stroke="${C.blue}" stroke-width="2"/>` + T(792, 285, d.labels.x, 29, C.ink, 'start', 'font-style="italic"') + T(487, 56, d.labels.sigmoid, 34, C.blue) + T(438, 113, d.labels.sigmaEquals, 32, C.ink, 'start', 'font-style="italic"') + T(586, 94, d.labels.numerator, 29, C.ink, 'middle') + L(541, 103, 634, 103, C.ink, 1) + T(588, 136, d.labels.denominator, 29, C.ink, 'middle', 'font-style="italic"');
      break;
    }
    case 'black-bias-activation':
      body = fan({ weighted: true, active: true, result: .9 }) + T(200, 29, d.labels.sigmoid, 29, C.blue) + `<path d="M254,37 L251,57 L245,52 M251,57 L256,51" fill="none" stroke="${C.yellow}" stroke-width="1.8"/>` + formula(242, 83, 28) + T(254, 241, d.labels.activation, 27) + pixels('nine', 652, 161, 158, { grid: true, faint: true }) + weightMap(652, 161, 158, { overlay: true }) + `<rect x="299" y="309" width="301" height="116" fill="${C.lightBlue}" stroke="${C.blue}" stroke-width=".6"/>` + T(449, 376, d.labels.biasFormula, 31, C.ink, 'middle', 'font-style="italic"') + `<path d="M376,266 L385,271 L394,266 L392,308 L402,305 L385,339 L368,305 L378,308 Z M380,274 L385,277 L390,274 L388,315 L394,313 L385,331 L376,313 L382,315 Z" fill="none" stroke="${C.yellow}" stroke-width="1.8"/>`;
      break;
    case 'black-parameters':
      body = network({ x: 124 }) + `<rect x="515" y="33" width="290" height="184" fill="${C.lightYellow}" stroke="${C.yellow}" stroke-width="1.6"/>` + T(660, 70, d.labels.weightEquation, 19, C.ink, 'middle') + T(660, 104, d.labels.weightTotal, 23, C.ink, 'middle') + T(660, 156, d.labels.biasEquation, 25, C.ink, 'middle') + T(660, 190, d.labels.biasTotal, 23, C.ink, 'middle') + T(660, 282, d.labels.parameterTotal, 51, C.blue, 'middle');
      break;
    default:
      throw new Error(`Unsupported neural black kind: ${s.neuralKind}`);
  }
  return `<div class="neural-slide neural-dark"><svg class="nnb-canvas" viewBox="0 0 852 480" role="img" aria-label="${e(d.description)}" xmlns="http://www.w3.org/2000/svg">${body}</svg></div>`;
}
