<script lang="ts">
	interface Props {
		active?: boolean;
		tool?: 'highlight' | 'line' | 'arrow' | 'none';
	}

	let { active = false, tool = 'none' }: Props = $props();

	// Fixed colors per tool type
	const toolColors = {
		highlight: '#FBBF24', // Yellow
		line: '#DC2626',      // Red
		arrow: '#DC2626',     // Red
		none: '#000000'
	};

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let isDrawing = $state(false);
	let startX = $state(0);
	let startY = $state(0);
	let currentX = $state(0);
	let currentY = $state(0);

	interface Annotation {
		type: 'highlight' | 'line' | 'arrow';
		startX: number;
		startY: number;
		endX: number;
		endY: number;
		color: string;
	}

	let annotations = $state<Annotation[]>([]);

	$effect(() => {
		if (canvas) {
			ctx = canvas.getContext('2d');
			resizeCanvas();
		}
	});

	function resizeCanvas() {
		if (canvas && canvas.parentElement) {
			canvas.width = canvas.parentElement.clientWidth;
			canvas.height = canvas.parentElement.clientHeight;
			redraw();
		}
	}

	function getMousePos(e: MouseEvent) {
		const rect = canvas.getBoundingClientRect();
		return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
	}

	function handleMouseDown(e: MouseEvent) {
		if (!active || tool === 'none') return;
		const pos = getMousePos(e);
		isDrawing = true;
		startX = pos.x;
		startY = pos.y;
		currentX = pos.x;
		currentY = pos.y;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDrawing || !active) return;
		const pos = getMousePos(e);
		currentX = pos.x;
		currentY = pos.y;
		redraw();
		drawPreview();
	}

	function handleMouseUp(e: MouseEvent) {
		if (!isDrawing || !active || tool === 'none') return;
		const pos = getMousePos(e);
		
		// Only add if there's actual movement
		const distance = Math.sqrt(Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2));
		if (distance > 5) {
			annotations.push({
				type: tool,
				startX,
				startY,
				endX: pos.x,
				endY: pos.y,
				color: toolColors[tool]
			});
		}
		
		isDrawing = false;
		redraw();
	}

	function redraw() {
		if (!ctx || !canvas) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		for (const ann of annotations) {
			drawAnnotation(ann);
		}
	}

	function drawPreview() {
		if (!ctx || !isDrawing || tool === 'none') return;
		
		drawAnnotation({
			type: tool,
			startX,
			startY,
			endX: currentX,
			endY: currentY,
			color: toolColors[tool]
		});
	}

	function drawAnnotation(ann: Annotation) {
		if (!ctx) return;

		ctx.strokeStyle = ann.color;
		ctx.fillStyle = ann.color;
		ctx.lineWidth = 3;
		ctx.lineCap = 'round';

		if (ann.type === 'highlight') {
			// Yellow highlight with no stroke
			ctx.globalAlpha = 0.4;
			ctx.fillStyle = ann.color;
			const width = ann.endX - ann.startX;
			const height = ann.endY - ann.startY;
			ctx.fillRect(ann.startX, ann.startY, width, height);
			ctx.globalAlpha = 1;
		} else if (ann.type === 'line') {
			ctx.beginPath();
			ctx.moveTo(ann.startX, ann.startY);
			ctx.lineTo(ann.endX, ann.endY);
			ctx.stroke();
		} else if (ann.type === 'arrow') {
			// Draw line
			ctx.beginPath();
			ctx.moveTo(ann.startX, ann.startY);
			ctx.lineTo(ann.endX, ann.endY);
			ctx.stroke();

			// Draw arrowhead
			const angle = Math.atan2(ann.endY - ann.startY, ann.endX - ann.startX);
			const headLength = 15;
			
			ctx.beginPath();
			ctx.moveTo(ann.endX, ann.endY);
			ctx.lineTo(
				ann.endX - headLength * Math.cos(angle - Math.PI / 6),
				ann.endY - headLength * Math.sin(angle - Math.PI / 6)
			);
			ctx.moveTo(ann.endX, ann.endY);
			ctx.lineTo(
				ann.endX - headLength * Math.cos(angle + Math.PI / 6),
				ann.endY - headLength * Math.sin(angle + Math.PI / 6)
			);
			ctx.stroke();
		}
	}

	export function clearAnnotations() {
		annotations = [];
		redraw();
	}

	export function undo() {
		annotations.pop();
		redraw();
	}
</script>

<svelte:window onresize={resizeCanvas} />

<canvas
	bind:this={canvas}
	class="absolute inset-0 {active && tool !== 'none' ? 'z-20 cursor-crosshair' : 'z-10 pointer-events-none'}"
	onmousedown={handleMouseDown}
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
	onmouseleave={() => { if (isDrawing) { isDrawing = false; redraw(); } }}
></canvas>
