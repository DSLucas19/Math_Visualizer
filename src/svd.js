import { Matrix, SingularValueDecomposition } from 'ml-matrix';
import './svd-styles.css';

let currentView = 'input';
let animationState = null;

export function initSVD() {
    const app = document.querySelector('#app');

    app.innerHTML = `
    <div class="svd-container">
      <button class="back-btn" id="back-btn">← Back to Gallery</button>
      
      <h1 class="svd-title">Singular Value Decomposition</h1>
      <p class="svd-subtitle">Visualize how matrices transform space through U, Σ, and V<sup>T</sup></p>
      
      <div id="input-view" class="view active">
        <div class="input-section">
          <h2>Input Matrix A (2×2)</h2>
          <div class="matrix-input">
            <input type="number" id="a11" value="3" step="0.1">
            <input type="number" id="a12" value="1" step="0.1">
            <input type="number" id="a21" value="1" step="0.1">
            <input type="number" id="a22" value="2" step="0.1">
          </div>
          <div class="button-group">
            <button id="random-btn" class="secondary-btn">🎲 Random Matrix</button>
            <button id="visualize-btn" class="primary-btn">▶ Visualize SVD</button>
          </div>
        </div>
      </div>
      
      <div id="viz-view" class="view">
        <div class="viz-container">
          <div class="canvas-section">
            <canvas id="svd-canvas" width="600" height="600"></canvas>
            <div class="animation-controls">
              <button id="play-btn" class="control-btn">▶ Play</button>
              <button id="pause-btn" class="control-btn">⏸ Pause</button>
              <button id="reset-btn" class="control-btn">↻ Reset</button>
            </div>
          </div>
          
          <div class="matrices-section">
            <h3>Decomposition: A = UΣV<sup>T</sup></h3>
            <div class="matrix-display" id="matrix-u"></div>
            <div class="matrix-display" id="matrix-sigma"></div>
            <div class="matrix-display" id="matrix-v"></div>
            <div class="transformation-info" id="transform-info">
              <p>Click Play to see the transformation!</p>
            </div>
          </div>
        </div>
        
        <button id="new-matrix-btn" class="secondary-btn">← New Matrix</button>
      </div>
    </div>
  `;

    // Event listeners
    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.reload();
    });

    document.getElementById('random-btn').addEventListener('click', generateRandomMatrix);
    document.getElementById('visualize-btn').addEventListener('click', startVisualization);
    document.getElementById('play-btn').addEventListener('click', playAnimation);
    document.getElementById('pause-btn').addEventListener('click', pauseAnimation);
    document.getElementById('reset-btn').addEventListener('click', resetAnimation);
    document.getElementById('new-matrix-btn').addEventListener('click', () => {
        switchView('input');
    });
}

function generateRandomMatrix() {
    const inputs = ['a11', 'a12', 'a21', 'a22'];
    inputs.forEach(id => {
        const value = (Math.random() * 6 - 3).toFixed(1); // -3 to 3
        document.getElementById(id).value = value;
    });
}

function getMatrixFromInput() {
    return new Matrix([
        [parseFloat(document.getElementById('a11').value), parseFloat(document.getElementById('a12').value)],
        [parseFloat(document.getElementById('a21').value), parseFloat(document.getElementById('a22').value)]
    ]);
}

function startVisualization() {
    const A = getMatrixFromInput();
    const svd = new SingularValueDecomposition(A);

    const U = svd.leftSingularVectors;
    const S = Matrix.diag(svd.diagonal);
    const V = svd.rightSingularVectors;

    // Display matrices
    displayMatrix('matrix-u', U, 'U');
    displayMatrix('matrix-sigma', S, 'Σ');
    displayMatrix('matrix-v', V.transpose(), 'V<sup>T</sup>');

    // Initialize animation
    animationState = {
        U, S, V,
        step: 0,
        playing: false,
        progress: 0
    };

    switchView('viz');
    drawInitialState();
}

function displayMatrix(elementId, matrix, name) {
    const el = document.getElementById(elementId);
    const data = matrix.to2DArray();

    let html = `<h4>${name}</h4><div class="matrix">`;
    data.forEach(row => {
        html += '<div class="matrix-row">';
        row.forEach(val => {
            html += `<span class="matrix-cell">${val.toFixed(2)}</span>`;
        });
        html += '</div>';
    });
    html += '</div>';

    el.innerHTML = html;
}

function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    if (view === 'input') {
        document.getElementById('input-view').classList.add('active');
    } else {
        document.getElementById('viz-view').classList.add('active');
    }
}

