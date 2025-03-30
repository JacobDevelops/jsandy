import { useComposedRefs } from "@jsandy/ui/compose-refs";
import { type Scope, createContextScope } from "@jsandy/ui/context";
import { Slot } from "@jsandy/ui/slot";
import React from "react";

type SlotProps = React.ComponentPropsWithoutRef<typeof Slot>;
type CollectionElement = HTMLElement;
interface CollectionProps extends SlotProps {
	scope: any;
}

// We have resorted to returning slots directly rather than exposing primitives that can then
// be slotted like `<CollectionItem as={Slot}>…</CollectionItem>`.
// This is because we encountered issues with generic types that cannot be statically analysed
// due to creating them dynamically via createCollection.

// biome-ignore lint/complexity/noBannedTypes: This is a valid use case
function createCollection<ItemElement extends HTMLElement, ItemData = {}>(
	name: string,
) {
	/* -----------------------------------------------------------------------------------------------
	 * CollectionProvider
	 * ---------------------------------------------------------------------------------------------*/

	const PROVIDER_NAME = `${name}CollectionProvider`;
	const [createCollectionContext, createCollectionScope] =
		createContextScope(PROVIDER_NAME);

	type ContextValue = {
		collectionRef: React.RefObject<CollectionElement | null>;
		itemMap: Map<
			React.RefObject<ItemElement | null>,
			{ ref: React.RefObject<ItemElement | null> } & ItemData
		>;
	};

	const [CollectionProviderImpl, useCollectionContext] =
		createCollectionContext<ContextValue>(PROVIDER_NAME, {
			collectionRef: { current: null },
			itemMap: new Map(),
		});

	const CollectionProvider: React.FC<{
		children?: React.ReactNode;
		scope: Scope<ContextValue>;
	}> = (props) => {
		const { scope, children } = props;
		const ref = React.useRef<CollectionElement>(null);
		const itemMap = React.useRef<ContextValue["itemMap"]>(new Map()).current;
		return (
			<CollectionProviderImpl
				scope={scope}
				itemMap={itemMap}
				collectionRef={ref}
			>
				{children}
			</CollectionProviderImpl>
		);
	};

	CollectionProvider.displayName = PROVIDER_NAME;

	/* -----------------------------------------------------------------------------------------------
	 * CollectionSlot
	 * ---------------------------------------------------------------------------------------------*/

	const COLLECTION_SLOT_NAME = `${name}CollectionSlot`;

	const CollectionSlot = React.forwardRef<CollectionElement, CollectionProps>(
		(props, forwardedRef) => {
			const { scope, children } = props;
			const context = useCollectionContext(COLLECTION_SLOT_NAME, scope);
			const composedRefs = useComposedRefs(forwardedRef, context.collectionRef);
			return <Slot ref={composedRefs}>{children}</Slot>;
		},
	);

	CollectionSlot.displayName = COLLECTION_SLOT_NAME;

	/* -----------------------------------------------------------------------------------------------
	 * CollectionItem
	 * ---------------------------------------------------------------------------------------------*/

	const ITEM_SLOT_NAME = `${name}CollectionItemSlot`;
	const ITEM_DATA_ATTR = "data-jsandy-collection-item";

	type CollectionItemSlotProps = ItemData & {
		children: React.ReactNode;
		scope: Scope<ContextValue | undefined>;
	};

	const CollectionItemSlot = React.forwardRef<
		ItemElement,
		CollectionItemSlotProps
	>((props, forwardedRef) => {
		const { scope, children, ...itemData } = props;
		const ref = React.useRef<ItemElement>(null);
		const composedRefs = useComposedRefs(forwardedRef, ref);
		const context = useCollectionContext(ITEM_SLOT_NAME, scope);

		React.useEffect(() => {
			context.itemMap.set(ref, { ref, ...(itemData as unknown as ItemData) });
			return () => void context.itemMap.delete(ref);
		});

		return (
			<Slot {...{ [ITEM_DATA_ATTR]: "" }} ref={composedRefs}>
				{children}
			</Slot>
		);
	});

	CollectionItemSlot.displayName = ITEM_SLOT_NAME;

	/* -----------------------------------------------------------------------------------------------
	 * useCollection
	 * ---------------------------------------------------------------------------------------------*/

	function useCollection(scope: any) {
		const context = useCollectionContext(`${name}CollectionConsumer`, scope);

		const getItems = React.useCallback(() => {
			const collectionNode = context.collectionRef.current;
			if (!collectionNode) return [];
			const orderedNodes = Array.from(
				collectionNode.querySelectorAll(`[${ITEM_DATA_ATTR}]`),
			);
			const items = Array.from(context.itemMap.values());
			const orderedItems = items.sort((a, b) => {
				if (!a.ref.current || !b.ref.current) return 0;
				const aIndex = orderedNodes.indexOf(a.ref.current);
				const bIndex = orderedNodes.indexOf(b.ref.current);
				return aIndex - bIndex;
			});
			return orderedItems;
		}, [context.collectionRef, context.itemMap]);

		return getItems;
	}

	return [
		{
			Provider: CollectionProvider,
			Slot: CollectionSlot,
			ItemSlot: CollectionItemSlot,
		},
		useCollection,
		createCollectionScope,
	] as const;
}

export { createCollection };
export type { CollectionProps };
