var scalePower = 0.0

class AlometricParameter {
  constructor(name, a, b, container) {
    this.name = name;
    this.a = a;
    this.b = b;
    this.container = container;

    this.div = document.createElement('div');
    this.div.dataset.name = this.name;
    container.appendChild(this.div);

    this.div.innerHTML = `
      <span>${this.name}</span>
      <input type="text" value="${this.a}" size="5" data-param="a">
      <input type="text" value="${this.b}" size="5" data-param="b">:
      <span data-param="value"></span>
    `;
    this.valueSpan = this.div.querySelector('span[data-param="value"]');

    this.update();
  }

  value() {
    return this.a * Math.pow(this.b, scalePower);
  }

  update() {
    this.valueSpan.textContent = this.value().toFixed(4);
  }
}

class DerivedParameter {
  constructor(name, f, container) {
    this.name = name;
    this.f = f;
    this.div = document.createElement('div');
    container.appendChild(this.div);
    this.update();
  }
  value() {
    return this.f();
  }
  update() {
    this.div.innerHTML = `
      <span>${this.name}</span>
      <span>${this.value().toFixed(4)}</span>
    `;
  }
}


const paramDiv = document.createElement('div');
document.body.appendChild(paramDiv);

const sliderContainer = document.createElement('div');
sliderContainer.style.padding = '10px 0';
sliderContainer.style.borderBottom = '1px solid #ccc';
sliderContainer.style.marginBottom = '10px';

const sliderLabel = document.createElement('label');
sliderLabel.htmlFor = 'scalePowerSlider';
sliderLabel.textContent = 'Scale Power: ';

const scaleSlider = document.createElement('input');
scaleSlider.type = 'range';
scaleSlider.id = 'scalePowerSlider';
scaleSlider.min = '-3';
scaleSlider.max = '3';
scaleSlider.value = scalePower.toString();
scaleSlider.step = '0.01';

const valueDisplay = document.createElement('span');
valueDisplay.textContent = parseFloat(scaleSlider.value).toFixed(2);

sliderContainer.appendChild(sliderLabel);
sliderContainer.appendChild(scaleSlider);
sliderContainer.appendChild(valueDisplay);
paramDiv.appendChild(sliderContainer);


const canvasContainer = document.createElement('div');
canvasContainer.style.display = 'flex';
canvasContainer.style.marginTop = '20px';
document.body.appendChild(canvasContainer);

const frontViewCanvas = document.createElement('canvas');
frontViewCanvas.width = 250;
frontViewCanvas.height = 250;
const sideViewCanvas = document.createElement('canvas');
sideViewCanvas.width = 250;
sideViewCanvas.height = 250;
canvasContainer.appendChild(frontViewCanvas);
canvasContainer.appendChild(sideViewCanvas);

scaleSlider.addEventListener('input', (event) => {
  scalePower = parseFloat(event.target.value);
  valueDisplay.textContent = scalePower.toFixed(2);
  updateAll();
});

paramDiv.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  const paramDiv = target.closest('[data-name]');
  const paramName = paramDiv?.dataset.name;
  const param = paramMap.get(paramName);

  if (param && target.dataset.param) {
    const value = parseFloat(target.value);
    if (!isNaN(value)) {
      if (target.dataset.param === 'a') {
        param.a = value;
      } else if (target.dataset.param === 'b') {
        param.b = value;
      }
      updateAll();
    }
  }
});

const paramMap = new Map();

const addNamed = function (n) {
  paramMap.set(n.name, n);
}

addNamed(new AlometricParameter('Body Height', 0.9, 2.0, paramDiv));
addNamed(new AlometricParameter('Body Width', 0.5, 2.4, paramDiv));
addNamed(new AlometricParameter('Body Thickness', 0.25, 2.5, paramDiv));
addNamed(new DerivedParameter('Body Mass',
  () => paramMap.get('Body Height').value() * paramMap.get('Body Width').value() * paramMap.get('Body Thickness').value() * 1e3,
  paramDiv));

