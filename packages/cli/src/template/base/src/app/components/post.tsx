"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { client } from "@/lib/client";

export const RecentPost = () => {
	const [name, setName] = useState<string>("");
	const queryClient = useQueryClient();

	const { data: recentPost, isPending: isLoadingPosts } = useQuery({
		queryKey: ["get-recent-post"],
		queryFn: async () => {
			const res = await client.post.recent.$get();
			return await res.json();
		},
	});

	const { mutate: createPost, isPending } = useMutation({
		mutationFn: async ({ name }: { name: string }) => {
			if (!name.trim()) {
				throw new Error("Post name cannot be empty");
			}
			try {
				const res = await client.post.create.$post({ name: name.trim() });
				if (!res.ok) {
					throw new Error(`HTTP error! status: ${res.status}`);
				}
				return await res.json();
			} catch (error) {
				throw new Error(
					`Failed to create post: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["get-recent-post"] });
			setName("");
		},
	});

	const handleSubmit = () => {
		if (name.trim() && !isPending) {
			createPost({ name: name.trim() });
		}
	};

	return (
		<div className="w-full max-w-sm backdrop-blur-lg bg-black/15 px-8 py-6 rounded-md text-zinc-100/75 space-y-2">
			{isLoadingPosts ? (
				<p className="text-[#ececf399] text-base/6">Loading posts...</p>
			) : recentPost ? (
				<p className="text-[#ececf399] text-base/6">
					Your recent post: "{recentPost.name}"
				</p>
			) : (
				<p className="text-[#ececf399] text-base/6">You have no posts yet.</p>
			)}
			<form
				onSubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				className="flex flex-col gap-4"
				aria-label="Create new post"
			>
				<input
					type="text"
					placeholder="Enter a title..."
					value={name}
					onChange={(e) => setName(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							handleSubmit();
						}
					}}
					required
					maxLength={100}
					aria-label="Post title"
					aria-describedby="post-title-error"
					className="w-full text-base/6 rounded-md bg-black/50 hover:bg-black/75 focus-visible:outline-none ring-2 ring-transparent  hover:ring-zinc-800 focus:ring-zinc-800 focus:bg-black/75 transition h-12 px-4 py-2 text-zinc-100"
				/>
				<button
					disabled={isPending}
					type="submit"
					className="rounded-md text-base/6 ring-2 ring-offset-2 ring-offset-black focus-visible:outline-none focus-visible:ring-zinc-100 ring-transparent hover:ring-zinc-100 h-12 px-10 py-3 bg-brand-700 text-zinc-800 font-medium bg-gradient-to-tl from-zinc-300 to-zinc-200 transition hover:bg-brand-800"
				>
					{isPending ? "Creating..." : "Create Post"}
				</button>
			</form>
		</div>
	);
};
