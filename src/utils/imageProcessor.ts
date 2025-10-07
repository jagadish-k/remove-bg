export interface ProcessingOptions {
	removeCheckered: boolean;
	removeSolid: boolean;
	removeShadow: boolean;
	tolerance: number;
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
			removeCheckeredPattern(cv, src, alpha, options.tolerance);
		}

		// Remove solid background (detect dominant color at edges)
		if (options.removeSolid) {
			removeSolidBackground(cv, src, alpha, options.tolerance);
		}

		// Remove shadows (detect darker regions)
		if (options.removeShadow) {
			removeShadows(cv, src, alpha, options.tolerance);
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

function removeCheckeredPattern(_cv: any, src: any, alpha: any, tolerance: number): void {
	// Sample corner pixels to detect checkered pattern colors
	const colors = sampleCheckerColors(src);

	// Remove pixels matching checker pattern
	for (let y = 0; y < src.rows; y++) {
		for (let x = 0; x < src.cols; x++) {
			const pixel = src.ucharPtr(y, x);
			const r = pixel[0];
			const g = pixel[1];
			const b = pixel[2];

			// Check if pixel matches any checker color
			for (const color of colors) {
				const diff = Math.abs(r - color.r) + Math.abs(g - color.g) + Math.abs(b - color.b);
				if (diff < tolerance * 3) {
					alpha.ucharPtr(y, x)[0] = 0;
					break;
				}
			}
		}
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

function removeSolidBackground(cv: any, src: any, alpha: any, tolerance: number): void {
	// Sample edge pixels to detect background color
	const bgColor = detectBackgroundColor(src);

	// Use flood fill from corners - mask must be (rows+2, cols+2) CV_8UC1
	const mask = new cv.Mat(src.rows + 2, src.cols + 2, cv.CV_8UC1, new cv.Scalar(0));
	const fillColor = new cv.Scalar(255, 255, 255, 255);
	const seedPoint = new cv.Point(0, 0);

	// Create mask for flood fill (use loDiff/hiDiff and fixed connectivity)
	try {
		cv.floodFill(
			src,
			mask,
			seedPoint,
			fillColor,
			new cv.Rect(),
			new cv.Scalar(tolerance, tolerance, tolerance, 0),
			new cv.Scalar(tolerance, tolerance, tolerance, 0),
			4 /* 4-connectivity */,
		);
	} catch (e) {
		// If floodFill fails (e.g., due to format), continue with color-diff approach only
		console.warn('floodFill failed, continuing with color-diff removal', e);
	}

	// Remove pixels matching background color
	for (let y = 0; y < src.rows; y++) {
		for (let x = 0; x < src.cols; x++) {
			const pixel = src.ucharPtr(y, x);
			const r = pixel[0];
			const g = pixel[1];
			const b = pixel[2];

			const diff = Math.abs(r - bgColor.r) + Math.abs(g - bgColor.g) + Math.abs(b - bgColor.b);
			if (diff < tolerance * 3) {
				alpha.ucharPtr(y, x)[0] = 0;
			}
		}
	}

	mask.delete();
}

function detectBackgroundColor(src: any): { r: number; g: number; b: number } {
	// Sample all four edges to find most common color
	const edgeSamples: number[][] = [];

	const sampleStep = 5;

	// Top edge
	for (let x = 0; x < src.cols; x += sampleStep) {
		const pixel = src.ucharPtr(0, x);
		edgeSamples.push([pixel[0], pixel[1], pixel[2]]);
	}

	// Bottom edge
	for (let x = 0; x < src.cols; x += sampleStep) {
		const pixel = src.ucharPtr(src.rows - 1, x);
		edgeSamples.push([pixel[0], pixel[1], pixel[2]]);
	}

	// Left edge
	for (let y = 0; y < src.rows; y += sampleStep) {
		const pixel = src.ucharPtr(y, 0);
		edgeSamples.push([pixel[0], pixel[1], pixel[2]]);
	}

	// Right edge
	for (let y = 0; y < src.rows; y += sampleStep) {
		const pixel = src.ucharPtr(y, src.cols - 1);
		edgeSamples.push([pixel[0], pixel[1], pixel[2]]);
	}

	// Calculate average
	const avg = edgeSamples.reduce(
		(acc, color) => ({
			r: acc.r + color[0],
			g: acc.g + color[1],
			b: acc.b + color[2],
		}),
		{ r: 0, g: 0, b: 0 },
	);

	const count = edgeSamples.length;
	return {
		r: Math.round(avg.r / count),
		g: Math.round(avg.g / count),
		b: Math.round(avg.b / count),
	};
}

function removeShadows(cv: any, src: any, alpha: any, tolerance: number): void {
	// Convert to HSV to better detect shadows
	const hsv = new cv.Mat();
	cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
	cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

	// Split channels
	const channels = new cv.MatVector();
	cv.split(hsv, channels);

	// Value channel (brightness)
	const vChannel = channels.get(2);

	// Threshold to find dark regions (shadows)
	const shadowMask = new cv.Mat();
	cv.threshold(vChannel, shadowMask, tolerance * 2.5, 255, cv.THRESH_BINARY_INV);

	// Apply morphological operations to clean up
	const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(5, 5));
	cv.morphologyEx(shadowMask, shadowMask, cv.MORPH_OPEN, kernel);
	cv.morphologyEx(shadowMask, shadowMask, cv.MORPH_CLOSE, kernel);

	// Blur to soften edges
	cv.GaussianBlur(shadowMask, shadowMask, new cv.Size(5, 5), 0);

	// Apply to alpha with feathering
	for (let y = 0; y < src.rows; y++) {
		for (let x = 0; x < src.cols; x++) {
			const shadowValue = shadowMask.ucharPtr(y, x)[0];
			if (shadowValue > 128) {
				const currentAlpha = alpha.ucharPtr(y, x)[0];
				// Gradually reduce alpha based on shadow intensity
				const newAlpha = Math.floor(currentAlpha * (1 - shadowValue / 255));
				alpha.ucharPtr(y, x)[0] = newAlpha;
			}
		}
	}

	hsv.delete();
	channels.delete();
	vChannel.delete();
	shadowMask.delete();
	kernel.delete();
}
