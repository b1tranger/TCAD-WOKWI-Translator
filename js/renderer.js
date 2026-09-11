/**
 * TCAD-WOKWI-Translator - SVG Circuit Renderer
 * Handles rendering breadboards, microcontrollers, components, and wires.
 */

export class CircuitRenderer {
  constructor(svgElement, options = {}) {
    this.svg = svgElement;
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.viewportGroup = null;
    this.currentProject = null;
    this.options = options;

    this.isDraggingComp = false;
    this.activeComp = null;
    this.dragStartPos = { x: 0, y: 0 };
    this.compStartPos = { x: 0, y: 0 };

    this.isPanning = false;
    this.panStartPos = { x: 0, y: 0 };
    this.canvasStartPan = { x: 0, y: 0 };

    this.initViewport();
    this.initInteractions();
  }

  initInteractions() {
    const handleStart = (clientX, clientY, target) => {
      let compEl = target ? target.closest('.canvas-component') : null;
      if (!compEl) {
        const elUnder = document.elementFromPoint(clientX, clientY);
        if (elUnder) {
          compEl = elUnder.closest('.canvas-component');
        }
      }

      if (compEl && this.currentProject) {
        const compId = compEl.getAttribute('data-id');
        const comp = (this.currentProject.components || []).find((c) => c.id === compId);
        if (comp) {
          this.isDraggingComp = true;
          this.activeComp = comp;
          this.dragStartPos = { x: clientX, y: clientY };
          this.compStartPos = { x: comp.x, y: comp.y };
          compEl.classList.add('is-dragging');
          return true;
        }
      }

      // Otherwise click or touch on canvas background starts canvas pan
      this.isPanning = true;
      this.panStartPos = { x: clientX, y: clientY };
      this.canvasStartPan = { x: this.panX, y: this.panY };
      this.svg.classList.add('is-panning');
      return false;
    };

    const handleMove = (clientX, clientY) => {
      if (this.isDraggingComp && this.activeComp) {
        const dx = (clientX - this.dragStartPos.x) / this.zoom;
        const dy = (clientY - this.dragStartPos.y) / this.zoom;
        const rawX = Math.round(this.compStartPos.x + dx);
        const rawY = Math.round(this.compStartPos.y + dy);

        const snapped = this.snapComponentToBreadboard(this.activeComp, rawX, rawY);
        this.activeComp.x = snapped.x;
        this.activeComp.y = snapped.y;

        this.render(this.currentProject);
        if (typeof this.options.onComponentMove === 'function') {
          this.options.onComponentMove(this.activeComp, false);
        }
      } else if (this.isPanning) {
        const dx = clientX - this.panStartPos.x;
        const dy = clientY - this.panStartPos.y;
        this.panX = Math.round(this.canvasStartPan.x + dx);
        this.panY = Math.round(this.canvasStartPan.y + dy);
        this.updateTransform();
      }
    };

    const handleEnd = () => {
      if (this.isDraggingComp) {
        const comp = this.activeComp;
        this.isDraggingComp = false;
        this.activeComp = null;
        document.querySelectorAll('.canvas-component.is-dragging').forEach((el) => {
          el.classList.remove('is-dragging');
        });
        if (comp && typeof this.options.onComponentMove === 'function') {
          this.options.onComponentMove(comp, true);
        }
      }
      if (this.isPanning) {
        this.isPanning = false;
        this.svg.classList.remove('is-panning');
      }
    };

    // Mouse Listeners (Desktop)
    this.svg.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      handleStart(e.clientX, e.clientY, e.target);
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDraggingComp || this.isPanning) {
        handleMove(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDraggingComp || this.isPanning) {
        handleEnd();
      }
    });

    // Touch Listeners (Mobile & Tablet)
    let isPinching = false;
    let initialPinchDist = 0;
    let initialPinchZoom = 1.0;

    this.svg.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 1) {
          isPinching = false;
          const t = e.touches[0];
          handleStart(t.clientX, t.clientY, e.target);
          e.preventDefault();
        } else if (e.touches.length === 2) {
          // Multi-touch pinch to zoom
          if (this.isDraggingComp) {
            handleEnd();
          }
          isPinching = true;
          initialPinchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          initialPinchZoom = this.zoom;
          e.preventDefault();
        }
      },
      { passive: false }
    );

    window.addEventListener(
      'touchmove',
      (e) => {
        if (isPinching && e.touches.length === 2) {
          const currentDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          if (initialPinchDist > 0) {
            const scale = currentDist / initialPinchDist;
            this.setZoom(initialPinchZoom * scale);
          }
          e.preventDefault();
        } else if ((this.isDraggingComp || this.isPanning) && e.touches.length === 1) {
          const t = e.touches[0];
          handleMove(t.clientX, t.clientY);
          e.preventDefault();
        }
      },
      { passive: false }
    );

    window.addEventListener('touchend', (e) => {
      if (isPinching && e.touches.length < 2) {
        isPinching = false;
      }
      if (this.isDraggingComp || this.isPanning) {
        handleEnd();
      }
    });

    window.addEventListener('touchcancel', () => {
      isPinching = false;
      if (this.isDraggingComp || this.isPanning) {
        handleEnd();
      }
    });

    // Mouse Wheel Zoom
    this.svg.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        this.setZoom(this.zoom * zoomFactor);
      },
      { passive: false }
    );
  }

  snapComponentToBreadboard(comp, rawX, rawY) {
    if (!this.currentProject || comp.type.startsWith('breadboard')) {
      return { x: rawX, y: rawY, isSnapped: false };
    }

    const breadboards = (this.currentProject.components || []).filter((c) =>
      c.type === 'breadboard-half' || c.type === 'breadboard-full' || c.type === 'breadboard-mini'
    );
    if (breadboards.length === 0) {
      return { x: rawX, y: rawY, isSnapped: false };
    }

    for (const bb of breadboards) {
      const bbWidth = bb.type === 'breadboard-full' ? 680 : bb.type === 'breadboard-mini' ? 240 : 560;
      const bbHeight = 252;
      const colPitch = bb.type === 'breadboard-full' ? 10 : bb.type === 'breadboard-mini' ? 11 : 17.5;
      const startX = bb.type === 'breadboard-full' ? 22 : bb.type === 'breadboard-mini' ? 20 : 28;
      const maxCols = bb.type === 'breadboard-full' ? 63 : bb.type === 'breadboard-mini' ? 17 : 30;

      if (
        rawX >= bb.x - 30 &&
        rawX <= bb.x + bbWidth - 20 &&
        rawY >= bb.y - 20 &&
        rawY <= bb.y + bbHeight - 10
      ) {
        // 1. DIP IC chips (straddle center groove at bb.y + 70)
        if (comp.type.startsWith('chip-') || comp.type === 'dip-ic') {
          const targetCol = Math.round((rawX + 18 - (bb.x + startX)) / colPitch) + 1;
          const clampedCol = Math.max(1, Math.min(maxCols - 6, targetCol));
          const snappedX = Math.round(bb.x + startX + (clampedCol - 1) * colPitch - 18);
          const snappedY = Math.round(bb.y + 70);
          return { x: snappedX, y: snappedY, isSnapped: true, bbId: bb.id, col: clampedCol };
        }

        // 2. Resistor
        if (comp.type === 'resistor') {
          if (comp.rotation === 90) {
            const targetCol = Math.round((rawX + 12 - (bb.x + startX)) / colPitch) + 1;
            const clampedCol = Math.max(1, Math.min(maxCols, targetCol));
            const snappedX = Math.round(bb.x + startX + (clampedCol - 1) * colPitch - 12);
            const rowBase = rawY < bb.y + 118 ? bb.y + 64 : bb.y + 138;
            const targetRowY = Math.round((rawY + 4 - rowBase) / 11) * 11 + rowBase;
            const snappedY = Math.round(targetRowY - 4);
            return { x: snappedX, y: snappedY, isSnapped: true, bbId: bb.id, col: clampedCol };
          } else {
            const targetCol = Math.round((rawX + 4 - (bb.x + startX)) / colPitch) + 1;
            const clampedCol = Math.max(1, Math.min(maxCols - 3, targetCol));
            const snappedX = Math.round(bb.x + startX + (clampedCol - 1) * colPitch - 4);
            const rowBase = rawY < bb.y + 118 ? bb.y + 64 : bb.y + 138;
            const targetRowY = Math.round((rawY + 12 - rowBase) / 11) * 11 + rowBase;
            const snappedY = Math.round(targetRowY - 12);
            return { x: snappedX, y: snappedY, isSnapped: true, bbId: bb.id, col: clampedCol };
          }
        }

        // 3. LED
        if (comp.type === 'led') {
          const targetCol = Math.round((rawX + 10 - (bb.x + startX)) / colPitch) + 1;
          const clampedCol = Math.max(1, Math.min(maxCols - 1, targetCol));
          const snappedX = Math.round(bb.x + startX + (clampedCol - 1) * colPitch - 10);
          const rowBase = rawY < bb.y + 118 ? bb.y + 64 : bb.y + 138;
          const targetRowY = Math.round((rawY + 38 - rowBase) / 11) * 11 + rowBase;
          const snappedY = Math.round(targetRowY - 38);
          return { x: snappedX, y: snappedY, isSnapped: true, bbId: bb.id, col: clampedCol };
        }

        // 4. Pushbutton
        if (comp.type === 'pushbutton') {
          const targetCol = Math.round((rawX + 8 - (bb.x + startX)) / colPitch) + 1;
          const clampedCol = Math.max(1, Math.min(maxCols - 1, targetCol));
          const snappedX = Math.round(bb.x + startX + (clampedCol - 1) * colPitch - 8);
          const snappedY = Math.round(bb.y + 98); // straddle center groove
          return { x: snappedX, y: snappedY, isSnapped: true, bbId: bb.id, col: clampedCol };
        }

        // 5. Default snap anchor
        const targetCol = Math.round((rawX + 20 - (bb.x + startX)) / colPitch) + 1;
        const clampedCol = Math.max(1, Math.min(maxCols, targetCol));
        const snappedX = Math.round(bb.x + startX + (clampedCol - 1) * colPitch - 20);
        return { x: snappedX, y: rawY, isSnapped: true, bbId: bb.id, col: clampedCol };
      }
    }

    return { x: rawX, y: rawY, isSnapped: false };
  }

  initViewport() {
    this.svg.innerHTML = '';

    // Create SVG Defs for patterns and filters
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <pattern id="canvas-grid" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="12" cy="12" r="1.2" fill="rgba(56, 189, 248, 0.18)"/>
      </pattern>
      <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    `;
    this.svg.appendChild(defs);

    // Background rect
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', '100%');
    bgRect.setAttribute('height', '100%');
    bgRect.setAttribute('fill', 'url(#canvas-grid)');
    this.svg.appendChild(bgRect);

    // Main viewport transform group
    this.viewportGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.viewportGroup.setAttribute('id', 'viewport-group');
    this.svg.appendChild(this.viewportGroup);
  }

  updateTransform() {
    if (this.viewportGroup) {
      this.viewportGroup.setAttribute(
        'transform',
        `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`
      );
    }
  }

  setZoom(zoom) {
    this.zoom = Math.max(0.2, Math.min(3.0, zoom));
    this.updateTransform();
  }

  render(project) {
    if (!this.viewportGroup || !project) return;
    this.currentProject = project;
    this.viewportGroup.innerHTML = '';

    // 1. Render Components
    (project.components || []).forEach((comp) => {
      const compGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      compGroup.setAttribute('transform', `translate(${comp.x}, ${comp.y}) rotate(${comp.rotation || 0})`);
      compGroup.setAttribute('class', 'canvas-component');
      compGroup.setAttribute('data-id', comp.id);

      if (comp.type === 'breadboard-half') {
        compGroup.innerHTML = this.getBreadboardHalfSVG();
      } else if (comp.type === 'breadboard-full') {
        compGroup.innerHTML = this.getBreadboardFullSVG();
      } else if (comp.type === 'breadboard-mini') {
        compGroup.innerHTML = this.getBreadboardMiniSVG();
      } else if (comp.type === 'arduino-uno') {
        compGroup.innerHTML = this.getArduinoUnoSVG();
      } else if (comp.type === 'arduino-mega') {
        compGroup.innerHTML = this.getArduinoMegaSVG();
      } else if (comp.type === 'arduino-nano') {
        compGroup.innerHTML = this.getArduinoNanoSVG();
      } else if (comp.type === 'esp32') {
        compGroup.innerHTML = this.getEsp32SVG();
      } else if (comp.type === 'resistor') {
        compGroup.innerHTML = this.getResistorSVG();
      } else if (comp.type === 'capacitor') {
        compGroup.innerHTML = this.getCapacitorSVG(comp);
      } else if (comp.type === 'diode') {
        compGroup.innerHTML = this.getDiodeSVG(comp);
      } else if (comp.type === 'transistor-tip120') {
        compGroup.innerHTML = this.getTransistorSVG(comp);
      } else if (comp.type === 'led') {
        compGroup.innerHTML = this.getLedSVG(comp);
      } else if (comp.type === 'rgb-led') {
        compGroup.innerHTML = this.getRgbLedSVG(comp);
      } else if (comp.type === 'dip-ic' || comp.type === 'chip-74hc32' || comp.type === 'chip-74hc04' || comp.type === 'chip-7408' || comp.type === 'chip-7400' || comp.type === 'chip-555') {
        compGroup.innerHTML = this.getDipIcSVG(comp);
      } else if (comp.type === 'power-supply') {
        compGroup.innerHTML = this.getPowerSupplySVG(comp);
      } else if (comp.type === 'battery-9v') {
        compGroup.innerHTML = this.getBattery9vSVG(comp);
      } else if (comp.type === 'battery-aa-4') {
        compGroup.innerHTML = this.getBatteryAA4SVG(comp);
      } else if (comp.type === 'dip-switch-4') {
        compGroup.innerHTML = this.getDipSwitchSVG(comp);
      } else if (comp.type === 'slide-switch') {
        compGroup.innerHTML = this.getSlideSwitchSVG(comp);
      } else if (comp.type === 'multimeter') {
        compGroup.innerHTML = this.getMultimeterSVG(comp);
      } else if (comp.type === 'pushbutton') {
        compGroup.innerHTML = this.getPushbuttonSVG(comp);
      } else if (comp.type === 'potentiometer') {
        compGroup.innerHTML = this.getPotentiometerSVG(comp);
      } else if (comp.type === 'buzzer') {
        compGroup.innerHTML = this.getBuzzerSVG(comp);
      } else if (comp.type === 'dc-motor') {
        compGroup.innerHTML = this.getDcMotorSVG(comp);
      } else if (comp.type === 'servo') {
        compGroup.innerHTML = this.getServoMotorSVG(comp);
      } else if (comp.type === 'relay') {
        compGroup.innerHTML = this.getRelaySVG(comp);
      } else if (comp.type === 'sensor-tmp36') {
        compGroup.innerHTML = this.getTmp36SVG(comp);
      } else if (comp.type === 'pir-sensor') {
        compGroup.innerHTML = this.getPirSensorSVG(comp);
      } else if (comp.type === 'ultrasonic-hcsr04') {
        compGroup.innerHTML = this.getUltrasonicSensorSVG(comp);
      } else if (comp.type === 'photoresistor') {
        compGroup.innerHTML = this.getPhotoresistorSVG(comp);
      } else if (comp.type === 'lcd1602-i2c') {
        compGroup.innerHTML = this.getLcd1602Svg(comp);
      } else if (comp.type === '7segment') {
        compGroup.innerHTML = this.get7SegmentSVG(comp);
      } else if (comp.type === 'oled-ssd1306') {
        compGroup.innerHTML = this.getOledDisplaySVG(comp);
      } else {
        compGroup.innerHTML = this.getGenericComponentSVG(comp);
      }

      this.viewportGroup.appendChild(compGroup);
    });

    // 2. Render Connections / Wires with exact pin coordinates and curves
    const compMap = new Map((project.components || []).map(c => [c.id, c]));

    (project.connections || []).forEach((conn, idx) => {
      const fromComp = compMap.get(conn.from?.component);
      const toComp = compMap.get(conn.to?.component);

      const startPt = this.getPinCoordinates(fromComp, conn.from?.pin) || { x: 100 + (idx * 30), y: 100 + (idx * 20) };
      const endPt = this.getPinCoordinates(toComp, conn.to?.pin) || { x: 400 + (idx * 20), y: 300 + (idx * 30) };

      const startX = startPt.x;
      const startY = startPt.y;
      const endX = endPt.x;
      const endY = endPt.y;

      // Smart curve routing based on wire context
      const dx = endX - startX;
      const dy = endY - startY;
      let cx1, cy1, cx2, cy2;

      // Check if wire drops downward below the breadboard or loops around margins
      if (conn.id === 'wire_buzzer_pos') {
        // High loop over the top of Arduino & Breadboard across to the right margin and down to Buzzer
        const topMarginY = 40;
        cx1 = startX + 60;
        cy1 = topMarginY;
        cx2 = Math.max(startX, endX) + 70;
        cy2 = topMarginY;
      } else if (conn.id === 'wire_reset_btn') {
        // Deep loop underneath LCD across to Reset Pushbutton
        const bottomLoopY = 700;
        cx1 = startX;
        cy1 = bottomLoopY;
        cx2 = endX;
        cy2 = bottomLoopY;
      } else if (conn.id === 'wire_aref_jump') {
        // Subtle vertical arch on Arduino board from 3.3V to AREF
        cx1 = startX - 25;
        cy1 = startY - (startY - endY) * 0.4;
        cx2 = endX - 25;
        cy2 = endY + (startY - endY) * 0.4;
      } else if (conn.id === 'wire_slave_pwm') {
        // Outer loop around the right canvas margin from Slave Pin 9 to Breadboard col 23
        const rightLoopX = Math.max(startX, endX) + 260;
        cx1 = rightLoopX;
        cy1 = startY - 30;
        cx2 = rightLoopX;
        cy2 = endY + 40;
      } else if (conn.id && conn.id.startsWith('wire_i2c_')) {
        // Parallel I2C bus harness between the two top Arduinos
        const busOffset = 24 + (idx % 4) * 14;
        cx1 = startX + dx * 0.3;
        cy1 = Math.max(startY, endY) + busOffset;
        cx2 = startX + dx * 0.7;
        cy2 = Math.max(startY, endY) + busOffset;
      } else if (conn.id === 'wire_pot_wiper') {
        // Yellow wiper wire dropping down and turning into potentiometer
        cx1 = startX;
        cy1 = endY;
        cx2 = startX + dx * 0.5;
        cy2 = endY;
      } else if (conn.id === 'wire_common_gnd' || (Math.abs(dx) > 250 && (startY > 400 || endY > 400))) {
        // Bottom ground reference line looping under both boards
        const loopY = Math.max(startY, endY) + 70;
        cx1 = startX;
        cy1 = loopY;
        cx2 = endX;
        cy2 = loopY;
      } else if (conn.id === 'wire_comm_data' || (Math.abs(dx) > 250 && startY < 320 && endY < 320)) {
        // Horizontal inter-board bridge (communication line connecting Arduinos)
        const archY = Math.min(startY, endY) - 50;
        cx1 = startX;
        cy1 = archY;
        cx2 = endX;
        cy2 = archY;
      } else if (startY > 250 && endY > 250 && (conn.label && (conn.label.includes('B') || conn.label.includes('A')))) {
        const bottomSag = Math.max(startY, endY) + 50 + (idx % 3) * 15;
        cx1 = startX;
        cy1 = bottomSag;
        cx2 = endX;
        cy2 = bottomSag;
      } else if (Math.abs(dx) < 20) {
        // Vertical rail jumper
        cx1 = startX - 8;
        cy1 = startY + dy * 0.3;
        cx2 = endX - 8;
        cy2 = startY + dy * 0.7;
      } else {
        cx1 = startX + dx * 0.25;
        cy1 = startY + dy * 0.1 - 25;
        cx2 = startX + dx * 0.75;
        cy2 = endY - dy * 0.1 - 25;
      }



      const wireGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      wireGroup.setAttribute('class', 'circuit-wire-group');

      const wirePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const d = `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`;

      wirePath.setAttribute('d', d);
      wirePath.setAttribute('stroke', conn.color || '#38bdf8');
      wirePath.setAttribute('stroke-width', '4');
      wirePath.setAttribute('fill', 'none');
      wirePath.setAttribute('stroke-linecap', 'round');
      wirePath.setAttribute('class', 'circuit-wire');
      wirePath.setAttribute('filter', 'url(#glow-effect)');
      wireGroup.appendChild(wirePath);

      // Terminal dots
      const dotStart = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dotStart.setAttribute('cx', startX);
      dotStart.setAttribute('cy', startY);
      dotStart.setAttribute('r', '3');
      dotStart.setAttribute('fill', conn.color || '#38bdf8');
      wireGroup.appendChild(dotStart);

      const dotEnd = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dotEnd.setAttribute('cx', endX);
      dotEnd.setAttribute('cy', endY);
      dotEnd.setAttribute('r', '3');
      dotEnd.setAttribute('fill', conn.color || '#38bdf8');
      wireGroup.appendChild(dotEnd);

      // Render floating label pill badge (like Tinkercad) if specified
      if (conn.label) {
        const midX = 0.125 * startX + 0.375 * cx1 + 0.375 * cx2 + 0.125 * endX;
        const midY = 0.125 * startY + 0.375 * cy1 + 0.375 * cy2 + 0.125 * endY;

        const badgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        badgeGroup.setAttribute('transform', `translate(${midX}, ${midY})`);
        badgeGroup.innerHTML = `
          <rect x="-24" y="-12" width="48" height="20" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"/>
          <text x="0" y="2" font-size="10" font-weight="bold" fill="#334155" text-anchor="middle" font-family="sans-serif">${conn.label}</text>
          <circle cx="0" cy="14" r="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2"/>
          <line x1="-3" y1="14" x2="3" y2="14" stroke="#64748b" stroke-width="1.2"/>
        `;
        wireGroup.appendChild(badgeGroup);
      }

      this.viewportGroup.appendChild(wireGroup);
    });
  }

  getPinCoordinates(comp, pinName) {
    if (!comp) return null;
    const px = comp.x || 0;
    const py = comp.y || 0;
    if (!pinName) return { x: px + 30, y: py + 30 };

    const pinStr = String(pinName).toLowerCase();

    // 1. Breadboard Pin mapping
    if (comp.type === 'breadboard-half') {
      const colMatch = pinStr.match(/\d+/);
      const col = colMatch ? Math.min(30, Math.max(1, parseInt(colMatch[0], 10))) : 1;
      const colX = px + 28 + (col - 1) * 17.5;

      if (pinStr.includes('top_rail_neg') || pinStr.startsWith('tn.')) {
        return { x: colX, y: py + 22 };
      }
      if (pinStr.includes('top_rail_pos') || pinStr.startsWith('tp.')) {
        return { x: colX, y: py + 36 };
      }
      if (pinStr.includes('bottom_rail_neg') || pinStr.startsWith('bn.')) {
        return { x: colX, y: py + 215 };
      }
      if (pinStr.includes('bottom_rail_pos') || pinStr.startsWith('bp.')) {
        return { x: colX, y: py + 229 };
      }
      return { x: colX, y: py + 125 };
    }

    // 2. Power Supply mapping
    if (comp.type === 'power-supply') {
      if (pinStr.includes('+') || pinStr.includes('pos')) return { x: px + 105, y: py + 128 };
      if (pinStr.includes('-') || pinStr.includes('neg') || pinStr.includes('gnd')) return { x: px + 138, y: py + 128 };
      return { x: px + 120, y: py + 128 };
    }

    // 3. DIP Switch mapping (4-position)
    if (comp.type === 'dip-switch-4') {
      const numMatch = pinStr.match(/\d+/);
      const num = numMatch ? Math.min(4, Math.max(1, parseInt(numMatch[0], 10))) : 1;
      const swX = px + 16 + (num - 1) * 16;
      if (pinStr.includes('a') || pinStr.includes('top')) return { x: swX, y: py + 6 };
      return { x: swX, y: py + 84 };
    }

    // 4. DIP-14 IC mapping (74HC32, 74HC04, etc.)
    if (comp.type === 'dip-ic' || comp.type === 'chip-74hc32' || comp.type === 'chip-74hc04') {
      const pinNum = parseInt(pinStr, 10);
      if (!isNaN(pinNum) && pinNum >= 1 && pinNum <= 14) {
        if (pinNum <= 7) {
          // Bottom row (Pins 1-7)
          return { x: px + 18 + (pinNum - 1) * 20, y: py + 52 };
        } else {
          // Top row (Pins 8-14, from right to left)
          return { x: px + 18 + (14 - pinNum) * 20, y: py + 2 };
        }
      }
      if (pinStr.includes('vcc')) return { x: px + 18, y: py + 2 }; // Pin 14
      if (pinStr.includes('gnd')) return { x: px + 138, y: py + 52 }; // Pin 7
      return { x: px + 60, y: py + 26 };
    }

    // 5. LED mapping
    if (comp.type === 'led') {
      if (pinStr.includes('a') || pinStr.includes('anode')) return { x: px + 10, y: py + 38 };
      if (pinStr.includes('c') || pinStr.includes('cathode')) return { x: px + 22, y: py + 38 };
      return { x: px + 16, y: py + 38 };
    }

    // 6. Resistor mapping (with rotation support)
    if (comp.type === 'resistor') {
      if (comp.rotation === 90) {
        if (pinStr === '1') return { x: px + 12, y: py + 4 };
        if (pinStr === '2') return { x: px + 12, y: py + 76 };
        return { x: px + 12, y: py + 40 };
      }
      if (pinStr === '1') return { x: px + 4, y: py + 12 };
      if (pinStr === '2') return { x: px + 76, y: py + 12 };
      return { x: px + 40, y: py + 12 };
    }

    // 7. Arduino Uno Pin Mapping (Digital, Power, and Analog headers)
    if (comp.type === 'arduino-uno') {
      // Digital Header pins: AREF, GND, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0
      if (pinStr === 'aref') return { x: px + 74, y: py + 14 };
      if (pinStr === 'gnd' || pinStr === 'gnd.3') return { x: px + 86, y: py + 14 };
      if (pinStr === '13') return { x: px + 98, y: py + 14 };
      if (pinStr === '12') return { x: px + 110, y: py + 14 };
      if (pinStr === '11') return { x: px + 122, y: py + 14 };
      if (pinStr === '10') return { x: px + 134, y: py + 14 };
      if (pinStr === '9') return { x: px + 146, y: py + 14 };
      if (pinStr === '8') return { x: px + 158, y: py + 14 };
      if (pinStr === '7') return { x: px + 178, y: py + 14 };
      if (pinStr === '6') return { x: px + 190, y: py + 14 };
      if (pinStr === '5') return { x: px + 202, y: py + 14 };
      if (pinStr === '4') return { x: px + 214, y: py + 14 };
      if (pinStr === '3') return { x: px + 226, y: py + 14 };
      if (pinStr === '2') return { x: px + 238, y: py + 14 };
      if (pinStr === '1' || pinStr === 'tx') return { x: px + 250, y: py + 14 };
      if (pinStr === '0' || pinStr === 'rx') return { x: px + 262, y: py + 14 };

      // Power Header pins: IOREF, RESET, 3.3V, 5V, GND.1, GND.2, VIN
      if (pinStr === 'ioref') return { x: px + 118, y: py + 182 };
      if (pinStr === 'reset') return { x: px + 130, y: py + 182 };
      if (pinStr.includes('3.3') || pinStr.includes('3v3')) return { x: px + 142, y: py + 182 };
      if (pinStr === '5v') return { x: px + 154, y: py + 182 };
      if (pinStr === 'gnd.1') return { x: px + 166, y: py + 182 };
      if (pinStr === 'gnd.2') return { x: px + 178, y: py + 182 };
      if (pinStr === 'vin') return { x: px + 190, y: py + 182 };

      // Analog Header pins: A0 - A5
      if (pinStr === 'a0') return { x: px + 212, y: py + 182 };
      if (pinStr === 'a1') return { x: px + 224, y: py + 182 };
      if (pinStr === 'a2') return { x: px + 236, y: py + 182 };
      if (pinStr === 'a3') return { x: px + 248, y: py + 182 };
      if (pinStr === 'a4') return { x: px + 260, y: py + 182 };
      if (pinStr === 'a5') return { x: px + 272, y: py + 182 };

      return { x: px + 150, y: py + 100 };
    }

    // 8. Pushbutton mapping (4 corner terminals)
    if (comp.type === 'pushbutton') {
      if (pinStr === '1a') return { x: px + 8, y: py + 8 };
      if (pinStr === '1b') return { x: px + 8, y: py + 28 };
      if (pinStr === '2a') return { x: px + 28, y: py + 8 };
      if (pinStr === '2b') return { x: px + 28, y: py + 28 };
      return { x: px + 18, y: py + 18 };
    }

    // 9. Multimeter mapping (test leads)
    if (comp.type === 'multimeter') {
      if (pinStr.includes('com') || pinStr.includes('-') || pinStr.includes('neg')) return { x: px + 65, y: py + 52 };
      if (pinStr.includes('v') || pinStr.includes('+') || pinStr.includes('pos')) return { x: px + 85, y: py + 52 };
      return { x: px + 75, y: py + 52 };
    }

    // 10. Potentiometer mapping (3 terminals)
    if (comp.type === 'potentiometer') {
      if (pinStr === '1') return { x: px + 10, y: py + 48 };
      if (pinStr === '2' || pinStr === 'wiper') return { x: px + 24, y: py + 48 };
      if (pinStr === '3') return { x: px + 38, y: py + 48 };
      return { x: px + 24, y: py + 48 };
    }

    // 11. 9V Battery mapping (2 snap terminals)
    if (comp.type === 'battery-9v') {
      if (pinStr.includes('+') || pinStr.includes('pos')) return { x: px + 22, y: py + 14 };
      if (pinStr.includes('-') || pinStr.includes('neg')) return { x: px + 58, y: py + 14 };
      return { x: px + 40, y: py + 14 };
    }

    // 12. Piezo Buzzer mapping (2 terminals)
    if (comp.type === 'buzzer') {
      if (pinStr.includes('+') || pinStr.includes('pos')) return { x: px + 18, y: py + 54 };
      if (pinStr.includes('-') || pinStr.includes('neg')) return { x: px + 46, y: py + 54 };
      return { x: px + 32, y: py + 54 };
    }

    // 13. 16x2 I2C LCD mapping (4 backpack pins on left)
    if (comp.type === 'lcd1602-i2c') {
      if (pinStr.includes('gnd')) return { x: px + 4, y: py + 22 };
      if (pinStr.includes('vcc') || pinStr.includes('5v') || pinStr.includes('v+')) return { x: px + 4, y: py + 38 };
      if (pinStr.includes('sda')) return { x: px + 4, y: py + 54 };
      if (pinStr.includes('scl')) return { x: px + 4, y: py + 70 };
      return { x: px + 4, y: py + 46 };
    }

    // 14. Full Breadboard (63 columns)
    if (comp.type === 'breadboard-full') {
      const colMatch = pinStr.match(/\d+/);
      const col = colMatch ? Math.min(63, Math.max(1, parseInt(colMatch[0], 10))) : 1;
      const colX = px + 22 + (col - 1) * 10;
      if (pinStr.includes('top_rail_neg') || pinStr.startsWith('tn.')) return { x: colX, y: py + 20 };
      if (pinStr.includes('top_rail_pos') || pinStr.startsWith('tp.')) return { x: colX, y: py + 34 };
      if (pinStr.includes('bottom_rail_neg') || pinStr.startsWith('bn.')) return { x: colX, y: py + 215 };
      if (pinStr.includes('bottom_rail_pos') || pinStr.startsWith('bp.')) return { x: colX, y: py + 229 };
      return { x: colX, y: py + 125 };
    }

    // 15. Mini Breadboard (17 columns)
    if (comp.type === 'breadboard-mini') {
      const colMatch = pinStr.match(/\d+/);
      const col = colMatch ? Math.min(17, Math.max(1, parseInt(colMatch[0], 10))) : 1;
      const colX = px + 20 + (col - 1) * 11;
      return { x: colX, y: py + 85 };
    }

    // 16. TMP36 Temperature Sensor (1=VCC, 2=Vout, 3=GND)
    if (comp.type === 'sensor-tmp36') {
      if (pinStr === '1' || pinStr.includes('vcc') || pinStr.includes('+')) return { x: px + 8, y: py + 36 };
      if (pinStr === '2' || pinStr.includes('out') || pinStr.includes('sig')) return { x: px + 18, y: py + 36 };
      if (pinStr === '3' || pinStr.includes('gnd') || pinStr.includes('-')) return { x: px + 28, y: py + 36 };
      return { x: px + 18, y: py + 36 };
    }

    // 17. PIR Motion Sensor (GND, VCC, OUT)
    if (comp.type === 'pir-sensor') {
      if (pinStr.includes('gnd') || pinStr.includes('-')) return { x: px + 45, y: py + 104 };
      if (pinStr.includes('out') || pinStr.includes('sig') || pinStr === '2') return { x: px + 55, y: py + 104 };
      if (pinStr.includes('vcc') || pinStr.includes('+') || pinStr === '1') return { x: px + 65, y: py + 104 };
      return { x: px + 55, y: py + 104 };
    }

    // 18. HC-SR04 Ultrasonic Sensor (VCC, TRIG, ECHO, GND)
    if (comp.type === 'ultrasonic-hcsr04') {
      if (pinStr.includes('vcc') || pinStr === '1') return { x: px + 50, y: py + 64 };
      if (pinStr.includes('trig') || pinStr === '2') return { x: px + 60, y: py + 64 };
      if (pinStr.includes('echo') || pinStr === '3') return { x: px + 70, y: py + 64 };
      if (pinStr.includes('gnd') || pinStr === '4') return { x: px + 80, y: py + 64 };
      return { x: px + 65, y: py + 64 };
    }

    // 19. Photoresistor (LDR)
    if (comp.type === 'photoresistor') {
      if (pinStr === '1') return { x: px + 8, y: py + 32 };
      if (pinStr === '2') return { x: px + 24, y: py + 32 };
      return { x: px + 16, y: py + 32 };
    }

    // 20. DC Hobby Motor (+, -)
    if (comp.type === 'dc-motor') {
      if (pinStr.includes('+') || pinStr.includes('pos') || pinStr === '1') return { x: px + 40, y: py + 22 };
      if (pinStr.includes('-') || pinStr.includes('neg') || pinStr === '2') return { x: px + 60, y: py + 22 };
      return { x: px + 50, y: py + 22 };
    }

    // 21. SG90 Micro Servo (GND, VCC, PWM)
    if (comp.type === 'servo') {
      if (pinStr.includes('gnd') || pinStr.includes('-')) return { x: px + 20, y: py + 72 };
      if (pinStr.includes('vcc') || pinStr.includes('+') || pinStr.includes('5v')) return { x: px + 28, y: py + 72 };
      if (pinStr.includes('pwm') || pinStr.includes('sig')) return { x: px + 36, y: py + 72 };
      return { x: px + 28, y: py + 72 };
    }

    // 22. 5V Relay Module (VCC, GND, IN / COM, NO, NC)
    if (comp.type === 'relay') {
      if (pinStr.includes('vcc')) return { x: px + 14, y: py + 20 };
      if (pinStr.includes('gnd')) return { x: px + 14, y: py + 40 };
      if (pinStr.includes('in')) return { x: px + 14, y: py + 60 };
      if (pinStr.includes('no')) return { x: px + 96, y: py + 20 };
      if (pinStr.includes('com')) return { x: px + 96, y: py + 40 };
      if (pinStr.includes('nc')) return { x: px + 96, y: py + 60 };
      return { x: px + 55, y: py + 40 };
    }

    // 23. Flyback / Rectifier Diode (1N4001)
    if (comp.type === 'diode') {
      if (pinStr.includes('anode') || pinStr === '1' || pinStr.includes('+')) return { x: px + 6, y: py + 10 };
      if (pinStr.includes('cathode') || pinStr === '2' || pinStr.includes('-')) return { x: px + 64, y: py + 10 };
      return { x: px + 35, y: py + 10 };
    }

    // 24. TIP120 Darlington Power Transistor (B, C, E)
    if (comp.type === 'transistor-tip120') {
      if (pinStr.includes('base') || pinStr === 'b' || pinStr === '1') return { x: px + 12, y: py + 64 };
      if (pinStr.includes('collector') || pinStr === 'c' || pinStr === '2') return { x: px + 24, y: py + 64 };
      if (pinStr.includes('emitter') || pinStr === 'e' || pinStr === '3') return { x: px + 36, y: py + 64 };
      return { x: px + 24, y: py + 64 };
    }

    // 25. Capacitor (Ceramic / Electrolytic)
    if (comp.type === 'capacitor') {
      if (pinStr === '1' || pinStr.includes('+') || pinStr.includes('pos')) return { x: px + 10, y: py + 30 };
      if (pinStr === '2' || pinStr.includes('-') || pinStr.includes('neg')) return { x: px + 26, y: py + 30 };
      return { x: px + 18, y: py + 30 };
    }

    // 26. RGB LED (R, COM, G, B)
    if (comp.type === 'rgb-led') {
      if (pinStr.includes('r') || pinStr === '1') return { x: px + 8, y: py + 32 };
      if (pinStr.includes('com') || pinStr.includes('cat') || pinStr === '2') return { x: px + 15, y: py + 32 };
      if (pinStr.includes('g') || pinStr === '3') return { x: px + 22, y: py + 32 };
      if (pinStr.includes('b') || pinStr === '4') return { x: px + 29, y: py + 32 };
      return { x: px + 19, y: py + 32 };
    }

    // 27. Slide Switch (SPDT)
    if (comp.type === 'slide-switch') {
      if (pinStr === '1') return { x: px + 12, y: py + 28 };
      if (pinStr === '2' || pinStr.includes('com')) return { x: px + 26, y: py + 28 };
      if (pinStr === '3') return { x: px + 40, y: py + 28 };
      return { x: px + 26, y: py + 28 };
    }

    // 28. 7-Segment Display (1-digit)
    if (comp.type === '7segment') {
      if (pinStr.includes('com')) return { x: px + 30, y: py + 8 };
      if (pinStr === 'a') return { x: px + 30, y: py + 14 };
      if (pinStr === 'b') return { x: px + 48, y: py + 24 };
      if (pinStr === 'c') return { x: px + 48, y: py + 52 };
      if (pinStr === 'd') return { x: px + 30, y: py + 66 };
      if (pinStr === 'e') return { x: px + 12, y: py + 52 };
      if (pinStr === 'f') return { x: px + 12, y: py + 24 };
      if (pinStr === 'g') return { x: px + 30, y: py + 38 };
      if (pinStr === 'dp') return { x: px + 52, y: py + 74 };
      return { x: px + 30, y: py + 45 };
    }

    // 29. 0.96" I2C OLED (GND, VCC, SCL, SDA)
    if (comp.type === 'oled-ssd1306') {
      if (pinStr.includes('gnd')) return { x: px + 32, y: py + 12 };
      if (pinStr.includes('vcc')) return { x: px + 44, y: py + 12 };
      if (pinStr.includes('scl')) return { x: px + 56, y: py + 12 };
      if (pinStr.includes('sda')) return { x: px + 68, y: py + 12 };
      return { x: px + 50, y: py + 12 };
    }

    // 30. 4x AA Battery Pack (6V)
    if (comp.type === 'battery-aa-4') {
      if (pinStr.includes('+') || pinStr.includes('pos')) return { x: px + 110, y: py + 35 };
      if (pinStr.includes('-') || pinStr.includes('neg')) return { x: px + 110, y: py + 55 };
      return { x: px + 110, y: py + 45 };
    }

    // 31. Arduino Mega 2560
    if (comp.type === 'arduino-mega') {
      if (pinStr === '5v') return { x: px + 154, y: py + 182 };
      if (pinStr.includes('gnd')) return { x: px + 166, y: py + 182 };
      if (pinStr.startsWith('a')) {
        const num = parseInt(pinStr.substring(1), 10) || 0;
        return { x: px + 212 + num * 10, y: py + 182 };
      }
      const dNum = parseInt(pinStr, 10);
      if (!isNaN(dNum)) return { x: px + 110 + dNum * 5, y: py + 14 };
      return { x: px + 220, y: py + 120 };
    }

    // 32. Arduino Nano & ESP32
    if (comp.type === 'arduino-nano' || comp.type === 'esp32') {
      if (pinStr.includes('gnd')) return { x: px + 10, y: py + 40 };
      if (pinStr.includes('5v') || pinStr.includes('3v3') || pinStr.includes('vcc')) return { x: px + 10, y: py + 20 };
      return { x: px + 70, y: py + 110 };
    }

    return { x: px + 30, y: py + 30 };
  }



  getBreadboardHalfSVG() {
    let holesSVG = '';
    // Generate 30 column breadboard holes with Tinkercad square recessed metallic contacts
    for (let c = 1; c <= 30; c++) {
      const cx = 28 + (c - 1) * 17.5;
      // Top power rails: (-) and (+)
      holesSVG += `<rect x="${cx - 2.5}" y="19.5" width="5" height="5" rx="1" fill="#18181b" stroke="#64748b" stroke-width="0.75"/><circle cx="${cx}" cy="22" r="0.9" fill="#94a3b8"/>`;
      holesSVG += `<rect x="${cx - 2.5}" y="33.5" width="5" height="5" rx="1" fill="#18181b" stroke="#64748b" stroke-width="0.75"/><circle cx="${cx}" cy="36" r="0.9" fill="#94a3b8"/>`;
      // Column numbers (every 5th)
      if (c === 1 || c % 5 === 0) {
        holesSVG += `<text x="${cx}" y="53" font-size="7.5" fill="#475569" text-anchor="middle" font-family="monospace" font-weight="600">${c}</text>`;
        holesSVG += `<text x="${cx}" y="201" font-size="7.5" fill="#475569" text-anchor="middle" font-family="monospace" font-weight="600">${c}</text>`;
      }
      // Top grid (j, i, h, g, f)
      for (let r = 0; r < 5; r++) {
        const cy = 64 + r * 11;
        holesSVG += `<rect x="${cx - 2.5}" y="${cy - 2.5}" width="5" height="5" rx="1" fill="#18181b" stroke="#64748b" stroke-width="0.75"/><circle cx="${cx}" cy="${cy}" r="0.9" fill="#94a3b8"/>`;
      }
      // Bottom grid (e, d, c, b, a)
      for (let r = 0; r < 5; r++) {
        const cy = 138 + r * 11;
        holesSVG += `<rect x="${cx - 2.5}" y="${cy - 2.5}" width="5" height="5" rx="1" fill="#18181b" stroke="#64748b" stroke-width="0.75"/><circle cx="${cx}" cy="${cy}" r="0.9" fill="#94a3b8"/>`;
      }
      // Bottom power rails: (-) and (+)
      holesSVG += `<rect x="${cx - 2.5}" y="212.5" width="5" height="5" rx="1" fill="#18181b" stroke="#64748b" stroke-width="0.75"/><circle cx="${cx}" cy="215" r="0.9" fill="#94a3b8"/>`;
      holesSVG += `<rect x="${cx - 2.5}" y="226.5" width="5" height="5" rx="1" fill="#18181b" stroke="#64748b" stroke-width="0.75"/><circle cx="${cx}" cy="229" r="0.9" fill="#94a3b8"/>`;
    }

    // Row letters a..e and f..j on left and right
    const rowLettersTop = ['j', 'i', 'h', 'g', 'f'];
    const rowLettersBot = ['e', 'd', 'c', 'b', 'a'];
    let labelsSVG = '';
    rowLettersTop.forEach((l, i) => {
      labelsSVG += `<text x="17" y="${67 + i * 11}" font-size="7" fill="#64748b" text-anchor="middle" font-family="sans-serif">${l}</text>`;
      labelsSVG += `<text x="543" y="${67 + i * 11}" font-size="7" fill="#64748b" text-anchor="middle" font-family="sans-serif">${l}</text>`;
    });
    rowLettersBot.forEach((l, i) => {
      labelsSVG += `<text x="17" y="${141 + i * 11}" font-size="7" fill="#64748b" text-anchor="middle" font-family="sans-serif">${l}</text>`;
      labelsSVG += `<text x="543" y="${141 + i * 11}" font-size="7" fill="#64748b" text-anchor="middle" font-family="sans-serif">${l}</text>`;
    });

    return `
      <!-- Tinkercad Bone-White Breadboard Casing -->
      <rect width="560" height="252" rx="10" fill="#f8f7f2" stroke="#d5d0c3" stroke-width="2.5" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.15))"/>
      <rect x="5" y="5" width="550" height="242" rx="7" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>

      <!-- Power Rails Backing Strips -->
      <rect x="12" y="10" width="536" height="34" rx="4" fill="#eeeae0" opacity="0.8"/>
      <rect x="12" y="207" width="536" height="34" rx="4" fill="#eeeae0" opacity="0.8"/>

      <!-- Power Rails Lines: Blue (-) and Red (+) -->
      <line x1="20" y1="16" x2="540" y2="16" stroke="#2563eb" stroke-width="2"/>
      <line x1="20" y1="42" x2="540" y2="42" stroke="#ef4444" stroke-width="2"/>
      <line x1="20" y1="210" x2="540" y2="210" stroke="#2563eb" stroke-width="2"/>
      <line x1="20" y1="236" x2="540" y2="236" stroke="#ef4444" stroke-width="2"/>

      <!-- Rail Symbols -->
      <text x="16" y="25" font-size="12" font-weight="bold" fill="#2563eb">-</text>
      <text x="16" y="39" font-size="12" font-weight="bold" fill="#ef4444">+</text>
      <text x="548" y="25" font-size="12" font-weight="bold" fill="#2563eb">-</text>
      <text x="548" y="39" font-size="12" font-weight="bold" fill="#ef4444">+</text>

      <text x="16" y="219" font-size="12" font-weight="bold" fill="#2563eb">-</text>
      <text x="16" y="233" font-size="12" font-weight="bold" fill="#ef4444">+</text>
      <text x="548" y="219" font-size="12" font-weight="bold" fill="#2563eb">-</text>
      <text x="548" y="233" font-size="12" font-weight="bold" fill="#ef4444">+</text>

      <!-- Center Divider Trough with Inner Shading -->
      <rect x="12" y="118" width="536" height="12" rx="2" fill="#d8d3c5" stroke="#c4beaf" stroke-width="1"/>
      <line x1="12" y1="124" x2="548" y2="124" stroke="#beb8a8" stroke-width="1"/>

      <!-- Row Labels -->
      ${labelsSVG}

      <!-- Holes & Markings -->
      ${holesSVG}
    `;
  }

  getPowerSupplySVG(comp) {
    const voltage = comp.properties?.voltage || '5.0 V';
    const current = comp.properties?.current || '5.0 A';

    return `
      <!-- Power Supply Body -->
      <rect width="170" height="145" rx="8" fill="#cbd5e1" stroke="#94a3b8" stroke-width="2"/>
      <!-- Dual LCD Display Windows -->
      <rect x="12" y="14" width="85" height="42" rx="4" fill="#94a3b8" stroke="#64748b"/>
      <rect x="15" y="17" width="79" height="36" rx="2" fill="#1e293b"/>
      <text x="54" y="39" font-size="13" font-weight="bold" fill="#38bdf8" text-anchor="middle" font-family="monospace">${voltage}</text>

      <rect x="12" y="64" width="85" height="42" rx="4" fill="#94a3b8" stroke="#64748b"/>
      <rect x="15" y="67" width="79" height="36" rx="2" fill="#1e293b"/>
      <text x="54" y="89" font-size="13" font-weight="bold" fill="#10b981" text-anchor="middle" font-family="monospace">${current}</text>

      <!-- Rotary Knobs -->
      <circle cx="132" cy="34" r="18" fill="#475569" stroke="#334155" stroke-width="2"/>
      <circle cx="132" cy="34" r="14" fill="#64748b"/>
      <line x1="132" y1="34" x2="142" y2="24" stroke="#f8fafc" stroke-width="2"/>
      <text x="132" y="58" font-size="7" fill="#334155" text-anchor="middle" font-weight="bold" font-family="sans-serif">VOLTAGE</text>

      <circle cx="132" cy="86" r="18" fill="#475569" stroke="#334155" stroke-width="2"/>
      <circle cx="132" cy="86" r="14" fill="#64748b"/>
      <line x1="132" y1="86" x2="142" y2="76" stroke="#f8fafc" stroke-width="2"/>
      <text x="132" y="110" font-size="7" fill="#334155" text-anchor="middle" font-weight="bold" font-family="sans-serif">CURRENT</text>

      <!-- Power Switch -->
      <rect x="14" y="118" width="34" height="18" rx="9" fill="#1e293b"/>
      <circle cx="23" cy="127" r="7" fill="#22c55e"/>
      <text x="56" y="130" font-size="9" font-weight="bold" fill="#0f172a" font-family="sans-serif">ON</text>

      <!-- Binding Posts (Red + and Black -) -->
      <circle cx="105" cy="128" r="9" fill="#ef4444" stroke="#dc2626" stroke-width="2"/>
      <circle cx="105" cy="128" r="4" fill="#0f172a"/>
      <text x="105" y="123" font-size="7" fill="#ffffff" text-anchor="middle" font-weight="bold">+</text>

      <circle cx="138" cy="128" r="9" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
      <circle cx="138" cy="128" r="4" fill="#ffffff"/>
      <text x="138" y="123" font-size="7" fill="#ffffff" text-anchor="middle" font-weight="bold">-</text>
    `;
  }

  getDipSwitchSVG(comp) {
    const label = comp.properties?.label || 'B A';

    return `
      <!-- Blue Enclosure -->
      <rect width="68" height="90" rx="4" fill="#0284c7" stroke="#0369a1" stroke-width="2"/>
      <!-- ON text -->
      <text x="12" y="16" font-size="9" font-weight="bold" fill="#ffffff" font-family="sans-serif">ON</text>
      <circle cx="28" cy="12" r="1.5" fill="#ffffff"/>

      <!-- 4 Switch Slide Channels -->
      <rect x="12" y="24" width="8" height="42" rx="2" fill="#0369a1"/>
      <rect x="28" y="24" width="8" height="42" rx="2" fill="#0369a1"/>
      <rect x="44" y="24" width="8" height="42" rx="2" fill="#0369a1"/>
      <rect x="60" y="24" width="8" height="42" rx="2" fill="#0369a1"/>

      <!-- White Actuator Sliders (Pos 1 & 2 ON, 3 & 4 OFF) -->
      <rect x="11" y="25" width="10" height="18" rx="2" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
      <rect x="27" y="25" width="10" height="18" rx="2" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
      <rect x="43" y="46" width="10" height="18" rx="2" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
      <rect x="59" y="46" width="10" height="18" rx="2" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>

      <!-- Channel Numbers -->
      <text x="16" y="80" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="sans-serif">1</text>
      <text x="32" y="80" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="sans-serif">2</text>
      <text x="48" y="80" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="sans-serif">3</text>
      <text x="64" y="80" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="sans-serif">4</text>

      <!-- Badge "B A" beside switch like Tinkercad -->
      <g transform="translate(-32, 28)">
        <rect x="0" y="0" width="26" height="20" rx="5" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"/>
        <text x="13" y="13" font-size="9" font-weight="bold" fill="#334155" text-anchor="middle" font-family="sans-serif">${label}</text>
        <circle cx="13" cy="28" r="4.5" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
        <line x1="10.5" y1="28" x2="15.5" y2="28" stroke="#64748b" stroke-width="1"/>
      </g>
    `;
  }

  getDipIcSVG(comp) {
    const label = comp.properties?.label || '74HC00';
    const tag = comp.properties?.function || (label.includes('32') ? 'OR gate' : label.includes('04') ? 'NOT gate' : 'Logic IC');

    let pinsTop = '';
    let pinsBottom = '';
    for (let p = 0; p < 7; p++) {
      pinsTop += `<rect x="${14 + p * 20}" y="-7" width="9" height="8" rx="1.5" fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.5"/>`;
      pinsBottom += `<rect x="${14 + p * 20}" y="53" width="9" height="8" rx="1.5" fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.5"/>`;
    }

    return `
      <!-- Tinkercad Floating Tag Badge -->
      <g transform="translate(60, -32)">
        <rect x="-30" y="0" width="60" height="20" rx="5" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"/>
        <text x="0" y="13" font-size="9" font-weight="bold" fill="#334155" text-anchor="middle" font-family="sans-serif">${tag}</text>
        <circle cx="0" cy="28" r="4.5" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
        <line x1="-2.5" y1="28" x2="2.5" y2="28" stroke="#64748b" stroke-width="1"/>
      </g>

      <!-- Silver Dual-in-Line Pin Legs -->
      ${pinsTop}
      ${pinsBottom}

      <!-- Tinkercad Molded Epoxy DIP-14 Package -->
      <rect width="154" height="54" rx="3" fill="#18181b" stroke="#27272a" stroke-width="2" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.4))"/>
      <rect x="2" y="2" width="150" height="50" rx="2" fill="#202023" stroke="#2e2e32" stroke-width="0.75"/>
      <!-- Semicircular orientation notch on left -->
      <path d="M 2 20 A 7 7 0 0 1 2 34 Z" fill="#141416"/>
      <!-- Pin 1 Circular Dot Index -->
      <circle cx="16" cy="38" r="3" fill="#141416" stroke="#27272a" stroke-width="0.5"/>

      <!-- Crisp White Silkscreen Part Label -->
      <text x="82" y="32" font-size="13" font-weight="bold" fill="#f4f4f5" text-anchor="middle" font-family="monospace" letter-spacing="1">${label}</text>
      <text x="82" y="44" font-size="7.5" fill="#a1a1aa" text-anchor="middle" font-family="sans-serif">TINKERCAD IC</text>
    `;
  }

  getArduinoUnoSVG() {
    return `
      <!-- Tinkercad Authentic Turquoise Uno PCB -->
      <rect width="280" height="200" rx="8" fill="#00878a" stroke="#006669" stroke-width="2.5" filter="drop-shadow(0 6px 14px rgba(0,0,0,0.35))"/>
      <rect x="6" y="6" width="268" height="188" rx="6" fill="none" stroke="#00979d" stroke-width="1.5"/>

      <!-- USB Type-B Port (Metal Case) -->
      <rect x="-12" y="18" width="34" height="38" rx="3" fill="#cbd5e1" stroke="#94a3b8" stroke-width="2"/>
      <rect x="-8" y="22" width="18" height="30" rx="2" fill="#64748b"/>
      <line x1="-12" y1="28" x2="22" y2="28" stroke="#94a3b8" stroke-width="1"/>
      <line x1="-12" y1="46" x2="22" y2="46" stroke="#94a3b8" stroke-width="1"/>

      <!-- DC Power Barrel Jack (Black) -->
      <rect x="-12" y="128" width="38" height="48" rx="4" fill="#18181b" stroke="#27272a" stroke-width="2"/>
      <circle cx="6" cy="152" r="7" fill="#3f3f46"/>
      <circle cx="6" cy="152" r="3" fill="#09090b"/>

      <!-- 16 MHz Quartz Crystal Oscillator -->
      <rect x="65" y="68" width="18" height="36" rx="9" fill="#94a3b8" stroke="#64748b" stroke-width="1.5"/>
      <text x="74" y="88" font-size="6" fill="#1e293b" text-anchor="middle" font-family="monospace">16.0</text>

      <!-- Yellow Reset Button -->
      <rect x="52" y="18" width="16" height="16" rx="3" fill="#18181b" stroke="#334155" stroke-width="1"/>
      <circle cx="60" cy="26" r="5" fill="#eab308" stroke="#ca8a04" stroke-width="1"/>

      <!-- ATmega328P DIP Socket and Chip -->
      <rect x="108" y="68" width="84" height="44" rx="3" fill="#18181b" stroke="#27272a" stroke-width="2"/>
      <!-- Notch on left -->
      <path d="M 108 84 A 6 6 0 0 1 108 96 Z" fill="#27272a"/>
      <text x="150" y="88" font-size="9" fill="#ffffff" text-anchor="middle" font-weight="bold" font-family="monospace">ATmega328P</text>
      <text x="150" y="100" font-size="7" fill="#38bdf8" text-anchor="middle" font-family="monospace">ARDUINO</text>

      <!-- Female Pin Headers with Crisp White Silkscreen -->
      <!-- Digital I/O Header (top) -->
      <rect x="64" y="10" width="198" height="15" rx="2" fill="#18181b" stroke="#27272a" stroke-width="1.5"/>
      <!-- Analog & Power Headers (bottom) -->
      <rect x="64" y="175" width="198" height="15" rx="2" fill="#18181b" stroke="#27272a" stroke-width="1.5"/>

      <!-- Header Pin Sockets -->
      ${Array.from({ length: 16 }).map((_, i) => `<rect x="${68 + i * 12}" y="13" width="7" height="9" rx="1" fill="#09090b" stroke="#334155" stroke-width="0.5"/><circle cx="${71.5 + i * 12}" cy="17.5" r="1.5" fill="#ca8a04"/>`).join('')}
      ${Array.from({ length: 16 }).map((_, i) => `<rect x="${68 + i * 12}" y="178" width="7" height="9" rx="1" fill="#09090b" stroke="#334155" stroke-width="0.5"/><circle cx="${71.5 + i * 12}" cy="182.5" r="1.5" fill="#ca8a04"/>`).join('')}

      <!-- Silkscreen Header Labels -->
      <text x="160" y="34" font-size="7" fill="#ffffff" text-anchor="middle" font-weight="600" font-family="sans-serif">DIGITAL (PWM ~)</text>
      <text x="105" y="168" font-size="7" fill="#ffffff" text-anchor="middle" font-weight="600" font-family="sans-serif">POWER</text>
      <text x="210" y="168" font-size="7" fill="#ffffff" text-anchor="middle" font-weight="600" font-family="sans-serif">ANALOG IN</text>

      <!-- Brand Logo / Name -->
      <text x="160" y="142" font-size="15" fill="#ffffff" font-weight="800" text-anchor="middle" font-family="sans-serif" letter-spacing="1">UNO</text>
      <text x="160" y="156" font-size="8" fill="#e2e8f0" font-weight="bold" text-anchor="middle" font-family="sans-serif">ARDUINO</text>
    `;
  }

  getResistorSVG(comp) {
    const valueStr = comp?.properties?.resistance || '220 Ω';
    return `
      <!-- Tinkercad Resistor: Ceramic dumbbell body with silver leads -->
      <line x1="0" y1="12" x2="18" y2="12" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
      <!-- Dumbbell body shape -->
      <rect x="18" y="4" width="44" height="16" rx="4" fill="#deb887" stroke="#b45309" stroke-width="1.2"/>
      <rect x="22" y="5" width="36" height="14" rx="2" fill="#e2b170"/>
      <!-- Bulge ends -->
      <circle cx="20" cy="12" r="7.5" fill="#deb887" stroke="#b45309" stroke-width="1.2"/>
      <circle cx="60" cy="12" r="7.5" fill="#deb887" stroke="#b45309" stroke-width="1.2"/>
      <!-- Color Bands (Red Red Brown Gold) -->
      <rect x="25" y="4" width="4" height="16" fill="#ef4444"/>
      <rect x="33" y="5" width="4" height="14" fill="#ef4444"/>
      <rect x="41" y="5" width="4" height="14" fill="#b45309"/>
      <rect x="52" y="4" width="4" height="16" fill="#f59e0b"/>
      <line x1="62" y1="12" x2="80" y2="12" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
      <!-- Tinkercad Floating Label Badge -->
      <g transform="translate(40, -18)">
        <rect x="-22" y="0" width="44" height="16" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"/>
        <text x="0" y="11" font-size="8" font-weight="bold" fill="#334155" text-anchor="middle" font-family="sans-serif">${valueStr}</text>
        <circle cx="0" cy="21" r="3" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
      </g>
    `;
  }

  getLedSVG(comp) {
    const color = comp?.properties?.color || 'red';
    const fill = color === 'green' ? '#22c55e' : color === 'blue' ? '#38bdf8' : color === 'yellow' ? '#facc15' : '#ef4444';
    const stroke = color === 'green' ? '#16a34a' : color === 'blue' ? '#0284c7' : color === 'yellow' ? '#ca8a04' : '#dc2626';

    return `
      <!-- Silver pin leads extending down into breadboard holes -->
      <line x1="10" y1="28" x2="10" y2="40" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="22" y1="28" x2="22" y2="44" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Raised base rim flange collar -->
      <rect x="4" y="23" width="24" height="5" rx="2.5" fill="${stroke}"/>
      <!-- Translucent 5mm LED Dome with glass highlights -->
      <circle cx="16" cy="15" r="12" fill="${fill}" stroke="${stroke}" stroke-width="1.8"/>
      <!-- Glass reflection highlight -->
      <ellipse cx="12" cy="11" rx="4.5" ry="2.8" fill="#ffffff" opacity="0.5"/>
      <!-- Internal leadframe: anvil & post -->
      <polygon points="12,17 15,12 17,17 14,23" fill="#ffffff" opacity="0.65"/>
      <line x1="17" y1="13" x2="17" y2="23" stroke="#ffffff" stroke-width="1.5" opacity="0.75"/>
    `;
  }

  getGenericComponentSVG(comp) {
    return `
      <rect width="60" height="60" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="30" y="34" font-size="10" fill="#38bdf8" text-anchor="middle" font-family="monospace">${comp.type}</text>
    `;
  }

  getMultimeterSVG(comp) {
    const reading = comp.properties?.reading || '5.00 V';
    return `
      <!-- Yellow Case -->
      <rect width="130" height="58" rx="6" fill="#eab308" stroke="#ca8a04" stroke-width="2"/>
      <!-- Dark LCD Display -->
      <rect x="8" y="10" width="88" height="38" rx="4" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
      <text x="52" y="34" font-size="14" font-weight="bold" fill="#38bdf8" text-anchor="middle" font-family="monospace">${reading}</text>

      <!-- Function Mode Buttons on right (V and A) -->
      <circle cx="112" cy="20" r="10" fill="#ca8a04" stroke="#a16207" stroke-width="1.5"/>
      <text x="112" y="24" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="sans-serif">V</text>

      <circle cx="112" cy="40" r="10" fill="#eab308" stroke="#a16207" stroke-width="1.5"/>
      <text x="112" y="44" font-size="9" font-weight="bold" fill="#713f12" text-anchor="middle" font-family="sans-serif">A</text>

      <!-- Test Lead Jacks at bottom -->
      <circle cx="65" cy="52" r="4.5" fill="#0f172a" stroke="#ffffff" stroke-width="1"/>
      <circle cx="85" cy="52" r="4.5" fill="#dc2626" stroke="#ffffff" stroke-width="1"/>
    `;
  }

  getPushbuttonSVG(comp) {
    return `
      <!-- Metal Pins for Breadboard Insertion -->
      <rect x="-4" y="6" width="7" height="4" rx="1" fill="#cbd5e1"/>
      <rect x="-4" y="26" width="7" height="4" rx="1" fill="#cbd5e1"/>
      <rect x="33" y="6" width="7" height="4" rx="1" fill="#cbd5e1"/>
      <rect x="33" y="26" width="7" height="4" rx="1" fill="#cbd5e1"/>
      <!-- Tinkercad Tactile Switch Body -->
      <rect width="36" height="36" rx="4" fill="#18181b" stroke="#27272a" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
      <!-- 4 Chrome Corner Tabs -->
      <rect x="2" y="2" width="6" height="6" rx="1" fill="#94a3b8"/>
      <rect x="28" y="2" width="6" height="6" rx="1" fill="#94a3b8"/>
      <rect x="2" y="28" width="6" height="6" rx="1" fill="#94a3b8"/>
      <rect x="28" y="28" width="6" height="6" rx="1" fill="#94a3b8"/>
      <!-- Round Raised Tactile Button Cap with Bevel -->
      <circle cx="18" cy="18" r="10" fill="#27272a" stroke="#3f3f46" stroke-width="1.5"/>
      <circle cx="18" cy="18" r="8" fill="#18181b"/>
      <circle cx="16" cy="16" r="3" fill="#ffffff" opacity="0.2"/>
    `;
  }

  getPotentiometerSVG(comp) {
    return `
      <!-- Solder Pins -->
      <rect x="7" y="44" width="6" height="8" rx="1" fill="#94a3b8"/>
      <rect x="21" y="44" width="6" height="8" rx="1" fill="#94a3b8"/>
      <rect x="35" y="44" width="6" height="8" rx="1" fill="#94a3b8"/>
      <!-- Outer Dial Housing -->
      <circle cx="24" cy="24" r="22" fill="#0284c7" stroke="#0369a1" stroke-width="2"/>
      <!-- Inner Rotary Knob -->
      <circle cx="24" cy="24" r="16" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <line x1="24" y1="24" x2="33" y2="15" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
    `;
  }

  getBattery9vSVG(comp) {
    return `
      <!-- Positive Terminal Snap (Stud) -->
      <circle cx="22" cy="14" r="6.5" fill="#ca8a04" stroke="#eab308" stroke-width="2"/>
      <circle cx="22" cy="14" r="2.5" fill="#fef08a"/>
      <text x="22" y="30" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle">+</text>

      <!-- Negative Terminal Snap (Socket/Hexagonal) -->
      <circle cx="58" cy="14" r="8" fill="#cbd5e1" stroke="#64748b" stroke-width="2"/>
      <circle cx="58" cy="14" r="4" fill="#1e293b"/>
      <text x="58" y="30" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle">-</text>

      <!-- Main Rectangular Battery Body -->
      <rect x="4" y="22" width="76" height="110" rx="6" fill="#1e293b" stroke="#0f172a" stroke-width="2.5"/>
      <!-- Copper / Orange Top Stripe -->
      <path d="M 4 28 L 80 28 L 80 48 L 4 48 Z" fill="#c2410c"/>
      <!-- Label Text -->
      <text x="42" y="85" font-size="24" font-weight="bold" fill="#f8fafc" text-anchor="middle" font-family="sans-serif">9V</text>
      <text x="42" y="104" font-size="8" font-weight="bold" fill="#94a3b8" text-anchor="middle" font-family="sans-serif">HEAVY DUTY</text>
    `;
  }

  getBuzzerSVG(comp) {
    return `
      <!-- Solder Pins -->
      <rect x="15" y="48" width="6" height="12" rx="1" fill="#94a3b8"/>
      <rect x="43" y="48" width="6" height="12" rx="1" fill="#94a3b8"/>
      <!-- Outer Cylindrical Case -->
      <circle cx="32" cy="32" r="30" fill="#1e293b" stroke="#0f172a" stroke-width="2.5"/>
      <circle cx="32" cy="32" r="24" fill="#334155" stroke="#475569" stroke-width="1.5"/>
      <!-- Center Brass Sound Port -->
      <circle cx="32" cy="32" r="7" fill="#ca8a04" stroke="#eab308" stroke-width="1.5"/>
      <circle cx="32" cy="32" r="3" fill="#713f12"/>
      <!-- Polarity Labels -->
      <text x="18" y="48" font-size="11" font-weight="bold" fill="#38bdf8" text-anchor="middle">+</text>
      <text x="46" y="48" font-size="11" font-weight="bold" fill="#94a3b8" text-anchor="middle">-</text>
    `;
  }

  getLcd1602Svg(comp) {
    const text = comp.properties?.text || 'V: 8.94V NORMAL';
    return `
      <!-- Green PCB Frame -->
      <rect width="260" height="96" rx="6" fill="#15803d" stroke="#166534" stroke-width="2"/>
      <!-- 16 Top Solder Holes -->
      ${Array.from({ length: 16 }).map((_, i) => `<circle cx="${28 + i * 14}" cy="9" r="2.2" fill="#eab308" stroke="#ca8a04" stroke-width="0.8"/>`).join('')}
      <!-- LCD Display Bezel (Black) -->
      <rect x="24" y="18" width="220" height="68" rx="4" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
      <!-- LCD Screen (Dark Blue Backlight) -->
      <rect x="34" y="25" width="200" height="54" rx="2" fill="#1e3a8a" stroke="#172554" stroke-width="1"/>
      <text x="42" y="48" font-size="15" font-weight="bold" fill="#38bdf8" font-family="monospace">${text}</text>
      <text x="42" y="68" font-size="13" fill="#93c5fd" font-family="monospace">PROTECTION: OK</text>
      <!-- 4-Pin I2C Backpack Connector on Left -->
      <rect x="-4" y="16" width="16" height="64" rx="2" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
      <circle cx="4" cy="22" r="2.5" fill="#eab308"/>
      <text x="14" y="25" font-size="7" font-weight="bold" fill="#ffffff" font-family="sans-serif">GND</text>
      <circle cx="4" cy="38" r="2.5" fill="#eab308"/>
      <text x="14" y="41" font-size="7" font-weight="bold" fill="#ffffff" font-family="sans-serif">VCC</text>
      <circle cx="4" cy="54" r="2.5" fill="#eab308"/>
      <text x="14" y="57" font-size="7" font-weight="bold" fill="#ffffff" font-family="sans-serif">SDA</text>
      <circle cx="4" cy="70" r="2.5" fill="#eab308"/>
      <text x="14" y="73" font-size="7" font-weight="bold" fill="#ffffff" font-family="sans-serif">SCL</text>
    `;
  }

  getBreadboardFullSVG() {
    let holes = '';
    for (let c = 1; c <= 63; c++) {
      const cx = 22 + (c - 1) * 10;
      holes += `<rect x="${cx - 2}" y="18" width="4" height="4" rx="0.75" fill="#18181b" stroke="#64748b" stroke-width="0.5"/><circle cx="${cx}" cy="20" r="0.7" fill="#94a3b8"/>`;
      holes += `<rect x="${cx - 2}" y="32" width="4" height="4" rx="0.75" fill="#18181b" stroke="#64748b" stroke-width="0.5"/><circle cx="${cx}" cy="34" r="0.7" fill="#94a3b8"/>`;
      if (c === 1 || c % 5 === 0) {
        holes += `<text x="${cx}" y="48" font-size="6" fill="#475569" text-anchor="middle" font-family="monospace" font-weight="600">${c}</text>`;
        holes += `<text x="${cx}" y="202" font-size="6" fill="#475569" text-anchor="middle" font-family="monospace" font-weight="600">${c}</text>`;
      }
      for (let r = 0; r < 5; r++) {
        const cy = 58 + r * 11;
        holes += `<rect x="${cx - 2}" y="${cy - 2}" width="4" height="4" rx="0.75" fill="#18181b" stroke="#64748b" stroke-width="0.5"/><circle cx="${cx}" cy="${cy}" r="0.7" fill="#94a3b8"/>`;
      }
      for (let r = 0; r < 5; r++) {
        const cy = 138 + r * 11;
        holes += `<rect x="${cx - 2}" y="${cy - 2}" width="4" height="4" rx="0.75" fill="#18181b" stroke="#64748b" stroke-width="0.5"/><circle cx="${cx}" cy="${cy}" r="0.7" fill="#94a3b8"/>`;
      }
      holes += `<rect x="${cx - 2}" y="213" width="4" height="4" rx="0.75" fill="#18181b" stroke="#64748b" stroke-width="0.5"/><circle cx="${cx}" cy="215" r="0.7" fill="#94a3b8"/>`;
      holes += `<rect x="${cx - 2}" y="227" width="4" height="4" rx="0.75" fill="#18181b" stroke="#64748b" stroke-width="0.5"/><circle cx="${cx}" cy="229" r="0.7" fill="#94a3b8"/>`;
    }
    return `
      <!-- Tinkercad 63-Column Full Breadboard -->
      <rect width="660" height="252" rx="10" fill="#f8f7f2" stroke="#d5d0c3" stroke-width="2.5" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.15))"/>
      <rect x="5" y="5" width="650" height="242" rx="7" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
      <!-- Power Rail Lines -->
      <line x1="16" y1="16" x2="644" y2="16" stroke="#2563eb" stroke-width="2"/>
      <line x1="16" y1="40" x2="644" y2="40" stroke="#ef4444" stroke-width="2"/>
      <line x1="16" y1="211" x2="644" y2="211" stroke="#2563eb" stroke-width="2"/>
      <line x1="16" y1="235" x2="644" y2="235" stroke="#ef4444" stroke-width="2"/>
      <!-- Center Trough -->
      <rect x="16" y="118" width="628" height="12" rx="2" fill="#d8d3c5" stroke="#c4beaf" stroke-width="1"/>
      <line x1="16" y1="124" x2="644" y2="124" stroke="#beb8a8" stroke-width="1"/>
      ${holes}
    `;
  }

  getBreadboardMiniSVG() {
    let holes = '';
    for (let c = 1; c <= 17; c++) {
      const cx = 20 + (c - 1) * 11;
      if (c === 1 || c % 5 === 0) {
        holes += `<text x="${cx}" y="18" font-size="6" fill="#475569" text-anchor="middle" font-family="monospace">${c}</text>`;
      }
      for (let r = 0; r < 5; r++) {
        const cy = 25 + r * 11;
        holes += `<rect x="${cx - 2}" y="${cy - 2}" width="4" height="4" rx="0.75" fill="#18181b" stroke="#64748b" stroke-width="0.5"/><circle cx="${cx}" cy="${cy}" r="0.7" fill="#94a3b8"/>`;
      }
      for (let r = 0; r < 5; r++) {
        const cy = 95 + r * 11;
        holes += `<rect x="${cx - 2}" y="${cy - 2}" width="4" height="4" rx="0.75" fill="#18181b" stroke="#64748b" stroke-width="0.5"/><circle cx="${cx}" cy="${cy}" r="0.7" fill="#94a3b8"/>`;
      }
    }
    return `
      <!-- Tinkercad 17-Column Mini Breadboard -->
      <rect width="215" height="165" rx="8" fill="#f8f7f2" stroke="#d5d0c3" stroke-width="2" filter="drop-shadow(0 3px 8px rgba(0,0,0,0.15))"/>
      <rect x="12" y="78" width="191" height="10" rx="2" fill="#d8d3c5" stroke="#c4beaf" stroke-width="1"/>
      ${holes}
    `;
  }

  getArduinoMegaSVG() {
    return `
      <rect width="440" height="210" rx="12" fill="#0284c7" stroke="#0369a1" stroke-width="3"/>
      <rect x="20" y="20" width="400" height="170" rx="6" fill="#0369a1" opacity="0.6"/>
      <rect x="160" y="65" width="80" height="80" rx="4" fill="#0f172a"/>
      <text x="200" y="110" font-size="12" font-weight="bold" fill="#f8fafc" text-anchor="middle" font-family="sans-serif">ATmega2560</text>
      <text x="320" y="110" font-size="18" font-weight="bold" fill="#ffffff" font-family="sans-serif">MEGA 2560</text>
      <rect x="80" y="8" width="340" height="16" rx="2" fill="#1e293b"/>
      <rect x="80" y="186" width="340" height="16" rx="2" fill="#1e293b"/>
    `;
  }

  getArduinoNanoSVG() {
    return `
      <rect width="130" height="200" rx="8" fill="#0284c7" stroke="#0369a1" stroke-width="2"/>
      <rect x="35" y="60" width="60" height="60" rx="4" fill="#0f172a"/>
      <text x="65" y="95" font-size="9" font-weight="bold" fill="#38bdf8" text-anchor="middle" font-family="sans-serif">NANO</text>
      <rect x="40" y="6" width="50" height="24" rx="2" fill="#94a3b8"/>
      <!-- Header Pins -->
      ${Array.from({ length: 15 }).map((_, i) => `<circle cx="10" cy="${25 + i * 11}" r="2" fill="#eab308"/><circle cx="120" cy="${25 + i * 11}" r="2" fill="#eab308"/>`).join('')}
    `;
  }

  getEsp32SVG() {
    return `
      <rect width="150" height="220" rx="8" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <!-- Metal RF Shield -->
      <rect x="30" y="45" width="90" height="95" rx="4" fill="#94a3b8" stroke="#cbd5e1" stroke-width="1.5"/>
      <text x="75" y="95" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle" font-family="sans-serif">ESP32</text>
      <text x="75" y="112" font-size="8" fill="#334155" text-anchor="middle" font-family="sans-serif">WROOM-32</text>
      <!-- PCB Antenna -->
      <path d="M 40 15 L 40 38 L 55 38 L 55 15 L 70 15 L 70 38 L 85 38 L 85 15 L 100 15 L 100 38 L 115 38" fill="none" stroke="#ca8a04" stroke-width="2"/>
      <!-- Side Header Pins -->
      ${Array.from({ length: 15 }).map((_, i) => `<circle cx="10" cy="${35 + i * 11}" r="2.2" fill="#eab308"/><circle cx="140" cy="${35 + i * 11}" r="2.2" fill="#eab308"/>`).join('')}
    `;
  }

  getPirSensorSVG(comp) {
    return `
      <!-- Green PCB -->
      <rect width="100" height="100" rx="6" fill="#15803d" stroke="#166534" stroke-width="2"/>
      <!-- Dome Fresnel Lens -->
      <circle cx="50" cy="45" r="34" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
      <circle cx="50" cy="45" r="24" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1"/>
      <circle cx="50" cy="45" r="14" fill="#cbd5e1"/>
      <!-- Bottom Connector Pins -->
      <rect x="42" y="96" width="6" height="10" fill="#94a3b8"/>
      <rect x="52" y="96" width="6" height="10" fill="#94a3b8"/>
      <rect x="62" y="96" width="6" height="10" fill="#94a3b8"/>
      <text x="50" y="92" font-size="7" font-weight="bold" fill="#ffffff" text-anchor="middle">GND OUT VCC</text>
    `;
  }

  getDcMotorSVG(comp) {
    return `
      <!-- Metal Motor Body -->
      <rect x="15" y="10" width="70" height="56" rx="14" fill="#94a3b8" stroke="#64748b" stroke-width="2"/>
      <circle cx="50" cy="38" r="18" fill="#64748b"/>
      <!-- Gear / Shaft -->
      <circle cx="50" cy="38" r="8" fill="#eab308" stroke="#ca8a04" stroke-width="2"/>
      <!-- Power Terminals -->
      <rect x="36" y="2" width="8" height="10" fill="#dc2626" rx="1"/>
      <rect x="56" y="2" width="8" height="10" fill="#0f172a" rx="1"/>
    `;
  }

  getServoMotorSVG(comp) {
    return `
      <!-- Dark Blue Servo Case -->
      <rect x="8" y="12" width="74" height="48" rx="4" fill="#1e3a8a" stroke="#172554" stroke-width="2"/>
      <!-- Top Gear Horn Cylinder -->
      <circle cx="28" cy="22" r="14" fill="#3b82f6"/>
      <!-- White Horn Arm -->
      <rect x="24" y="6" width="8" height="32" rx="4" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
      <circle cx="28" cy="22" r="4" fill="#64748b"/>
      <text x="54" y="42" font-size="10" font-weight="bold" fill="#ffffff" font-family="sans-serif">SG90</text>
      <!-- 3-Pin Cable Ribbon -->
      <rect x="16" y="66" width="8" height="8" fill="#78350f"/>
      <rect x="24" y="66" width="8" height="8" fill="#dc2626"/>
      <rect x="32" y="66" width="8" height="8" fill="#f97316"/>
    `;
  }

  getRelaySVG(comp) {
    return `
      <!-- Blue Relay Module Box -->
      <rect x="20" y="10" width="70" height="60" rx="4" fill="#0284c7" stroke="#0369a1" stroke-width="2"/>
      <text x="55" y="42" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="sans-serif">RELAY 5V</text>
      <!-- Screw Terminals Right -->
      <rect x="90" y="14" width="16" height="14" rx="2" fill="#15803d"/>
      <rect x="90" y="34" width="16" height="14" rx="2" fill="#15803d"/>
      <rect x="90" y="54" width="16" height="14" rx="2" fill="#15803d"/>
      <!-- Header Pins Left -->
      <circle cx="14" cy="20" r="2.5" fill="#eab308"/>
      <circle cx="14" cy="40" r="2.5" fill="#eab308"/>
      <circle cx="14" cy="60" r="2.5" fill="#eab308"/>
    `;
  }

  getTmp36SVG(comp) {
    return `
      <!-- TO-92 Semi-Cylinder Body -->
      <path d="M 6 12 Q 18 2 30 12 L 30 26 L 6 26 Z" fill="#1e293b" stroke="#0f172a" stroke-width="1.5"/>
      <text x="18" y="21" font-size="6" font-weight="bold" fill="#38bdf8" text-anchor="middle">TMP</text>
      <!-- 3 Solder Leads -->
      <rect x="6" y="26" width="3" height="12" fill="#94a3b8"/>
      <rect x="16" y="26" width="3" height="12" fill="#94a3b8"/>
      <rect x="26" y="26" width="3" height="12" fill="#94a3b8"/>
    `;
  }

  getUltrasonicSensorSVG(comp) {
    return `
      <rect width="136" height="62" rx="6" fill="#0284c7" stroke="#0369a1" stroke-width="2"/>
      <!-- Left Transducer (Transmitter) -->
      <circle cx="34" cy="31" r="22" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
      <circle cx="34" cy="31" r="14" fill="#0f172a"/>
      <text x="34" y="34" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle">T</text>
      <!-- Right Transducer (Receiver) -->
      <circle cx="102" cy="31" r="22" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
      <circle cx="102" cy="31" r="14" fill="#0f172a"/>
      <text x="102" y="34" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle">R</text>
      <!-- 4 Pins Bottom -->
      <circle cx="48" cy="60" r="2.2" fill="#eab308"/>
      <circle cx="58" cy="60" r="2.2" fill="#eab308"/>
      <circle cx="68" cy="60" r="2.2" fill="#eab308"/>
      <circle cx="78" cy="60" r="2.2" fill="#eab308"/>
    `;
  }

  getPhotoresistorSVG(comp) {
    return `
      <circle cx="16" cy="16" r="13" fill="#b45309" stroke="#78350f" stroke-width="1.5"/>
      <circle cx="16" cy="16" r="10" fill="#fef08a"/>
      <!-- Serpentine Cadmium Track -->
      <path d="M 10 11 Q 16 13 22 11 Q 16 16 10 16 Q 16 21 22 21" fill="none" stroke="#dc2626" stroke-width="1.5"/>
      <rect x="6" y="26" width="3" height="8" fill="#94a3b8"/>
      <rect x="22" y="26" width="3" height="8" fill="#94a3b8"/>
    `;
  }

  getRgbLedSVG(comp) {
    return `
      <!-- Clear/Milky Lens -->
      <circle cx="19" cy="15" r="13" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" opacity="0.9"/>
      <!-- Internal Red/Green/Blue Chips -->
      <circle cx="15" cy="13" r="2" fill="#ef4444"/>
      <circle cx="19" cy="11" r="2" fill="#10b981"/>
      <circle cx="23" cy="13" r="2" fill="#3b82f6"/>
      <!-- 4 Anode/Cathode Leads -->
      <rect x="7" y="26" width="2" height="10" fill="#94a3b8"/>
      <rect x="14" y="26" width="2" height="12" fill="#94a3b8"/>
      <rect x="21" y="26" width="2" height="10" fill="#94a3b8"/>
      <rect x="28" y="26" width="2" height="10" fill="#94a3b8"/>
    `;
  }

  getCapacitorSVG(comp) {
    return `
      <!-- Ceramic Disc Body -->
      <circle cx="18" cy="16" r="14" fill="#b45309" stroke="#78350f" stroke-width="1.5"/>
      <text x="18" y="20" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle">104</text>
      <!-- Two Solder Leads -->
      <rect x="9" y="26" width="2.5" height="10" fill="#94a3b8"/>
      <rect x="25" y="26" width="2.5" height="10" fill="#94a3b8"/>
    `;
  }

  getDiodeSVG(comp) {
    return `
      <!-- Axial Lead Left -->
      <line x1="2" y1="10" x2="16" y2="10" stroke="#94a3b8" stroke-width="2"/>
      <!-- Black Cylinder Body -->
      <rect x="16" y="3" width="36" height="14" rx="3" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>
      <!-- Silver Cathode Band -->
      <rect x="44" y="3" width="6" height="14" fill="#cbd5e1"/>
      <!-- Axial Lead Right -->
      <line x1="52" y1="10" x2="68" y2="10" stroke="#94a3b8" stroke-width="2"/>
    `;
  }

  getTransistorSVG(comp) {
    return `
      <!-- TO-220 Metal Backing Tab -->
      <rect x="4" y="4" width="40" height="20" rx="3" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1.5"/>
      <circle cx="24" cy="14" r="5" fill="#475569"/>
      <!-- Black Molded Body -->
      <rect x="4" y="22" width="40" height="36" rx="2" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>
      <text x="24" y="42" font-size="8" font-weight="bold" fill="#f8fafc" text-anchor="middle">TIP120</text>
      <!-- B, C, E Leads -->
      <rect x="10" y="58" width="3.5" height="12" fill="#94a3b8"/>
      <rect x="22" y="58" width="3.5" height="12" fill="#94a3b8"/>
      <rect x="34" y="58" width="3.5" height="12" fill="#94a3b8"/>
    `;
  }

  getSlideSwitchSVG(comp) {
    return `
      <rect width="50" height="22" rx="3" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1.5"/>
      <rect x="16" y="2" width="18" height="18" rx="2" fill="#0f172a"/>
      <!-- 3 Solder Lugs -->
      <rect x="10" y="22" width="3.5" height="8" fill="#94a3b8"/>
      <rect x="24" y="22" width="3.5" height="8" fill="#94a3b8"/>
      <rect x="38" y="22" width="3.5" height="8" fill="#94a3b8"/>
    `;
  }

  get7SegmentSVG(comp) {
    return `
      <rect width="58" height="86" rx="4" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
      <text x="29" y="58" font-size="44" font-weight="bold" fill="#ef4444" text-anchor="middle" font-family="monospace">8</text>
      <circle cx="50" cy="74" r="3.5" fill="#ef4444"/>
    `;
  }

  getOledDisplaySVG(comp) {
    return `
      <rect width="106" height="106" rx="6" fill="#1e3a8a" stroke="#172554" stroke-width="2"/>
      <rect x="10" y="22" width="86" height="74" rx="3" fill="#020617"/>
      <text x="53" y="55" font-size="11" font-weight="bold" fill="#38bdf8" text-anchor="middle" font-family="monospace">0.96" OLED</text>
      <text x="53" y="72" font-size="9" fill="#93c5fd" text-anchor="middle" font-family="monospace">128 x 64 I2C</text>
      <!-- 4 Top Pins -->
      <circle cx="32" cy="12" r="2.5" fill="#eab308"/>
      <circle cx="44" cy="12" r="2.5" fill="#eab308"/>
      <circle cx="56" cy="12" r="2.5" fill="#eab308"/>
      <circle cx="68" cy="12" r="2.5" fill="#eab308"/>
    `;
  }

  getBatteryAA4SVG(comp) {
    return `
      <rect width="116" height="84" rx="4" fill="#0f172a" stroke="#334155" stroke-width="2"/>
      <rect x="6" y="8" width="104" height="16" rx="2" fill="#1e293b"/>
      <rect x="6" y="26" width="104" height="16" rx="2" fill="#1e293b"/>
      <rect x="6" y="44" width="104" height="16" rx="2" fill="#1e293b"/>
      <rect x="6" y="62" width="104" height="16" rx="2" fill="#1e293b"/>
      <text x="58" y="46" font-size="12" font-weight="bold" fill="#f8fafc" text-anchor="middle">4x AA (6V)</text>
      <circle cx="110" cy="35" r="3" fill="#dc2626"/>
      <circle cx="110" cy="55" r="3" fill="#0f172a" stroke="#ffffff" stroke-width="1"/>
    `;
  }
}



