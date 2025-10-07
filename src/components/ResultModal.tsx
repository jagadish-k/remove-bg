import React, { useEffect, useState, useRef } from 'react';

interface ResultModalProps {
	imageSrc: string;
	open: boolean;
	onClose: () => void;
	onDownload: (croppedDataUrl?: string) => void;
}

interface CropArea {
	x: number;
	y: number;
	width: number;
	height: number;
}

export const ResultModal: React.FC<ResultModalProps> = ({ imageSrc, open, onClose, onDownload }) => {
	const [imgSize, setImgSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
	const [cropArea, setCropArea] = useState<CropArea | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
	const [resizeHandle, setResizeHandle] = useState<string | null>(null);
	const canvasRef = useRef<HTMLDivElement>(null);

	// Reset state when a new image opens
	useEffect(() => {
		if (!imageSrc) return;
		const img = new Image();
		img.src = imageSrc;
		img.onload = () => {
			setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
			// Set default crop to full image
			setCropArea({ x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight });
		};
	}, [imageSrc]);

	const getRelativePosition = (clientX: number, clientY: number) => {
		if (!canvasRef.current) return { x: 0, y: 0 };
		const rect = canvasRef.current.getBoundingClientRect();
		const scaleX = imgSize.w / rect.width;
		const scaleY = imgSize.h / rect.height;
		return {
			x: Math.max(0, Math.min(imgSize.w, (clientX - rect.left) * scaleX)),
			y: Math.max(0, Math.min(imgSize.h, (clientY - rect.top) * scaleY)),
		};
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		const pos = getRelativePosition(e.clientX, e.clientY);

		// Check if clicking on resize handles
		if (cropArea) {
			const handleSize = 20;
			const handles = {
				nw: { x: cropArea.x, y: cropArea.y },
				ne: { x: cropArea.x + cropArea.width, y: cropArea.y },
				sw: { x: cropArea.x, y: cropArea.y + cropArea.height },
				se: { x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height },
			};

			for (const [handle, point] of Object.entries(handles)) {
				if (Math.abs(pos.x - point.x) < handleSize && Math.abs(pos.y - point.y) < handleSize) {
					setResizeHandle(handle);
					setIsDragging(true);
					setDragStart(pos);
					return;
				}
			}
		}

		// Start new crop
		setIsDragging(true);
		setDragStart(pos);
		setCropArea({ x: pos.x, y: pos.y, width: 0, height: 0 });
		setResizeHandle(null);
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDragging || !dragStart) return;

		const pos = getRelativePosition(e.clientX, e.clientY);

		if (resizeHandle && cropArea) {
			// Resize existing crop
			const newCrop = { ...cropArea };

			if (resizeHandle.includes('n')) {
				const maxY = cropArea.y + cropArea.height;
				newCrop.y = Math.min(pos.y, maxY - 10);
				newCrop.height = maxY - newCrop.y;
			}
			if (resizeHandle.includes('s')) {
				newCrop.height = Math.max(10, pos.y - newCrop.y);
			}
			if (resizeHandle.includes('w')) {
				const maxX = cropArea.x + cropArea.width;
				newCrop.x = Math.min(pos.x, maxX - 10);
				newCrop.width = maxX - newCrop.x;
			}
			if (resizeHandle.includes('e')) {
				newCrop.width = Math.max(10, pos.x - newCrop.x);
			}

			setCropArea(newCrop);
		} else {
			// Draw new crop
			const newCrop = {
				x: Math.min(dragStart.x, pos.x),
				y: Math.min(dragStart.y, pos.y),
				width: Math.abs(pos.x - dragStart.x),
				height: Math.abs(pos.y - dragStart.y),
			};
			setCropArea(newCrop);
		}
	};

	const handleMouseUp = () => {
		setIsDragging(false);
		setResizeHandle(null);
	};

	const resetCrop = () => {
		setCropArea({ x: 0, y: 0, width: imgSize.w, height: imgSize.h });
	};

	const handleDownloadClick = () => {
		if (!cropArea) {
			onDownload(imageSrc);
			return;
		}

		const img = new Image();
		img.src = imageSrc;
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = cropArea.width;
			canvas.height = cropArea.height;
			const ctx = canvas.getContext('2d');
			if (ctx) {
				ctx.drawImage(
					img,
					cropArea.x,
					cropArea.y,
					cropArea.width,
					cropArea.height,
					0,
					0,
					cropArea.width,
					cropArea.height,
				);
				onDownload(canvas.toDataURL('image/png'));
			}
		};
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
			<div className="bg-white rounded-2xl shadow-2xl p-6 max-w-5xl w-full relative border border-gray-200">
				{/* Close button */}
				<button
					className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all duration-200 z-10"
					onClick={onClose}>
					×
				</button>

				<h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
					Processed Image
				</h2>

				<div className="flex flex-col gap-6">
					{/* Image with crop overlay */}
					<div className="bg-gray-50 backdrop-blur-sm border border-gray-200 rounded-xl p-4">
						<div className="mb-3 text-center">
							<p className="text-gray-700 text-sm">
								<span className="font-semibold">Click and drag</span> on the image to select crop area.
								<span className="block mt-1">Drag the corners to resize.</span>
							</p>
						</div>
						<div
							ref={canvasRef}
							className="relative inline-block max-w-full mx-auto cursor-crosshair select-none"
							onMouseDown={handleMouseDown}
							onMouseMove={handleMouseMove}
							onMouseUp={handleMouseUp}
							onMouseLeave={handleMouseUp}>
							<img
								src={imageSrc}
								alt="Processed"
								className="max-h-[500px] w-auto rounded-lg border border-gray-300"
								draggable={false}
							/>

							{/* Crop overlay */}
							{cropArea && canvasRef.current && (
								<>
									{(() => {
										const rect = canvasRef.current.getBoundingClientRect();
										const img = canvasRef.current.querySelector('img');
										if (!img) return null;
										const imgRect = img.getBoundingClientRect();
										const scaleX = imgRect.width / imgSize.w;
										const scaleY = imgRect.height / imgSize.h;

										return (
											<div
												className="absolute border-2 border-blue-400 bg-blue-400/20 pointer-events-none"
												style={{
													left: `${cropArea.x * scaleX}px`,
													top: `${cropArea.y * scaleY}px`,
													width: `${cropArea.width * scaleX}px`,
													height: `${cropArea.height * scaleY}px`,
												}}>
												{/* Corner handles */}
												<div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-400 rounded-full border-2 border-white pointer-events-auto cursor-nwse-resize"></div>
												<div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full border-2 border-white pointer-events-auto cursor-nesw-resize"></div>
												<div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-400 rounded-full border-2 border-white pointer-events-auto cursor-nesw-resize"></div>
												<div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-400 rounded-full border-2 border-white pointer-events-auto cursor-nwse-resize"></div>
											</div>
										);
									})()}
								</>
							)}
						</div>
					</div>

					{/* Action buttons */}
					<div className="flex flex-wrap gap-3 justify-center">
						<button
							onClick={resetCrop}
							className="group relative overflow-hidden bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl border border-gray-300 hover:border-gray-400 transition-all duration-200 font-semibold">
							<span className="relative z-10 flex items-center gap-2">
								<svg
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
								Reset Crop
							</span>
						</button>

						<button
							onClick={handleDownloadClick}
							className="group relative overflow-hidden">
							{/* Animated glow */}
							<div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl opacity-100 group-hover:opacity-0 transition-opacity duration-300"></div>
							<div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
							<div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl blur-lg opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>

							{/* Button content */}
							<div className="relative flex items-center justify-center gap-2 px-8 py-3 text-white font-bold text-lg rounded-xl transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.98]">
								<svg
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
									/>
								</svg>
								<span>Download PNG</span>
							</div>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
