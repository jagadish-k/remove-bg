import { useState, useCallback, useEffect } from 'react';
import { OpenCvProvider, useOpenCv } from 'opencv-react-ts';
import { ImageUploader } from './components/ImageUploader';
import { ProcessingControls } from './components/ProcessingControls';
import { processImage, generatePreviewMask, type ProcessingOptions } from './utils/imageProcessor';
import { ResultModal } from './components/ResultModal';
import buyMeACoffeeImg from './assets/buy-me-a-coffee-jagadish-kasi.png';

function AppContent() {
	const handleReset = useCallback(() => {
		setOriginalImage(null);
		setProcessedImage(null);
		setFileName('');
		setError(null);
	}, []);
	const { loaded, cv } = useOpenCv();
	const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
	const [fileName, setFileName] = useState<string>('');
	const [processedImage, setProcessedImage] = useState<string | null>(null);
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [options, setOptions] = useState<ProcessingOptions>({
		removeCheckered: true,
		tolerance: 20,
		selectedColors: [],
	});
	const [modalOpen, setModalOpen] = useState(false);
	const [previewMask, setPreviewMask] = useState<string | null>(null);
	const [showPreview, setShowPreview] = useState(false);
	const [cursorMagnifier, setCursorMagnifier] = useState<{
		x: number;
		y: number;
		imgX: number;
		imgY: number;
		visible: boolean;
	} | null>(null);

	const handleImageLoad = useCallback((image: HTMLImageElement, file: File) => {
		setOriginalImage(image);
		setFileName(file.name);
		setProcessedImage(null);
		setError(null);
		setPreviewMask(null);
		setShowPreview(false);
	}, []);

	const handlePreview = useCallback(() => {
		if (!originalImage || !loaded || !cv) return;

		// Toggle preview
		if (showPreview) {
			setShowPreview(false);
			setPreviewMask(null);
			return;
		}

		setProcessing(true);
		setError(null);
		setTimeout(() => {
			try {
				const mask = generatePreviewMask(cv, originalImage, options);
				setPreviewMask(mask);
				setShowPreview(true);
			} catch (err) {
				console.error('Preview error:', err);
				const details = err instanceof Error && err.message ? ` Details: ${err.message}` : '';
				setError(`Error generating preview. Please try a different image or adjust settings.${details}`);
			} finally {
				setProcessing(false);
			}
		}, 100);
	}, [originalImage, options, loaded, cv, showPreview]);

	const handleProcess = useCallback(() => {
		if (!originalImage || !loaded || !cv) return;

		setProcessing(true);
		setError(null);
		setShowPreview(false);
		setTimeout(() => {
			try {
				const result = processImage(cv, originalImage, options);
				setProcessedImage(result);
				setModalOpen(true);
			} catch (err) {
				console.error('Processing error:', err);
				const details = err instanceof Error && err.message ? ` Details: ${err.message}` : '';
				setError(`Error processing image. Please try a different image or adjust settings.${details}`);
			} finally {
				setProcessing(false);
			}
		}, 100);
	}, [originalImage, options, loaded, cv]);

	// For modal download (with optional crop)
	const handleModalDownload = useCallback(
		(croppedDataUrl?: string) => {
			const url = croppedDataUrl || processedImage;
			if (!url) return;
			const link = document.createElement('a');
			const newFileName = fileName.replace(/\.[^.]+$/, '-transparent.png');
			link.href = url;
			link.download = newFileName;
			link.click();
		},
		[processedImage, fileName],
	);

	// Auto-regenerate preview when options change
	useEffect(() => {
		if (!showPreview || !originalImage || !loaded || !cv || processing) return;

		const timeoutId = setTimeout(() => {
			try {
				const mask = generatePreviewMask(cv, originalImage, options);
				setPreviewMask(mask);
			} catch (err) {
				console.error('Preview regeneration error:', err);
			}
		}, 300); // Debounce for 300ms

		return () => clearTimeout(timeoutId);
	}, [options, showPreview, originalImage, loaded, cv, processing]);

	// Handle color picking from image
	const handleImageClick = useCallback(
		(event: React.MouseEvent<HTMLImageElement>) => {
			if (!originalImage || !cv || !loaded) return;

			const img = event.currentTarget;
			const rect = img.getBoundingClientRect();
			const x = Math.floor(((event.clientX - rect.left) / rect.width) * originalImage.naturalWidth);
			const y = Math.floor(((event.clientY - rect.top) / rect.height) * originalImage.naturalHeight);

			try {
				const src = cv.imread(originalImage);
				if (x >= 0 && x < src.cols && y >= 0 && y < src.rows) {
					const pixel = src.ucharPtr(y, x);
					const r = pixel[0];
					const g = pixel[1];
					const b = pixel[2];

					// Add color if not already selected (check inside state updater for latest state)
					const newColor = { r, g, b };

					setOptions((prev) => {
						// Check if color already exists using latest state
						const exists = prev.selectedColors?.some(
							(c) => Math.abs(c.r - r) + Math.abs(c.g - g) + Math.abs(c.b - b) < 15,
						);

						if (exists) {
							return prev; // No change
						}

						return {
							...prev,
							selectedColors: [...(prev.selectedColors || []), newColor],
						};
					});
				}
				src.delete();
			} catch (err) {
				console.error('Color picking error:', err);
			}
		},
		[originalImage, cv, loaded],
	);

	// Remove selected color
	const handleRemoveColor = useCallback((index: number) => {
		setOptions((prev) => ({
			...prev,
			selectedColors: prev.selectedColors?.filter((_, i) => i !== index) || [],
		}));
	}, []);

	// Handle mouse move for magnifier
	const handleImageMouseMove = useCallback(
		(event: React.MouseEvent<HTMLImageElement>) => {
			if (!originalImage) return;

			const img = event.currentTarget;
			const rect = img.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			const imgX = Math.floor((x / rect.width) * originalImage.naturalWidth);
			const imgY = Math.floor((y / rect.height) * originalImage.naturalHeight);

			setCursorMagnifier({
				x: event.clientX,
				y: event.clientY,
				imgX,
				imgY,
				visible: true,
			});
		},
		[originalImage],
	);

	const handleImageMouseLeave = useCallback(() => {
		setCursorMagnifier(null);
	}, []);

	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 relative overflow-hidden">
			{/* Animated background elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
				<div
					className="absolute w-96 h-96 bg-purple-400/20 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse"
					style={{ animationDelay: '1s' }}></div>
			</div>

			<div className="relative z-10 min-h-screen flex flex-col">
				{/* Header */}
				<header className="w-full py-1 px-4 text-center">
					<h1 className="text-5xl md:text-6xl font-extrabold mb-3 tracking-tight drop-shadow-lg flex flex-row justify-center items-center gap-3">
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
							Remove{' '}
						</span>
						<svg
							className="inline-block align-baseline"
							width="260"
							height="70"
							viewBox="0 0 260 72"
							xmlns="http://www.w3.org/2000/svg">
							<defs>
								<pattern
									id="headerCheckerPattern"
									x="0"
									y="0"
									width="8"
									height="8"
									patternUnits="userSpaceOnUse">
									<rect
										x="0"
										y="0"
										width="4"
										height="4"
										fill="#D1D5DB"
									/>
									<rect
										x="4"
										y="0"
										width="4"
										height="4"
										fill="#F3F4F6"
									/>
									<rect
										x="0"
										y="4"
										width="4"
										height="4"
										fill="#F3F4F6"
									/>
									<rect
										x="4"
										y="4"
										width="4"
										height="4"
										fill="#D1D5DB"
									/>
								</pattern>
								<linearGradient
									id="bgGradient"
									x1="0%"
									y1="0%"
									x2="100%"
									y2="100%">
									<stop
										offset="0%"
										stopColor="#2563EB"
									/>
									<stop
										offset="50%"
										stopColor="#4F46E5"
									/>
									<stop
										offset="100%"
										stopColor="#7C3AED"
									/>
								</linearGradient>
							</defs>
							<text
								x="0"
								y="70"
								font-size="100"
								font-weight="400"
								font-family="'Black Ops One', system-ui, -apple-system, sans-serif"
								fill="url(#headerCheckerPattern)"
								stroke="url(#bgGradient)"
								stroke-width="1">
								BG
							</text>
						</svg>
					</h1>
					<p className="text-md text-gray-700 max-w-2xl mx-auto font-medium">
						Remove checkered patterns and backgrounds from your images — 100% client-side
					</p>
				</header>

				{/* Main Content Area */}
				<main className="flex-1 flex  justify-center px-4 py-2">
					{!loaded ? (
						<div className="text-center">
							<div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-6"></div>
							<p className="text-gray-800 text-xl font-semibold">Loading OpenCV...</p>
							<p className="text-gray-600 mt-2">This may take a moment on first load</p>
						</div>
					) : !originalImage ? (
						/* Initial Upload State - Centered */
						<div className="w-full max-w-6xl mx-auto mt-6">
							<div className="text-center mb-8">
								<h2 className="text-3xl font-bold text-gray-800 mb-3">Get Started</h2>
								<p className="text-gray-600 text-lg">Upload an image to remove its background instantly</p>
							</div>
							<div className="gap-2 sm:gap-8 grid grid-cols-1 sm:grid-cols-2">
								<div className="flex-col">
									<ImageUploader onImageLoad={handleImageLoad} />
								</div>
								<div className="flex-col bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-lg">
									<h3 className="text-gray-800 font-semibold text-lg mb-4 flex items-center gap-2">
										<svg
											className="w-5 h-5 text-blue-600"
											fill="currentColor"
											viewBox="0 0 20 20">
											<path
												fillRule="evenodd"
												d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
												clipRule="evenodd"
											/>
										</svg>
										How it works
									</h3>
									<ul className="text-gray-700 space-y-3">
										<li className="flex items-start gap-3">
											<span className="text-blue-600 font-bold">1.</span>
											<span>Upload a PNG or JPG image with a checkered or solid background</span>
										</li>
										<li className="flex items-start gap-3">
											<span className="text-blue-600 font-bold">2.</span>
											<span>Choose processing options and adjust tolerance</span>
										</li>
										<li className="flex items-start gap-3">
											<span className="text-blue-600 font-bold">3.</span>
											<span>Preview, crop if needed, and download as transparent PNG</span>
										</li>
									</ul>
									{/* add a link to how to use video available on youtube at : https://youtu.be/ujwvJOKHykA */}
									<div className="mt-16 text-center">
										<a
											href="https://youtu.be/ujwvJOKHykA"
											target="_blank"
											rel="noopener noreferrer"
											className="text-blue-600 hover:underline">
											Watch the tutorial video
										</a>
									</div>
								</div>
							</div>
						</div>
					) : (
						/* Split View - After Upload */
						<div className="w-full max-w-[1600px] mx-auto px-4">
							{error && (
								<div
									role="alert"
									className="bg-red-50 backdrop-blur-sm border border-red-300 text-red-800 px-6 py-4 rounded-xl mb-6 shadow-lg">
									<p className="font-semibold flex items-center gap-2">
										<span className="inline-block h-3 w-3 rounded-full bg-red-500 animate-pulse"></span>
										Processing failed
									</p>
									<p className="text-sm mt-1 text-red-700">{error}</p>
								</div>
							)}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								{/* Left: Preview */}
								<div className="flex flex-col gap-4 min-w-0">
									<div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-xl">
										<div className="flex items-center justify-between mb-4 flex-wrap gap-2">
											<h3 className="text-gray-800 font-semibold text-lg">Original Image</h3>
											<button
												onClick={handleReset}
												className="text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300 whitespace-nowrap">
												Change Image
											</button>
										</div>
										<div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center min-h-[300px]">
											<img
												src={showPreview && previewMask ? previewMask : originalImage.src}
												alt="Original"
												className="max-w-full h-auto max-h-[600px] object-contain cursor-crosshair"
												onClick={handleImageClick}
												onMouseMove={handleImageMouseMove}
												onMouseLeave={handleImageMouseLeave}
												title="Click to pick a background color to remove"
											/>
											{cursorMagnifier && cursorMagnifier.visible && originalImage && cv && (
												<div
													className="fixed pointer-events-none z-50"
													style={{
														left: cursorMagnifier.x - 100,
														top: cursorMagnifier.y - 168 - 110,
													}}>
													{/* Color info */}
													<div className="mt-2 bg-blue-600 text-white text-xs px-3 py-1 rounded-lg shadow-lg text-center font-mono">
														{(() => {
															try {
																const src = cv.imread(originalImage);
																if (
																	cursorMagnifier.imgX >= 0 &&
																	cursorMagnifier.imgX < src.cols &&
																	cursorMagnifier.imgY >= 0 &&
																	cursorMagnifier.imgY < src.rows
																) {
																	const pixel = src.ucharPtr(cursorMagnifier.imgY, cursorMagnifier.imgX);
																	const color = `RGB(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
																	src.delete();
																	return color;
																}
																src.delete();
																return 'Out of bounds';
															} catch {
																return 'Error';
															}
														})()}
													</div>
													<div className="relative w-32 h-32 rounded-full border-4 border-blue-500 shadow-2xl overflow-hidden bg-white">
														<canvas
															ref={(canvas) => {
																if (!canvas || !originalImage) return;
																const ctx = canvas.getContext('2d');
																if (!ctx) return;

																const radius = 16;
																const scale = 4;
																canvas.width = 128;
																canvas.height = 128;

																// Draw magnified portion
																const sx = Math.max(0, cursorMagnifier.imgX - radius);
																const sy = Math.max(0, cursorMagnifier.imgY - radius);
																const sw = Math.min(radius * 2, originalImage.naturalWidth - sx);
																const sh = Math.min(radius * 2, originalImage.naturalHeight - sy);

																ctx.drawImage(originalImage, sx, sy, sw, sh, 0, 0, sw * scale, sh * scale);

																// Draw crosshair
																ctx.strokeStyle = '#3b82f6';
																ctx.lineWidth = 2;
																ctx.beginPath();
																ctx.moveTo(64, 0);
																ctx.lineTo(64, 128);
																ctx.moveTo(0, 64);
																ctx.lineTo(128, 64);
																ctx.stroke();

																// Draw center pixel indicator
																ctx.fillStyle = '#3b82f6';
																ctx.fillRect(62, 62, 4, 4);
															}}
															width={128}
															height={128}
															className="w-full h-full"
														/>
													</div>
												</div>
											)}
											{showPreview && (
												<div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg">
													Preview Mode
												</div>
											)}
										</div>
										<p className="text-gray-600 text-sm mt-3 truncate text-center">{fileName}</p>
									</div>
									{processing && (
										<div className="bg-blue-50 backdrop-blur-sm border border-blue-200 rounded-xl p-6 text-center">
											<div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-3"></div>
											<p className="text-gray-800 font-semibold">Processing image...</p>
											<p className="text-gray-600 text-sm mt-1">This may take a few seconds</p>
										</div>
									)}
								</div>

								{/* Right: Controls */}
								<div className="flex flex-col gap-6 min-w-0">
									<ProcessingControls
										options={options}
										onOptionsChange={setOptions}
										onProcess={handleProcess}
										onPreview={handlePreview}
										disabled={processing}
										showingPreview={showPreview}
										onRemoveColor={handleRemoveColor}
									/>
									<div className="bg-blue-50 backdrop-blur-sm border border-blue-200 rounded-xl p-5 shadow-md">
										<h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
											<svg
												className="w-5 h-5 text-blue-600 flex-shrink-0"
												fill="currentColor"
												viewBox="0 0 20 20">
												<path
													fillRule="evenodd"
													d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
													clipRule="evenodd"
												/>
											</svg>
											Tips
										</h4>
										<ul className="text-sm text-gray-700 space-y-2">
											<li className="flex items-start gap-2">
												<span className="text-blue-600 mt-0.5">•</span>
												<span>Automatically detects and removes checkered patterns from edges</span>
											</li>
											<li className="flex items-start gap-2">
												<span className="text-blue-600 mt-0.5">•</span>
												<span>Click the image to manually pick additional background colors</span>
											</li>
											<li className="flex items-start gap-2">
												<span className="text-blue-600 mt-0.5">•</span>
												<span>Use the preview mask to see what will be removed before processing</span>
											</li>
											<li className="flex items-start gap-2">
												<span className="text-blue-600 mt-0.5">•</span>
												<span>All processing happens locally in your browser — no uploads!</span>
											</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
					)}
				</main>

				<ResultModal
					imageSrc={processedImage || ''}
					open={modalOpen && !!processedImage}
					onClose={() => setModalOpen(false)}
					onDownload={handleModalDownload}
				/>

				{/* Footer */}
				<footer className="w-full text-center py-6 text-sm text-gray-600 border-t border-gray-200 bg-white/50">
					<div className="max-w-4xl mx-auto px-4 space-y-6">
						{/* Product Hunt + Buy Me a Coffee Row */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:max-w-3xl mx-auto items-stretch">
							{/* Product Hunt badge (left) */}
							<div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-4">
								<a
									href="https://www.producthunt.com/products/remove-bg-4?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-remove&#0045;bg&#0045;4"
									target="_blank"
									rel="noopener noreferrer">
									<img
										src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1024181&theme=light&t=1759901638789"
										alt="Remove&#0032;BG - Remove&#0032;checkered&#0032;backgrounds&#0032;instantly&#0032;&#0045;&#0032;100&#0037;&#0032;client&#0045;side | Product Hunt"
										style={{ width: '250px', height: '54px' }}
										width={250}
										height={54}
									/>
								</a>

								{/* Icon links */}
								<div className="grid grid-cols-3 gap-3">
									<a
										href="https://github.com/jagadish-k/remove-bg"
										target="_blank"
										rel="noopener noreferrer"
										aria-label="GitHub Repository"
										className="text-gray-600 hover:text-blue-600 transition-colors">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="currentColor"
											className="w-6 h-6">
											<path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.35-1.3-1.71-1.3-1.71-1.06-.73.08-.72.08-.72 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.75-1.56-2.56-.29-5.26-1.28-5.26-5.71 0-1.26.45-2.29 1.2-3.1-.12-.3-.52-1.53.11-3.18 0 0 .98-.31 3.2 1.19a11.1 11.1 0 0 1 5.82 0c2.22-1.5 3.2-1.19 3.2-1.19.63 1.65.23 2.88.11 3.18.75.81 1.2 1.84 1.2 3.1 0 4.44-2.7 5.41-5.28 5.7.42.36.8 1.08.8 2.17 0 1.56-.01 2.82-.01 3.2 0 .31.21.68.8.56A10.5 10.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
										</svg>
									</a>
									<a
										href="https://www.linkedin.com/in/jagzviruz/"
										target="_blank"
										rel="noopener noreferrer"
										aria-label="LinkedIn Profile"
										className="text-gray-600 hover:text-blue-600 transition-colors">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="currentColor"
											className="w-6 h-6">
											<path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zM8.5 8h3.8v2.05h.05c.53-1 1.82-2.05 3.75-2.05 4.01 0 4.75 2.64 4.75 6.08V23h-4v-6.57c0-1.57-.03-3.6-2.2-3.6-2.21 0-2.55 1.72-2.55 3.5V23h-4V8z" />
										</svg>
									</a>
									<a
										href="https://x.com/jagzviruz"
										target="_blank"
										rel="noopener noreferrer"
										aria-label="X (Twitter) Profile"
										className="text-gray-600 hover:text-blue-600 transition-colors">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="currentColor"
											className="w-6 h-6">
											<path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.844l-5.02-6.02L5 22H1.744l8.27-9.46L2 2h6.844l4.54 5.54L18.244 2zM16.9 20h1.9L7.4 4h-1.9L16.9 20z" />
										</svg>
									</a>
								</div>
							</div>

							{/* Buy Me a Coffee Section (right) */}
							<div className="relative bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl overflow-hidden">
								{/* QR Code Background */}
								<div className="absolute right-0 top-2 bottom-2 w-24 opacity-80 flex items-center justify-center">
									<img
										src={buyMeACoffeeImg}
										alt=""
										className="h-16 w-auto"
									/>
								</div>

								{/* Content */}
								<div className="relative py-3 px-4 pr-28 text-left">
									<p className="text-sm text-gray-700 leading-relaxed">
										<span className="font-semibold text-gray-800">
											Love this tool? ☕<br />
										</span>{' '}
										If this saved you time,{' '}
										<a
											href="https://buymeacoffee.com/jagadishk"
											target="_blank"
											rel="noopener noreferrer"
											className="font-semibold text-orange-500 hover:text-orange-600 underline decoration-dotted underline-offset-2 transition-colors">
											consider buying me a coffee
										</a>{' '}
										— your support keeps this free for everyone.
									</p>
								</div>
							</div>
						</div>

						{/* Credits */}
						<p className="text-gray-600 text-xs">
							Built with React, TypeScript, and OpenCV.js • All processing is done locally in your browser
						</p>
					</div>
				</footer>
			</div>
		</div>
	);
}

function App() {
	return (
		<OpenCvProvider>
			<AppContent />
		</OpenCvProvider>
	);
}

export default App;
