
import Chart from 'chart.js/auto';
import { compile, derivative } from 'mathjs';

let chartInstance = null;

export function initDerivativeVisualizer(container) {
    container.innerHTML = `
    <div class="visualizer-container">
      <div class="controls">
        <div class="input-group">
          <label for="function-input">Function f(x):</label>
          <input type="text" id="function-input" value="x^2" placeholder="e.g., x^2, sin(x)">
        </div>
        <div class="input-group">
          <label for="x-value-input">x value:</label>
          <input type="number" id="x-value-input" value="2" step="0.1">
        </div>
      </div>
      <div class="canvas-container" style="position: relative; height:40vh; width:80vw">
        <canvas id="derivative-chart"></canvas>
      </div>
      <div id="derivative-info" class="info-panel"></div>
    </div>
  `;

    const functionInput = container.querySelector('#function-input');
    const xValueInput = container.querySelector('#x-value-input');
    const canvas = container.querySelector('#derivative-chart');
    const infoPanel = container.querySelector('#derivative-info');

    const update = () => {
        const exprStr = functionInput.value;
        const xVal = parseFloat(xValueInput.value);

        try {
            const expr = compile(exprStr);
            const deriv = derivative(exprStr, 'x');
            const derivExpr = deriv.compile();

            const yVal = expr.evaluate({ x: xVal });
            const slope = derivExpr.evaluate({ x: xVal });

            // Generate data points for the graph
            const labels = [];
            const dataPoints = [];
            const tangentPoints = [];

            // Determine range based on xVal
            const range = 5;
            const step = 0.1;
            const start = xVal - range;
            const end = xVal + range;

            for (let x = start; x <= end; x += step) {
                labels.push(x.toFixed(1));
                dataPoints.push(expr.evaluate({ x }));

                // Tangent line equation: y - y1 = m(x - x1) => y = m(x - x1) + y1
                const tangentY = slope * (x - xVal) + yVal;
                tangentPoints.push(tangentY);
            }

            const ctx = canvas.getContext('2d');

            if (chartInstance) {
                chartInstance.destroy();
            }

            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: `f(x) = ${exprStr}`,
                            data: dataPoints,
                            borderColor: 'rgb(75, 192, 192)',
                            tension: 0.1,
                            pointRadius: 0
                        },
                        {
                            label: `Tangent at x=${xVal}`,
                            data: tangentPoints,
                            borderColor: 'rgb(255, 99, 132)',
                            borderDash: [5, 5],
                            tension: 0,
                            pointRadius: 0
                        },
                        {
                            label: 'Point',
                            data: dataPoints.map((val, index) => Math.abs(parseFloat(labels[index]) - xVal) < step / 2 ? val : null),
                            backgroundColor: 'rgb(255, 99, 132)',
                            pointRadius: 5,
                            pointHoverRadius: 7,
                            showLine: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            min: start,
                            max: end
                        }
                    }
                }
            });

            infoPanel.innerHTML = `
        <p><strong>Derivative:</strong> f'(x) = ${deriv.toString()}</p>
        <p><strong>At x = ${xVal}:</strong></p>
        <p>f(${xVal}) = ${yVal.toFixed(4)}</p>
        <p>Slope (m) = ${slope.toFixed(4)}</p>
        <p>Tangent Line Equation: y = ${slope.toFixed(4)}x + ${(yVal - slope * xVal).toFixed(4)}</p>
      `;

        } catch (err) {
            infoPanel.innerHTML = `<p class="error">Error: ${err.message}</p>`;
            console.error(err);
        }
    };

    functionInput.addEventListener('input', update);
    xValueInput.addEventListener('input', update);

    // Initial render
    setTimeout(update, 100);
}
