import { cn } from "@jsandy/ui/cn";
import { type Scope, createContextScope } from "@jsandy/ui/context";
import { Primitive } from "@jsandy/ui/primitive";
import { useCallbackRef } from "@jsandy/ui/use-callback-ref";
import { useLayoutEffect } from "@jsandy/ui/use-layout-effect";
import * as React from "react";

/* -------------------------------------------------------------------------------------------------
 * Avatar
 * -----------------------------------------------------------------------------------------------*/

const AVATAR_NAME = "Avatar";

type ScopedProps<P> = P & { __scopeAvatar?: Scope };
const [createAvatarContext, createAvatarScope] =
	createContextScope(AVATAR_NAME);

type ImageLoadingStatus = "idle" | "loading" | "loaded" | "error";

type AvatarContextValue = {
	/** The current loading status of the avatar image. */
	imageLoadingStatus: ImageLoadingStatus;

	/** Callback function that is triggered when the image loading status changes. */
	onImageLoadingStatusChange(status: ImageLoadingStatus): void;
};

const [AvatarProvider, useAvatarContext] =
	createAvatarContext<AvatarContextValue>(AVATAR_NAME);

type AvatarElement = React.ComponentRef<typeof Primitive.span>;
type PrimitiveSpanProps = React.ComponentPropsWithoutRef<typeof Primitive.span>;
type AvatarProps = PrimitiveSpanProps;

/**
 * Avatar component for displaying a user's profile picture or initials
 *
 * The Avatar component provides a consistent way to represent users with images or fallback content when images are unavailable.
 * It handles loading states and provides automatic fallback content when an image fails to load.
 *
 * Key features:
 * - Intelligent image loading state management
 * - Automatic fallback display when images fail to load
 * - Customizable appearance through className props
 * - Accessible design with appropriate ARIA attributes
 *
 * Usage considerations:
 * - Use for representing users in interfaces like comments, user lists, or navigation
 * - Provide meaningful fallback content (like user initials) when possible
 * - Consider the appropriate size for different contexts (headers, inline mentions, etc.)
 * - Use consistently throughout your application for visual coherence
 */
const AvatarPrimitive = React.forwardRef<AvatarElement, AvatarProps>(
	(props: ScopedProps<AvatarProps>, forwardedRef) => {
		const { __scopeAvatar, ...avatarProps } = props;
		const [imageLoadingStatus, setImageLoadingStatus] =
			React.useState<ImageLoadingStatus>("idle");
		return (
			<AvatarProvider
				scope={__scopeAvatar}
				imageLoadingStatus={imageLoadingStatus}
				onImageLoadingStatusChange={setImageLoadingStatus}
			>
				<Primitive.span {...avatarProps} ref={forwardedRef} />
			</AvatarProvider>
		);
	},
);

AvatarPrimitive.displayName = AVATAR_NAME;

/* -------------------------------------------------------------------------------------------------
 * AvatarImage
 * -----------------------------------------------------------------------------------------------*/

const IMAGE_NAME = "AvatarImage";

type AvatarImageElement = React.ComponentRef<typeof Primitive.img>;
type PrimitiveImageProps = React.ComponentPropsWithoutRef<typeof Primitive.img>;
interface AvatarImageProps extends PrimitiveImageProps {
	/** Callback function that is triggered when the loading status of the image changes. */
	onLoadingStatusChange?: (status: ImageLoadingStatus) => void;
}

/**
 * AvatarImage component for displaying the user's profile picture
 *
 * This component handles the loading and displaying of the avatar image. It manages various loading states
 * and communicates with the parent Avatar component to coordinate the display of fallback content when needed.
 *
 * The component will not render anything if the image fails to load, allowing the AvatarFallback component to be displayed instead.
 */
const AvatarImagePrimitive = React.forwardRef<
	AvatarImageElement,
	AvatarImageProps
>((props: ScopedProps<AvatarImageProps>, forwardedRef) => {
	const {
		__scopeAvatar,
		src,
		onLoadingStatusChange = () => {},
		...imageProps
	} = props;
	const context = useAvatarContext(IMAGE_NAME, __scopeAvatar);
	const imageLoadingStatus = useImageLoadingStatus(src, imageProps);
	const handleLoadingStatusChange = useCallbackRef(
		(status: ImageLoadingStatus) => {
			onLoadingStatusChange(status);
			context.onImageLoadingStatusChange(status);
		},
	);

	useLayoutEffect(() => {
		if (imageLoadingStatus !== "idle") {
			handleLoadingStatusChange(imageLoadingStatus);
		}
	}, [imageLoadingStatus, handleLoadingStatusChange]);

	return imageLoadingStatus === "loaded" ? (
		<Primitive.img {...imageProps} ref={forwardedRef} src={src} />
	) : null;
});

AvatarImagePrimitive.displayName = IMAGE_NAME;

/* -------------------------------------------------------------------------------------------------
 * AvatarFallback
 * -----------------------------------------------------------------------------------------------*/

const FALLBACK_NAME = "AvatarFallback";

type AvatarFallbackElement = React.ComponentRef<typeof Primitive.span>;
interface AvatarFallbackProps extends PrimitiveSpanProps {
	/**
	 * The delay in milliseconds before showing the fallback element.
	 * This helps prevent a flash of the fallback when the image might load quickly.
	 */
	delayMs?: number;
}

