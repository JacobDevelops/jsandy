import type { ClientSocket, SystemEvents } from "@jsandy/rpc";
import { useEffect, useRef } from "react";

export function useWebSocket<
	IncomingEvents extends Partial<SystemEvents> & Record<string, unknown>,
>(
	socket: ClientSocket<IncomingEvents & SystemEvents, any>,
	events: Partial<{
		[K in keyof (IncomingEvents & SystemEvents)]: (
			data: (IncomingEvents & SystemEvents)[K],
		) => void;
	}>,
	opts: { enabled?: boolean } = { enabled: true },
) {
	const eventsRef = useRef(events);
	eventsRef.current = events;

	useEffect(() => {
		if (opts?.enabled === false) {
			return;
		}

		const defaultHandlers = {
			onConnect: () => {},
			onError: () => {},
		};

		const mergedEvents = {
			...defaultHandlers,
			...eventsRef.current,
		};

		const eventNames = Object.keys(mergedEvents) as Array<
			string & keyof (IncomingEvents & SystemEvents)
		>;

		for (const eventName of eventNames) {
			const handler = mergedEvents[eventName];
			if (handler) {
				socket.on(eventName, handler as (data: unknown) => void);
			}
		}

		return () => {
			for (const eventName of eventNames) {
				const handler = mergedEvents[eventName];
				socket.off(eventName, handler as (data: unknown) => void);
			}
		};
	}, [socket, opts?.enabled]);
}
