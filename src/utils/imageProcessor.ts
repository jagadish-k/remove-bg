export interface ProcessingOptions {
	removeCheckered: boolean;
	tolerance: number;
	selectedColors?: Array<{ r: number; g: number; b: number }>;
}

export const generatePreviewMask = (cv: any, imageElement: HTMLImageElement, options: ProcessingOptions): string => {
	if (!cv) {
		throw new Error('OpenCV is not loaded yet. Please wait a moment and try again.');
	}

	const src = cv.imread(imageElement);
	try {
		// Convert to RGBA if not already
		if (src.channels() === 3) {
			cv.cvtColor(src, src, cv.COLOR_RGB2RGBA);
		}

		// Create mask to track what will be removed
		const mask = new cv.Mat(src.rows, src.cols, cv.CV_8UC1, new cv.Scalar(0));

		// Process checkered patterns (automatic detection only)
		if (options.removeCheckered) {
			const colors = sampleCheckerColors(src);
			if (colors.length > 0) {
				const visited = new Array(src.rows).fill(0).map(() => new Array(src.cols).fill(false));
				const seedPoints = [
					{ x: 0, y: 0 },
					{ x: src.cols - 1, y: 0 },
					{ x: 0, y: src.rows - 1 },
					{ x: src.cols - 1, y: src.rows - 1 },
					{ x: Math.floor(src.cols / 2), y: 0 },
					{ x: Math.floor(src.cols / 2), y: src.rows - 1 },
					{ x: 0, y: Math.floor(src.rows / 2) },
					{ x: src.cols - 1, y: Math.floor(src.rows / 2) },
				];

				for (const seedPoint of seedPoints) {
					if (seedPoint.x < 0 || seedPoint.x >= src.cols || seedPoint.y < 0 || seedPoint.y >= src.rows) continue;
					if (visited[seedPoint.y][seedPoint.x]) continue;

					const pixel = src.ucharPtr(seedPoint.y, seedPoint.x);
					const seedR = pixel[0];
					const seedG = pixel[1];
					const seedB = pixel[2];

					// Check if seed matches any checkered color
					let matchesColor = false;
					for (const color of colors) {
						const diff = Math.abs(seedR - color.r) + Math.abs(seedG - color.g) + Math.abs(seedB - color.b);
						if (diff < options.tolerance * 3) {
							matchesColor = true;
							break;
						}
					}

					if (matchesColor) {
						magicWandFillMask(src, mask, visited, seedPoint.x, seedPoint.y, seedR, seedG, seedB, options.tolerance);
					}
				}
			}
		}

		// Process user-selected colors separately (with higher tolerance for blur/anti-aliasing)
		if (options.selectedColors && options.selectedColors.length > 0) {
			const visited = new Array(src.rows).fill(0).map(() => new Array(src.cols).fill(false));
			const seedPoints = [
				{ x: 0, y: 0 },
				{ x: src.cols - 1, y: 0 },
				{ x: 0, y: src.rows - 1 },
				{ x: src.cols - 1, y: src.rows - 1 },
				{ x: Math.floor(src.cols / 2), y: 0 },
				{ x: Math.floor(src.cols / 2), y: src.rows - 1 },
				{ x: 0, y: Math.floor(src.rows / 2) },
				{ x: src.cols - 1, y: Math.floor(src.rows / 2) },
			];

			for (const seedPoint of seedPoints) {
				if (seedPoint.x < 0 || seedPoint.x >= src.cols || seedPoint.y < 0 || seedPoint.y >= src.rows) continue;
				if (visited[seedPoint.y][seedPoint.x]) continue;

				const pixel = src.ucharPtr(seedPoint.y, seedPoint.x);
				const seedR = pixel[0];
				const seedG = pixel[1];
				const seedB = pixel[2];

				// Check if seed matches any user-selected color (with higher tolerance)
				let matchesColor = false;
				for (const color of options.selectedColors) {
					const diff = Math.abs(seedR - color.r) + Math.abs(seedG - color.g) + Math.abs(seedB - color.b);
					if (diff < options.tolerance * 5) {
						matchesColor = true;
						break;
					}
				}

				if (matchesColor) {
					// Use higher tolerance for flood fill to catch blur/anti-aliasing
					magicWandFillMask(src, mask, visited, seedPoint.x, seedPoint.y, seedR, seedG, seedB, options.tolerance * 1.5);
				}
			}
		}

		// Create red overlay for masked areas
		const overlay = new cv.Mat(src.rows, src.cols, cv.CV_8UC4);
		for (let y = 0; y < src.rows; y++) {
			for (let x = 0; x < src.cols; x++) {
				const srcPixel = src.ucharPtr(y, x);
				const overlayPixel = overlay.ucharPtr(y, x);
				const maskValue = mask.ucharPtr(y, x)[0];

				if (maskValue === 255) {
					// Red overlay with 50% opacity
					overlayPixel[0] = Math.floor(srcPixel[0] * 0.5 + 255 * 0.5);
					overlayPixel[1] = Math.floor(srcPixel[1] * 0.5);
					overlayPixel[2] = Math.floor(srcPixel[2] * 0.5);
					overlayPixel[3] = 255;
				} else {
					overlayPixel[0] = srcPixel[0];
					overlayPixel[1] = srcPixel[1];
					overlayPixel[2] = srcPixel[2];
					overlayPixel[3] = srcPixel[3] || 255;
				}
			}
		}

		const canvas = document.createElement('canvas');
		canvas.width = imageElement.naturalWidth || src.cols;
		canvas.height = imageElement.naturalHeight || src.rows;
		cv.imshow(canvas, overlay);
		const dataUrl = canvas.toDataURL('image/png');

		mask.delete();
		overlay.delete();
		return dataUrl;
	} finally {
		src.delete();
	}
};

