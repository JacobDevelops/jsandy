"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { client } from "@/lib/client";

export const RecentPost = () => {
	const [name, setName] = useState<string>("");
	const queryClient = useQueryClient();

	const { data: recentPost, isPending: isLoadingPosts } = useQuery({
		queryFn: async () => {
			const res = await client.post.recent.$get();
			return await res.json();
		},
		queryKey: ["get-recent-post"],
	});

	const { mutate: createPost, isPending } = useMutation({
		mutationFn: async ({ name }: { name: string }) => {
			if (!name.trim()) {
				throw new Error("Post name cannot be empty");
			}
			const res = await client.post.create.$post({ name: name.trim() });
			return await res.json();
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
				aria-label="Create new post"
				className="flex flex-col gap-4"
				onSubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<input
					aria-describedby="post-title-error"
					aria-label="Post title"
					className="w-full text-base/6 rounded-md bg-black/50 hover:bg-black/75 focus-visible:outline-none ring-2 ring-transparent  hover:ring-zinc-800 focus:ring-zinc-800 focus:bg-black/75 transition h-12 px-4 py-2 text-zinc-100"
					maxLength={100}
					onChange={(e) => setName(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							handleSubmit();
						}
					}}
					placeholder="Enter a title..."
					required
					type="text"
					value={name}
				/>
				<button
					className="rounded-md text-base/6 ring-2 ring-offset-2 ring-offset-black focus-visible:outline-none focus-visible:ring-zinc-100 ring-transparent hover:ring-zinc-100 h-12 px-10 py-3 bg-brand-700 text-zinc-800 font-medium bg-gradient-to-tl from-zinc-300 to-zinc-200 transition hover:bg-brand-800"
					disabled={isPending}
					type="submit"
				>
					{isPending ? "Creating..." : "Create Post"}
				</button>
			</form>
		</div>
	);
};
