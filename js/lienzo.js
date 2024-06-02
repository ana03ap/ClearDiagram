document.addEventListener('DOMContentLoaded', () => {
    // Obtener el lienzo de dibujo
    const drawingCanvas = document.getElementById('drawingCanvas');

    // Variables para rastrear el estado de las herramientas y elementos dibujados
    let currentTool = null;
    let startX, startY;
    let isDrawingArrow = false;
    let currentLine = null;
    let currentArrowHead = null;
    let selectedElement = null, offset = { x: 0, y: 0 };

    // Evento click para la herramienta de flecha
    document.getElementById('arrowTool').addEventListener('click', () => {
        currentTool = 'arrow';
        console.log("Arrow tool selected");
    });

    // Evento click para la herramienta de cuadrado
    document.getElementById('squareTool').addEventListener('click', () => {
        currentTool = 'square';
        console.log("Square tool selected");
    });

    // Evento mousedown en el lienzo de dibujo
    drawingCanvas.addEventListener('mousedown', (event) => {
        const target = event.target;
        if (currentTool === 'arrow') {
            // Iniciar el dibujo de la flecha
            startX = event.clientX;
            startY = event.clientY;
            currentLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            currentLine.setAttribute('x1', startX);
            currentLine.setAttribute('y1', startY);
            currentLine.setAttribute('x2', startX);
            currentLine.setAttribute('y2', startY);
            currentLine.setAttribute('stroke', 'black');
            currentLine.setAttribute('stroke-width', '2');
            drawingCanvas.appendChild(currentLine);
        
            currentArrowHead = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            currentArrowHead.setAttribute('points', `${startX},${startY} ${startX},${startY} ${startX},${startY}`);
            currentArrowHead.setAttribute('fill', 'black');
            currentArrowHead.setAttribute('class', 'draggable arrow');
            drawingCanvas.appendChild(currentArrowHead);
            console.log("Arrow started at: ", startX, startY);
            isDrawingArrow = true;
        } else if (currentTool === 'square') {
            // Dibujar un cuadrado
            const size = 50;
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute('x', event.clientX - size / 2);
            rect.setAttribute('y', event.clientY - size / 2);
            rect.setAttribute('width', size);
            rect.setAttribute('height', size);
            rect.setAttribute('stroke', 'black');
            rect.setAttribute('fill', 'transparent');
            rect.setAttribute('class', 'draggable');
            drawingCanvas.appendChild(rect);
            console.log("Square drawn at: ", event.clientX, event.clientY);
        } else if (target.classList.contains('draggable')) {
            // Seleccionar un elemento para arrastrarlo, no sirve
            if (selectedElement === target) {
                selectedElement = null;
            } else {
                selectedElement = target;
                offset.x = event.clientX - parseFloat(target.getAttribute('x') || target.getAttribute('cx') || 0);
                offset.y = event.clientY - parseFloat(target.getAttribute('y') || target.getAttribute('cy') || 0);
                console.log("Element selected for dragging: ", selectedElement);
            }
        }
    });

    // Evento mousemove para arrastrar elementos seleccionados
    drawingCanvas.addEventListener('mousemove', (event) => {
        if (selectedElement) {
            selectedElement.setAttribute('x', event.clientX - offset.x);
            selectedElement.setAttribute('y', event.clientY - offset.y);
        }
        if (isDrawingArrow && currentLine) {
            // Actualizar la flecha mientras se dibuja
            const x = event.clientX;
            const y = event.clientY;

            currentLine.setAttribute('x2', x);
            currentLine.setAttribute('y2', y);

            const angle = Math.atan2(y - startY, x - startX);
            const arrowSize = 10;
            const arrowPoints = [
                x, y,
                x - arrowSize * Math.cos(angle - Math.PI / 6), y - arrowSize * Math.sin(angle - Math.PI / 6),
                x - arrowSize * Math.cos(angle + Math.PI / 6), y - arrowSize * Math.sin(angle + Math.PI / 6),
            ].join(' ');

            currentArrowHead.setAttribute('points', arrowPoints);
            console.log("Arrow updated to: ", x, y);
        }
    });

    // Evento click para seleccionar una flecha existente
    drawingCanvas.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('arrow')) {
            if (selectedElement === target) {
                selectedElement = null;
            } else {
                selectedElement = target;
                offset.x = event.clientX - parseFloat(target.getAttribute('points').split(' ')[0]);
                offset.y = event.clientY - parseFloat(target.getAttribute('points').split(' ')[1]);
                console.log("Arrow selected for dragging: ", selectedElement);
            }
        }
    });

    // Eventos mouseup y mouseleave para finalizar acciones de dibujo y arrastre
    drawingCanvas.addEventListener('mouseup', () => {
        isDrawingArrow = false;
        selectedElement = null;
    });

    drawingCanvas.addEventListener('mouseleave', () => {
        isDrawingArrow = false;
        selectedElement = null;
    });
});
