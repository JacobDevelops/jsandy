import * as React from "react";

/**
 * Creates a context with a custom provider and a hook to use the context.
 */
function createContext<ContextValueType extends object | null>(
	rootComponentName: string,
	defaultContext?: ContextValueType,
) {
	const Context = React.createContext<ContextValueType | undefined>(
		defaultContext,
	);

	const Provider: React.FC<ContextValueType & { children: React.ReactNode }> = (
		props,
	) => {
		const { children, ...context } = props;
		// Only re-memoize when prop values change

		const value = React.useMemo(
			() => context,
			Object.values(context),
		) as ContextValueType;
		return <Context.Provider value={value}>{children}</Context.Provider>;
	};

	Provider.displayName = `${rootComponentName}Provider`;

	function useContext(consumerName: string) {
		const context = React.useContext(Context);
		if (context) return context;
		if (defaultContext !== undefined) return defaultContext;
		// if a defaultContext wasn't specified, it's a required context.
		throw new Error(
			`\`${consumerName}\` must be used within \`${rootComponentName}\``,
		);
	}

	return [Provider, useContext] as const;
}

/* -------------------------------------------------------------------------------------------------
 * createContextScope
 * -----------------------------------------------------------------------------------------------*/

type Scope<C = any> =
	| { [scopeName: string]: Array<React.Context<C>> }
	| undefined;
type ScopeHook = (_scope: Scope) => { [__scopeProp: string]: Scope };
interface CreateScope {
	scopeName: string;
	(): ScopeHook;
}

/**
 * Creates a scoped context that can be composed with other scoped contexts.
 */
function createContextScope(
	scopeName: string,
	createContextScopeDeps: CreateScope[] = [],
) {
	let defaultContexts: unknown[] = [];

	/* -----------------------------------------------------------------------------------------------
	 * createContext
	 * ---------------------------------------------------------------------------------------------*/

	function createContext<ContextValueType extends object | null>(
		rootComponentName: string,
		defaultContext?: ContextValueType,
	) {
		const BaseContext = React.createContext<ContextValueType | undefined>(
			defaultContext,
		);
		const index = defaultContexts.length;
		defaultContexts = [...defaultContexts, defaultContext];

		const Provider: React.FC<
			ContextValueType & {
				scope: Scope<ContextValueType>;
				children: React.ReactNode;
			}
		> = (props) => {
			const { scope, children, ...context } = props;
			const Context = scope?.[scopeName]?.[index] || BaseContext;
			// Only re-memoize when prop values change
			const value = React.useMemo(
				() => context,
				Object.values(context),
			) as ContextValueType;
			return <Context.Provider value={value}>{children}</Context.Provider>;
		};

		Provider.displayName = `${rootComponentName}Provider`;

		function useContext(
			consumerName: string,
			scope: Scope<ContextValueType | undefined>,
		) {
			const Context = scope?.[scopeName]?.[index] || BaseContext;
			const context = React.useContext(Context);
			if (context) return context;
			if (defaultContext !== undefined) return defaultContext;
			// if a defaultContext wasn't specified, it's a required context.
			throw new Error(
				`\`${consumerName}\` must be used within \`${rootComponentName}\``,
			);
		}

		return [Provider, useContext] as const;
	}

	/* -----------------------------------------------------------------------------------------------
	 * createScope
	 * ---------------------------------------------------------------------------------------------*/

	const createScope: CreateScope = () => {
		const scopeContexts = defaultContexts.map((defaultContext) => {
			return React.createContext(defaultContext);
		});
		return function useScope(scope: Scope) {
			const contexts = scope?.[scopeName] || scopeContexts;
			return React.useMemo(
				() => ({
					[`__scope${scopeName}`]: { ...scope, [scopeName]: contexts },
				}),
				[scope, contexts],
			);
		};
	};

	createScope.scopeName = scopeName;
	return [
		createContext,
		composeContextScopes(createScope, ...createContextScopeDeps),
	] as const;
}

/* -------------------------------------------------------------------------------------------------
 * composeContextScopes
 * -----------------------------------------------------------------------------------------------*/

/**
 * Composes multiple context scopes into a single scope.
 */
function composeContextScopes(...scopes: CreateScope[]) {
	const baseScope = scopes[0];
	if (scopes.length === 1) return baseScope;

	const createScope: CreateScope = () => {
		const scopeHooks = scopes.map((createScope) => ({
			useScope: createScope(),
			scopeName: createScope.scopeName,
		}));

		return function useComposedScopes(overrideScopes) {
			const nextScopes = scopeHooks.reduce(
				(nextScopes, { useScope, scopeName }) => {
					// We are calling a hook inside a callback which React warns against to avoid inconsistent
					// renders, however, scoping doesn't have render side effects so we ignore the rule.

					const scopeProps = useScope(overrideScopes);
					const currentScope = scopeProps[`__scope${scopeName}`];
					// biome-ignore lint/performance/noAccumulatingSpread: This is a valid use case
					return { ...nextScopes, ...currentScope };
				},
				{},
			);

			return React.useMemo(
				() => ({ [`__scope${baseScope.scopeName}`]: nextScopes }),
				[nextScopes],
			);
		};
	};

	createScope.scopeName = baseScope.scopeName;
	return createScope;
}

/* -----------------------------------------------------------------------------------------------*/

export { createContext, createContextScope };
export type { CreateScope, Scope };