function magicWandFillMask(
	src: any,
	mask: any,
	visited: boolean[][],
	startX: number,
	startY: number,
	targetR: number,
	targetG: number,
	targetB: number,
	tolerance: number,
): void {
	const stack = [{ x: startX, y: startY }];
	const rows = src.rows;
	const cols = src.cols;

	while (stack.length > 0) {
		const { x, y } = stack.pop()!;

		if (x < 0 || x >= cols || y < 0 || y >= rows) continue;
		if (visited[y][x]) continue;

		const pixel = src.ucharPtr(y, x);
		const r = pixel[0];
		const g = pixel[1];
		const b = pixel[2];

		const diff = Math.abs(r - targetR) + Math.abs(g - targetG) + Math.abs(b - targetB);
		if (diff > tolerance * 3) continue;

		visited[y][x] = true;
		mask.ucharPtr(y, x)[0] = 255;

		stack.push({ x: x + 1, y });
		stack.push({ x: x - 1, y });
		stack.push({ x, y: y + 1 });
		stack.push({ x, y: y - 1 });
	}
}

export const processImage = (cv: any, imageElement: HTMLImageElement, options: ProcessingOptions): string => {
	if (!cv) {
		throw new Error('OpenCV is not loaded yet. Please wait a moment and try again.');
	}
	// Read image
	const src = cv.imread(imageElement);
	const dst = new cv.Mat();

	try {
		// Convert to RGBA if not already
		if (src.channels() === 3) {
			cv.cvtColor(src, src, cv.COLOR_RGB2RGBA);
		}

		// Create alpha channel
		const alpha = new cv.Mat(src.rows, src.cols, cv.CV_8UC1, new cv.Scalar(255));

		// Detect and remove checkered pattern
		if (options.removeCheckered) {
			removeCheckeredPattern(cv, src, alpha, options.tolerance, options.selectedColors);
		}

		// Apply alpha channel
		const channels = new cv.MatVector();
		cv.split(src, channels);
		channels.set(3, alpha);
		cv.merge(channels, dst);

		// Create canvas and export at native resolution
		const canvas = document.createElement('canvas');
		canvas.width = imageElement.naturalWidth || src.cols;
		canvas.height = imageElement.naturalHeight || src.rows;
		cv.imshow(canvas, dst);
		const dataUrl = canvas.toDataURL('image/png');

		// Cleanup
		channels.delete();
		alpha.delete();

		return dataUrl;
	} finally {
		src.delete();
		dst.delete();
	}
};