addNamed(new AlometricParameter('Leg Height', 0.7, 2.0, paramDiv));
addNamed(new AlometricParameter('Leg Width', 0.15, 2.0, paramDiv));
addNamed(new DerivedParameter('Leg Mass',
  () => { return 2.0 * paramMap.get('Leg Height').value() * paramMap.get('Leg Width').value() * paramMap.get('Leg Width').value() * 1e3; },
  paramDiv));

addNamed(new AlometricParameter('Leg Strength', 1500, 4.0, paramDiv));
// Jump Acceleration = Leg Strength / (Body mass + 0.5 * Leg Mass) - 9.81
addNamed(new DerivedParameter('Jump Acceleration',
  () => paramMap.get('Leg Strength').value() / (paramMap.get('Body Mass').value() + 0.5 * paramMap.get('Leg Mass').value()) - 9.81,
  paramDiv));
// Jump Time = sqrt(Leg Height / Leg Acceleration)
addNamed(new DerivedParameter('Jump Time',
  () => Math.sqrt(paramMap.get('Leg Height').value() / paramMap.get('Jump Acceleration').value()),
  paramDiv));
// Jump Velocity = Jump Time * Jump Acceleration
addNamed(new DerivedParameter('Jump Velocity',
  () => paramMap.get('Jump Time').value() * paramMap.get('Jump Acceleration').value(),
  paramDiv));
// Jump Height = 1/2 Jump Velocity^2 / 9.81
addNamed(new DerivedParameter('Jump Height',
  () => 0.5 * paramMap.get('Jump Velocity').value() * paramMap.get('Jump Velocity').value() / 9.81,
  paramDiv));

const drawBody = () => {
  const frontCtx = frontViewCanvas.getContext('2d');
  const sideCtx = sideViewCanvas.getContext('2d');
  if (!frontCtx || !sideCtx) return;

  frontCtx.clearRect(0, 0, frontViewCanvas.width, frontViewCanvas.height);
  sideCtx.clearRect(0, 0, sideViewCanvas.width, sideViewCanvas.height);

  const bodyHeight = paramMap.get('Body Height').value();
  const bodyWidth = paramMap.get('Body Width').value();
  const bodyThickness = paramMap.get('Body Thickness').value();
  const legHeight = paramMap.get('Leg Height').value();
  const legWidth = paramMap.get('Leg Width').value();

  const totalHeight = bodyHeight + legHeight;
  const canvasHeight = frontViewCanvas.height;
  const scale = (canvasHeight * 0.8) / totalHeight;

  frontCtx.fillStyle = 'black';
  sideCtx.fillStyle = 'black';

  // --- Front View ---
  const frontBodyW = bodyWidth * scale;
  const frontBodyH = bodyHeight * scale;
  const frontLegW = legWidth * scale;
  const frontLegH = legHeight * scale;

  const frontTotalH = frontBodyH + frontLegH;
  const frontYOffset = (canvasHeight - frontTotalH) / 2;

  // Draw front body
  const frontBodyX = (frontViewCanvas.width - frontBodyW) / 2;
  frontCtx.fillRect(frontBodyX, frontYOffset, frontBodyW, frontBodyH);

  // Draw front legs (symmetrically under the body)
  const legY = frontYOffset + frontBodyH;
  const leftLegX = frontBodyX + (frontBodyW / 4) - (frontLegW / 2);
  const rightLegX = frontBodyX + (frontBodyW * 3 / 4) - (frontLegW / 2);
  frontCtx.fillRect(leftLegX, legY, frontLegW, frontLegH);
  frontCtx.fillRect(rightLegX, legY, frontLegW, frontLegH);

  // --- Side View ---
  const sideBodyW = bodyThickness * scale;
  const sideBodyH = bodyHeight * scale;
  const sideLegW = legWidth * scale;
  const sideLegH = legHeight * scale;

  // Draw side body
  const sideBodyX = (sideViewCanvas.width - sideBodyW) / 2;
  sideCtx.fillRect(sideBodyX, frontYOffset, sideBodyW, sideBodyH);
  // Draw side leg (centered under body)
  const sideLegX = (sideViewCanvas.width - sideLegW) / 2;
  sideCtx.fillRect(sideLegX, legY, sideLegW, sideLegH);
};

const updateAll = () => {
  for (const param of paramMap.values()) {
    param.update();
  }
  drawBody();
};

updateAll();
