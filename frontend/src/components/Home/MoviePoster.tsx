import { Film, Star } from "lucide-react";
import { useState } from "react";

interface MoviePosterProps {
	id: number;
	title?: string;
	name?: string;
	posterPath?: string;
	voteAverage?: number;
	releaseDate?: string;
	overview?: string;
	onClick?: () => void;
}

export function MoviePoster({
	title,
	name,
	posterPath,
	voteAverage,
	onClick,
}: MoviePosterProps) {
	const displayTitle = title || name;
	const [imageError, setImageError] = useState(false);

	const content = (
		<>
			<div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-lg bg-muted shadow-lg">
				{posterPath && !imageError ? (
					<img
						src={`https://image.tmdb.org/t/p/w500${posterPath}`}
						alt={displayTitle}
						className="h-full w-full object-cover"
						loading="lazy"
						onError={() => setImageError(true)}
					/>
				) : (
					<div className="flex h-full items-center justify-center">
						<Film className="h-16 w-16 text-muted-foreground" />
					</div>
				)}
				{voteAverage && voteAverage > 0 && (
					<div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 backdrop-blur-sm">
						<Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
						<span className="text-sm font-semibold text-white">
							{voteAverage.toFixed(1)}
						</span>
					</div>
				)}
			</div>
			<h3 className="line-clamp-2 text-base font-semibold text-white">
				{displayTitle}
			</h3>
		</>
	);

	if (onClick) {
		return (
			<button
				type="button"
				onClick={onClick}
				className="group w-full cursor-pointer text-left"
			>
				{content}
			</button>
		);
	}

	return <div className="group">{content}</div>;
}
