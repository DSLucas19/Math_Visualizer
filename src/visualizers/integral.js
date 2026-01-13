
import * as math from 'mathjs';

export function renderIntegral(container) {
    // Setup HTML structure
    container.innerHTML = `
    <div class="visualizer-container">
      <div class="controls">
        <div class="control-group">
          <label for="func-input">Function f(x):</label>
          <input type="text" id="func-input" value="x^2" />
        </div>
        <div class="control-group">
          <label for="x-min">Lower Bound (a):</label>
          <input type="number" id="x-min" value="0" step="0.1" />
        </div>
        <div class="control-group">
          <label for="x-max">Upper Bound (b):</label>
          <input type="number" id="x-max" value="2" step="0.1" />
        </div>
        <div class="control-group">
          <label for="rect-count">Rectangles (N): <span id="rect-val">10</span></label>
          <input type="range" id="rect-count" min="1" max="100" value="10" />
        </div>
      </div>
      <div class="canvas-wrapper">
        <canvas id="integral-canvas"></canvas>
        <div class="result-display">
          Area ≈ <span id="area-result">0</span>
        </div>
      </div>
      <button id="back-btn" class="btn">Back to Gallery</button>
    </div>
  `;

    const canvas = container.querySelector('#integral-canvas');
    const ctx = canvas.getContext('2d');
    const funcInput = container.querySelector('#func-input');
    const xMinInput = container.querySelector('#x-min');
    const xMaxInput = container.querySelector('#x-max');
    const rectCountInput = container.querySelector('#rect-count');
    const rectValSpan = container.querySelector('#rect-val');
    const areaResultSpan = container.querySelector('#area-result');
    const backBtn = container.querySelector('#back-btn');

    // Resize canvas
    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = 400; // Fixed height
        draw();
    }

    window.addEventListener('resize', resizeCanvas);
    // Initial resize
    setTimeout(resizeCanvas, 0);

    function draw() {
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const expr = funcInput.value;
        const a = parseFloat(xMinInput.value);
        const b = parseFloat(xMaxInput.value);
        const n = parseInt(rectCountInput.value);
        rectValSpan.textContent = n;

        let f;
        try {
            f = math.compile(expr);
        } catch (err) {
            // Invalid function
            return;
        }

        // Coordinate system settings
        // Auto-scale content
        // We need to find the min and max y in the generic range [a-1, b+1] or something similar to show context
        // But for simplicity let's fit [a, b] + some margin

        // Determine the view range
        const xRange = b - a;
        const xPadding = xRange * 0.2 || 1; // Avoid 0 padding if a=b
        const xViewMin = a - xPadding;
        const xViewMax = b + xPadding;
        const xViewDist = xViewMax - xViewMin;

        // Helper to map graph coordinates to canvas coordinates
        function mapX(x) {
            return ((x - xViewMin) / xViewDist) * width;
        }

        // Need to find Y range to scale properly
        // Sample points to find min/max Y
        let yMin = 0;
        let yMax = 0;
        const sampleSteps = 100;
        for (let i = 0; i <= sampleSteps; i++) {
            const x = xViewMin + (i / sampleSteps) * xViewDist;
            try {
                const y = f.evaluate({ x });
                if (y < yMin) yMin = y;
                if (y > yMax) yMax = y;
            } catch (e) { }
        }

        // Ensure Y range is not zero
        if (yMax === yMin) {
            yMax += 1;
            yMin -= 1;
        }

        const yRange = yMax - yMin;
        const yPadding = yRange * 0.2;
        const yViewMin = yMin - yPadding;
        const yViewMax = yMax + yPadding;
        const yViewDist = yViewMax - yViewMin;

        function mapY(y) {
            return height - ((y - yViewMin) / yViewDist) * height;
        }

        // Draw Axes
        ctx.beginPath();
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        // X-axis
        if (yViewMin <= 0 && yViewMax >= 0) {
            const y0 = mapY(0);
            ctx.moveTo(0, y0);
            ctx.lineTo(width, y0);
        }
        // Y-axis
        if (xViewMin <= 0 && xViewMax >= 0) {
            const x0 = mapX(0);
            ctx.moveTo(x0, 0);
            ctx.lineTo(x0, height);
        }
        ctx.stroke();

        // Draw Function
        ctx.beginPath();
        ctx.strokeStyle = '#4a90e2';
        ctx.lineWidth = 2;
        let first = true;
        for (let i = 0; i <= width; i++) {
            // Reverse map canvas X to graph X
            const graphX = xViewMin + (i / width) * xViewDist;
            try {
                const graphY = f.evaluate({ x: graphX });
                const canvasY = mapY(graphY);
                if (first) {
                    ctx.moveTo(i, canvasY);
                    first = false;
                } else {
                    ctx.lineTo(i, canvasY);
                }
            } catch (e) { }
        }
        ctx.stroke();

        // Draw Riemann Sum Rectangles (Left endpoint for simplicity)
        const dx = (b - a) / n;
        let totalArea = 0;

        ctx.fillStyle = 'rgba(74, 144, 226, 0.3)';
        ctx.strokeStyle = 'rgba(74, 144, 226, 0.8)';
        ctx.lineWidth = 1;

        for (let i = 0; i < n; i++) {
            const rectX = a + i * dx;
            try {
                const rectY = f.evaluate({ x: rectX }); // Left Riemann sum
                totalArea += rectY * dx;

                const x1 = mapX(rectX);
                const x2 = mapX(rectX + dx);
                const y1 = mapY(0);
                const y2 = mapY(rectY); // Top of rectangle

                // Canvas coords: top-left is (x, y)
                // rect(x, y, w, h)
                const rectW = x2 - x1;
                const rectH = y1 - y2; // Height is distance from 0 line to Y value

                // If rectY is positive, top is y2, height is y1-y2
                // If rectY is negative, top is y1, height is y1-y2 (which is negative in valid math, but canvas needs positive h usually? no, canvas allows negative dimensions but better to normalize)

                ctx.beginPath();
                ctx.rect(x1, y2, rectW, rectH);
                ctx.fill();
                ctx.stroke();
            } catch (e) { }
        }

        areaResultSpan.textContent = totalArea.toFixed(4);
    }

    // Event Listeners
    [funcInput, xMinInput, xMaxInput, rectCountInput].forEach(el => {
        el.addEventListener('input', draw);
    });

    backBtn.addEventListener('click', () => {
        // Dispatch custom event or handle navigation globally
        // We will pass a callback or dispatch an event to main
        const event = new CustomEvent('navigate', { detail: 'home' });
        document.dispatchEvent(event);
    });

    // Initial draw
    draw();
}