function drawInitialState() {
    const canvas = document.getElementById('svd-canvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#3b4252';
    ctx.lineWidth = 1;
    const scale = 60;
    const centerX = width / 2;
    const centerY = height / 2;

    // Grid lines
    for (let i = -5; i <= 5; i++) {
        if (i === 0) continue;
        // Vertical
        ctx.beginPath();
        ctx.moveTo(centerX + i * scale, 0);
        ctx.lineTo(centerX + i * scale, height);
        ctx.stroke();
        // Horizontal
        ctx.beginPath();
        ctx.moveTo(0, centerY + i * scale);
        ctx.lineTo(width, centerY + i * scale);
        ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#88c0d0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Draw unit circle
    ctx.strokeStyle = '#5e81ac';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, scale, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw unit vectors
    drawVector(ctx, centerX, centerY, scale, 0, '#bf616a', 'i'); // x-axis
    drawVector(ctx, centerX, centerY, 0, -scale, '#a3be8c', 'j'); // y-axis
}

function drawVector(ctx, cx, cy, dx, dy, color, label) {
    const scale = 60;
    const x = dx;
    const y = dy;

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + x, cy + y);
    ctx.stroke();

    // Arrow head
    const angle = Math.atan2(y, x);
    const arrowSize = 12;
    ctx.beginPath();
    ctx.moveTo(cx + x, cy + y);
    ctx.lineTo(
        cx + x - arrowSize * Math.cos(angle - Math.PI / 6),
        cy + y - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(cx + x, cy + y);
    ctx.lineTo(
        cx + x - arrowSize * Math.cos(angle + Math.PI / 6),
        cy + y - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();

    // Label
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText(label, cx + x + 15, cy + y - 10);
}

function playAnimation() {
    if (!animationState) return;
    animationState.playing = true;
    animate();
}

function pauseAnimation() {
    if (animationState) {
        animationState.playing = false;
    }
}

function resetAnimation() {
    if (animationState) {
        animationState.step = 0;
        animationState.progress = 0;
        animationState.playing = false;
    }
    drawInitialState();
    document.getElementById('transform-info').innerHTML = '<p>Click Play to see the transformation!</p>';
}

function animate() {
    if (!animationState || !animationState.playing) return;

    const canvas = document.getElementById('svd-canvas');
    const ctx = canvas.getContext('2d');
    const { U, S, V, step, progress } = animationState;

    const scale = 60;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawInitialState();

    // Animation phases:
    // 0: Apply V^T (rotation)
    // 1: Apply Σ (scaling)
    // 2: Apply U (rotation)

    let transform = Matrix.eye(2);
    let description = '';

    if (step === 0) {
        // Applying V^T
        const VT = V.transpose();
        const t = progress / 100;
        transform = interpolateMatrix(Matrix.eye(2), VT, t);
        description = `<p><strong>Step 1:</strong> Applying V<sup>T</sup> (rotation) - ${Math.round(t * 100)}%</p>`;
    } else if (step === 1) {
        // Already applied V^T, now applying Σ
        const VT = V.transpose();
        const t = progress / 100;
        transform = interpolateMatrix(VT, S.mmul(VT), t);
        description = `<p><strong>Step 2:</strong> Applying Σ (scaling) - ${Math.round(t * 100)}%</p>`;
    } else if (step === 2) {
        // Already applied V^T and Σ, now applying U
        const VT = V.transpose();
        const SVT = S.mmul(VT);
        const t = progress / 100;
        transform = interpolateMatrix(SVT, U.mmul(SVT), t);
        description = `<p><strong>Step 3:</strong> Applying U (rotation) - ${Math.round(t * 100)}%</p>`;
    } else {
        // Complete
        const VT = V.transpose();
        transform = U.mmul(S).mmul(VT);
        description = `<p><strong>Complete!</strong> Full transformation A = UΣV<sup>T</sup></p>`;
        animationState.playing = false;
    }

    document.getElementById('transform-info').innerHTML = description;

    // Draw transformed circle
    ctx.strokeStyle = '#d08770';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let angle = 0; angle <= 2 * Math.PI; angle += 0.1) {
        const x = Math.cos(angle);
        const y = Math.sin(angle);
        const vec = new Matrix([[x], [y]]);
        const transformed = transform.mmul(vec);
        const tx = transformed.get(0, 0);
        const ty = transformed.get(1, 0);

        if (angle === 0) {
            ctx.moveTo(centerX + tx * scale, centerY - ty * scale);
        } else {
            ctx.lineTo(centerX + tx * scale, centerY - ty * scale);
        }
    }
    ctx.closePath();
    ctx.stroke();

    // Update progress
    animationState.progress += 2;
    if (animationState.progress >= 100) {
        animationState.progress = 0;
        animationState.step++;
    }

    if (animationState.playing) {
        requestAnimationFrame(animate);
    }
}

function interpolateMatrix(M1, M2, t) {
    const result = new Matrix(2, 2);
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
            const v1 = M1.get(i, j);
            const v2 = M2.get(i, j);
            result.set(i, j, v1 + (v2 - v1) * t);
        }
    }
    return result;
}