/**
 * AvatarFallback component for displaying alternative content when the image is unavailable
 *
 * This component renders fallback content (such as user initials or a generic icon) when the avatar image
 * fails to load or while it's still loading. It can be configured with a delay to prevent flickering
 * when images load quickly.
 *
 * The fallback will not be rendered if the image successfully loads, ensuring a consistent visual appearance.
 */
const AvatarFallbackPrimitive = React.forwardRef<
	AvatarFallbackElement,
	AvatarFallbackProps
>((props: ScopedProps<AvatarFallbackProps>, forwardedRef) => {
	const { __scopeAvatar, delayMs, ...fallbackProps } = props;
	const context = useAvatarContext(FALLBACK_NAME, __scopeAvatar);
	const [canRender, setCanRender] = React.useState(delayMs === undefined);

	React.useEffect(() => {
		if (delayMs !== undefined) {
			const timerId = window.setTimeout(() => setCanRender(true), delayMs);
			return () => window.clearTimeout(timerId);
		}
	}, [delayMs]);

	return canRender && context.imageLoadingStatus !== "loaded" ? (
		<Primitive.span {...fallbackProps} ref={forwardedRef} />
	) : null;
});

AvatarFallbackPrimitive.displayName = FALLBACK_NAME;

/* -----------------------------------------------------------------------------------------------*/

/**
 * Custom hook to track the loading status of an image
 *
 * This hook creates and manages an Image instance to monitor the loading process of an image URL.
 * It handles the various loading states (idle, loading, loaded, error) and manages the lifecycle
 * of the image loading process.
 */
function useImageLoadingStatus(
	src: string | undefined,
	{ referrerPolicy, crossOrigin }: AvatarImageProps,
) {
	const [loadingStatus, setLoadingStatus] =
		React.useState<ImageLoadingStatus>("idle");

	useLayoutEffect(() => {
		if (!src) {
			setLoadingStatus("error");
			return;
		}

		let isMounted = true;
		const image = new window.Image();

		const updateStatus = (status: ImageLoadingStatus) => () => {
			if (!isMounted) return;
			setLoadingStatus(status);
		};

		setLoadingStatus("loading");
		image.onload = updateStatus("loaded");
		image.onerror = updateStatus("error");
		if (referrerPolicy) {
			image.referrerPolicy = referrerPolicy;
		}
		if (typeof crossOrigin === "string") {
			image.crossOrigin = crossOrigin;
		}
		image.src = src;
		return () => {
			isMounted = false;
		};
	}, [src, referrerPolicy, crossOrigin]);

	return loadingStatus;
}

/**
 * Avatar component for displaying a user's profile picture or initials
 *
 * The Avatar component provides a consistent way to represent users with images or fallback content when images are unavailable.
 * It's commonly used in user interfaces for comments, user lists, profile pages, and navigation menus.
 *
 * Key features:
 * - Automatic handling of image loading states
 * - Customizable fallback display for when images are unavailable
 * - Consistent circular shape with flexible sizing options
 * - Accessible design with appropriate ARIA attributes
 *
 * Usage considerations:
 * - Use for representing users in interfaces
 * - Pair with AvatarImage for the picture and AvatarFallback for alternative display
 * - Adjust size using the className prop with utility classes
 * - Use consistently throughout your application for visual coherence
 */
const Avatar = React.forwardRef<
	React.ComponentRef<typeof AvatarPrimitive>,
	React.ComponentPropsWithoutRef<typeof AvatarPrimitive>
>(({ className, ...props }, ref) => (
	<AvatarPrimitive
		ref={ref}
		className={cn(
			"relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
			className,
		)}
		{...props}
	/>
));
Avatar.displayName = AvatarPrimitive.displayName;

/**
 * AvatarImage component for displaying the user's profile picture
 *
 * This component renders the image within an Avatar component. It handles loading states intelligently
 * and coordinates with the AvatarFallback component to provide a seamless user experience.
 *
 * When the image fails to load, this component renders nothing, allowing the fallback to be shown instead.
 */
const AvatarImage = React.forwardRef<
	React.ComponentRef<typeof AvatarImagePrimitive>,
	React.ComponentPropsWithoutRef<typeof AvatarImagePrimitive>
>(({ className, ...props }, ref) => (
	<AvatarImagePrimitive
		ref={ref}
		className={cn("aspect-square h-full w-full", className)}
		{...props}
	/>
));
AvatarImage.displayName = AvatarImagePrimitive.displayName;

/**
 * AvatarFallback component for displaying alternative content when the image is unavailable
 *
 * This component provides a visual fallback when an avatar image is loading or has failed to load.
 * It's typically used to display user initials, a generic user icon, or a placeholder graphic.
 *
 * The fallback can be configured with a delay to prevent flickering when images load quickly.
 * It automatically coordinates with the AvatarImage component to determine when it should be displayed.
 */
const AvatarFallback = React.forwardRef<
	React.ComponentRef<typeof AvatarFallbackPrimitive>,
	React.ComponentPropsWithoutRef<typeof AvatarFallbackPrimitive>
>(({ className, ...props }, ref) => (
	<AvatarFallbackPrimitive
		ref={ref}
		className={cn(
			"flex h-full w-full items-center justify-center rounded-full bg-primary/30",
			className,
		)}
		{...props}
	/>
));
AvatarFallback.displayName = AvatarFallbackPrimitive.displayName;

export {
	createAvatarScope,
	//
	Avatar,
	AvatarFallback,
	AvatarImage,
};
export type { AvatarFallbackProps, AvatarImageProps, AvatarProps };
