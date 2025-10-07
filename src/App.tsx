import { useState, useCallback } from 'react';
import { OpenCvProvider, useOpenCv } from 'opencv-react-ts';
import { ImageUploader } from './components/ImageUploader';
import { ProcessingControls } from './components/ProcessingControls';
import { processImage, type ProcessingOptions } from './utils/imageProcessor';
import { ResultModal } from './components/ResultModal';

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
		removeSolid: true,
		removeShadow: false,
		tolerance: 20,
	});
	const [modalOpen, setModalOpen] = useState(false);

	const handleImageLoad = useCallback((image: HTMLImageElement, file: File) => {
		setOriginalImage(image);
		setFileName(file.name);
		setProcessedImage(null);
		setError(null);
	}, []);

	const handleProcess = useCallback(() => {
		if (!originalImage || !loaded || !cv) return;

		setProcessing(true);
		setError(null);
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

	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden ">
			{/* Animated background elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
				<div
					className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse"
					style={{ animationDelay: '1s' }}></div>
			</div>

			<div className="relative z-10 min-h-screen flex flex-col">
				{/* Header */}
				<header className="w-full py-8 px-4 text-center">
					<h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-cyan-200 to-purple-200 mb-3 tracking-tight drop-shadow-2xl">
						Background Remover
					</h1>
					<p className="text-lg text-blue-100/90 max-w-2xl mx-auto">
						Remove checkered patterns and backgrounds from your images — 100% client-side
					</p>
				</header>

				{/* Main Content Area */}
				<main className="flex-1 flex items-center justify-center px-4 py-8">
					{!loaded ? (
						<div className="text-center">
							<div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mb-6"></div>
							<p className="text-blue-100 text-xl font-semibold">Loading OpenCV...</p>
							<p className="text-blue-200/70 mt-2">This may take a moment on first load</p>
						</div>
					) : !originalImage ? (
						/* Initial Upload State - Centered */
						<div className="w-full max-w-2xl mx-auto">
							<div className="text-center mb-8">
								<h2 className="text-3xl font-bold text-white mb-3">Get Started</h2>
								<p className="text-blue-200/80 text-lg">Upload an image to remove its background instantly</p>
							</div>
							<ImageUploader onImageLoad={handleImageLoad} />
							<div className="mt-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
								<h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
									<svg
										className="w-5 h-5"
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
								<ul className="text-blue-200/80 space-y-3">
									<li className="flex items-start gap-3">
										<span className="text-blue-400 font-bold">1.</span>
										<span>Upload a PNG or JPG image with a checkered or solid background</span>
									</li>
									<li className="flex items-start gap-3">
										<span className="text-blue-400 font-bold">2.</span>
										<span>Choose processing options and adjust tolerance</span>
									</li>
									<li className="flex items-start gap-3">
										<span className="text-blue-400 font-bold">3.</span>
										<span>Preview, crop if needed, and download as transparent PNG</span>
									</li>
								</ul>
							</div>
						</div>
					) : (
						/* Split View - After Upload */
						<div className="w-full max-w-[1600px] mx-auto px-4">
							{error && (
								<div
									role="alert"
									className="bg-red-500/20 backdrop-blur-sm border border-red-400/50 text-red-100 px-6 py-4 rounded-xl mb-6 shadow-lg">
									<p className="font-semibold flex items-center gap-2">
										<span className="inline-block h-3 w-3 rounded-full bg-red-400 animate-pulse"></span>
										Processing failed
									</p>
									<p className="text-sm mt-1 text-red-200">{error}</p>
								</div>
							)}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								{/* Left: Preview */}
								<div className="flex flex-col gap-4 min-w-0">
									<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl">
										<div className="flex items-center justify-between mb-4 flex-wrap gap-2">
											<h3 className="text-white font-semibold text-lg">Original Image</h3>
											<button
												onClick={handleReset}
												className="text-sm text-blue-300 hover:text-blue-100 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-all duration-200 border border-white/10 hover:border-white/20 whitespace-nowrap">
												Change Image
											</button>
										</div>
										<div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center min-h-[300px]">
											<img
												src={originalImage.src}
												alt="Original"
												className="max-w-full h-auto max-h-[600px] object-contain"
											/>
										</div>
										<p className="text-blue-200/60 text-sm mt-3 truncate text-center">{fileName}</p>
									</div>
									{processing && (
										<div className="bg-blue-500/10 backdrop-blur-sm border border-blue-400/30 rounded-xl p-6 text-center">
											<div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent mb-3"></div>
											<p className="text-blue-100 font-semibold">Processing image...</p>
											<p className="text-blue-200/70 text-sm mt-1">This may take a few seconds</p>
										</div>
									)}
								</div>

								{/* Right: Controls */}
								<div className="flex flex-col gap-6 min-w-0">
									<ProcessingControls
										options={options}
										onOptionsChange={setOptions}
										onProcess={handleProcess}
										disabled={processing}
									/>
									<div className="bg-blue-500/10 backdrop-blur-sm border border-blue-400/30 rounded-xl p-5">
										<h4 className="font-semibold text-white mb-3 flex items-center gap-2">
											<svg
												className="w-5 h-5 text-blue-300 flex-shrink-0"
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
										<ul className="text-sm text-blue-200/80 space-y-2">
											<li className="flex items-start gap-2">
												<span className="text-blue-400 mt-0.5">•</span>
												<span>Works best with standard gray checkered patterns</span>
											</li>
											<li className="flex items-start gap-2">
												<span className="text-blue-400 mt-0.5">•</span>
												<span>Adjust tolerance if background isn't fully removed</span>
											</li>
											<li className="flex items-start gap-2">
												<span className="text-blue-400 mt-0.5">•</span>
												<span>Shadow removal works best on light backgrounds</span>
											</li>
											<li className="flex items-start gap-2">
												<span className="text-blue-400 mt-0.5">•</span>
												<span>All processing happens in your browser — no uploads!</span>
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
				<footer className="w-full text-center py-6 text-sm text-blue-200/60 border-t border-white/10">
					<p>Built with React, TypeScript, and OpenCV.js • All processing is done locally in your browser</p>
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
