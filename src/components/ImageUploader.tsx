import React, { useCallback } from 'react';

interface ImageUploaderProps {
	onImageLoad: (image: HTMLImageElement, file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageLoad }) => {
	const handleFileChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (e) => {
				const img = new Image();
				img.onload = () => onImageLoad(img, file);
				img.src = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		},
		[onImageLoad],
	);

	const handleDrop = useCallback(
		(event: React.DragEvent) => {
			event.preventDefault();
			const file = event.dataTransfer.files[0];
			if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
				const reader = new FileReader();
				reader.onload = (e) => {
					const img = new Image();
					img.onload = () => onImageLoad(img, file);
					img.src = e.target?.result as string;
				};
				reader.readAsDataURL(file);
			}
		},
		[onImageLoad],
	);

	const handleDragOver = (event: React.DragEvent) => {
		event.preventDefault();
	};

	return (
		<div
			onDrop={handleDrop}
			onDragOver={handleDragOver}
			className="relative border-2 border-dashed border-gray-300 rounded-2xl p-12 md:p-16 text-center hover:border-blue-500 bg-gray-700 backdrop-blur-sm hover:bg-blue-50 transition-all duration-300 cursor-pointer group overflow-hidden shadow-lg">
			{/* Glow effect on hover */}
			<div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
				<div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 blur-xl"></div>
			</div>

			<input
				type="file"
				accept="image/png,image/jpeg"
				onChange={handleFileChange}
				className="hidden"
				id="file-upload"
			/>
			<label
				htmlFor="file-upload"
				className="cursor-pointer block relative z-10">
				<div className="space-y-4">
					<div className="relative inline-flex items-center justify-center">
						<div className="absolute w-24 h-24 bg-gray-500 blur-2xl rounded-full group-hover:bg-blue-500/30 transition-all duration-300"></div>
						<svg
							className="relative h-20 w-20 text-blue-200 group-hover:text-blue-600 transition-all duration-300 group-hover:scale-110"
							stroke="currentColor"
							fill="none"
							viewBox="0 0 48 48">
							<path
								d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
								strokeWidth={2}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</div>
					<div className="space-y-2">
						<div className="text-gray-800 text-lg">
							<span className="font-bold text-white group-hover:text-blue-700 transition-colors">Click to upload</span>{' '}
							<span className="text-gray-100 group-hover:text-blue-700 transition-colors">or drag and drop</span>
						</div>
						<p className="text-sm text-gray-50 group-hover:text-blue-700 transition-colors">
							PNG or JPG files (max 10MB)
						</p>
					</div>
				</div>
			</label>
		</div>
	);
};