function removeCheckeredPattern(
	_cv: any,
	src: any,
	alpha: any,
	tolerance: number,
	selectedColors?: Array<{ r: number; g: number; b: number }>,
): void {
	// Sample corner pixels to detect checkered pattern colors (automatic detection only)
	const colors = sampleCheckerColors(src);
	if (colors.length === 0) return;

	// Create a visited mask to track which pixels we've already processed
	const visited = new Array(src.rows).fill(0).map(() => new Array(src.cols).fill(false));

	// Seed points to start flood fill from (edges)
	const seedPoints = [
		{ x: 0, y: 0 },
		{ x: src.cols - 1, y: 0 },
		{ x: 0, y: src.rows - 1 },
		{ x: src.cols - 1, y: src.rows - 1 },
		{ x: Math.floor(src.cols / 2), y: 0 },
		{ x: Math.floor(src.cols / 2), y: src.rows - 1 },
		{ x: 0, y: Math.floor(src.rows / 2) },
		{ x: src.cols - 1, y: Math.floor(src.rows / 2) },
	];

	// Flood fill from each seed point
	for (const seedPoint of seedPoints) {
		if (seedPoint.x < 0 || seedPoint.x >= src.cols || seedPoint.y < 0 || seedPoint.y >= src.rows) continue;
		if (visited[seedPoint.y][seedPoint.x]) continue;

		const pixel = src.ucharPtr(seedPoint.y, seedPoint.x);
		const seedR = pixel[0];
		const seedG = pixel[1];
		const seedB = pixel[2];

		// Check if seed matches any checkered color
		let matchesChecker = false;
		for (const color of colors) {
			const diff = Math.abs(seedR - color.r) + Math.abs(seedG - color.g) + Math.abs(seedB - color.b);
			if (diff < tolerance * 3) {
				matchesChecker = true;
				break;
			}
		}

		if (matchesChecker) {
			// Magic wand style flood fill
			magicWandFill(src, alpha, visited, seedPoint.x, seedPoint.y, seedR, seedG, seedB, tolerance);
		}
	}

	// Process user-selected colors separately with higher tolerance
	if (selectedColors && selectedColors.length > 0) {
		const userVisited = new Array(src.rows).fill(0).map(() => new Array(src.cols).fill(false));
		for (const seedPoint of seedPoints) {
			if (seedPoint.x < 0 || seedPoint.x >= src.cols || seedPoint.y < 0 || seedPoint.y >= src.rows) continue;
			if (userVisited[seedPoint.y][seedPoint.x]) continue;

			const pixel = src.ucharPtr(seedPoint.y, seedPoint.x);
			const seedR = pixel[0];
			const seedG = pixel[1];
			const seedB = pixel[2];

			// Check if seed matches any user-selected color
			let matchesUserColor = false;
			for (const color of selectedColors) {
				const diff = Math.abs(seedR - color.r) + Math.abs(seedG - color.g) + Math.abs(seedB - color.b);
				if (diff < tolerance * 5) {
					matchesUserColor = true;
					break;
				}
			}

			if (matchesUserColor) {
				// Use higher tolerance for user colors to catch blur/anti-aliasing
				magicWandFill(src, alpha, userVisited, seedPoint.x, seedPoint.y, seedR, seedG, seedB, tolerance * 1.5);
			}
		}
	}
}

function magicWandFill(
	src: any,
	alpha: any,
	visited: boolean[][],
	startX: number,
	startY: number,
	targetR: number,
	targetG: number,
	targetB: number,
	tolerance: number,
): void {
	const stack = [{ x: startX, y: startY }];
	const rows = src.rows;
	const cols = src.cols;

	while (stack.length > 0) {
		const { x, y } = stack.pop()!;

		// Bounds check
		if (x < 0 || x >= cols || y < 0 || y >= rows) continue;
		if (visited[y][x]) continue;

		const pixel = src.ucharPtr(y, x);
		const r = pixel[0];
		const g = pixel[1];
		const b = pixel[2];

		// Color similarity check
		const diff = Math.abs(r - targetR) + Math.abs(g - targetG) + Math.abs(b - targetB);
		if (diff > tolerance * 3) continue;

		// Mark as visited and transparent
		visited[y][x] = true;
		alpha.ucharPtr(y, x)[0] = 0;

		// Add neighbors to stack (4-connectivity)
		stack.push({ x: x + 1, y });
		stack.push({ x: x - 1, y });
		stack.push({ x, y: y + 1 });
		stack.push({ x, y: y - 1 });
	}
}

function sampleCheckerColors(src: any): Array<{ r: number; g: number; b: number }> {
	// Sample pixels from corners and edges to detect pattern
	const samples: Array<{ r: number; g: number; b: number }> = [];
	// Note: sample from fixed points; dynamic sample size not used currently

	const samplePoints = [
		[0, 0],
		[10, 10],
		[20, 20],
		[src.cols - 1, 0],
		[src.cols - 11, 10],
		[0, src.rows - 1],
		[10, src.rows - 11],
	];

	for (const [x, y] of samplePoints) {
		if (x >= 0 && x < src.cols && y >= 0 && y < src.rows) {
			const pixel = src.ucharPtr(y, x);
			samples.push({ r: pixel[0], g: pixel[1], b: pixel[2] });
		}
	}

	// Cluster similar colors
	const clustered = clusterColors(samples, 15);
	return clustered;
}

function clusterColors(
	colors: Array<{ r: number; g: number; b: number }>,
	threshold: number,
): Array<{ r: number; g: number; b: number }> {
	if (colors.length === 0) return [];

	const clusters: Array<{ r: number; g: number; b: number }> = [colors[0]];

	for (const color of colors) {
		let foundCluster = false;
		for (const cluster of clusters) {
			const diff = Math.abs(color.r - cluster.r) + Math.abs(color.g - cluster.g) + Math.abs(color.b - cluster.b);
			if (diff < threshold) {
				foundCluster = true;
				break;
			}
		}
		if (!foundCluster) {
			clusters.push(color);
		}
	}

	return clusters;
}
