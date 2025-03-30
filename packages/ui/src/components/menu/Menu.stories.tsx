import { DirectionProvider } from "@jsandy/ui/use-direction";
import * as React from "react";
import {
	Menu,
	MenuAnchor,
	MenuCheckboxItem,
	MenuContent,
	MenuGroup,
	MenuItem,
	MenuItemIndicator,
	MenuLabel,
	MenuPortal,
	MenuRadioGroup,
	MenuRadioItem,
	MenuSeparator,
	MenuSub,
	MenuSubContent,
	MenuSubTrigger,
} from "./Menu";

const foodGroups: Array<{
	label?: string;
	foods: Array<{ value: string; label: string; disabled?: boolean }>;
}> = [
	{
		label: "Fruits",
		foods: [
			{ value: "apple", label: "Apple" },
			{ value: "banana", label: "Banana" },
			{ value: "blueberry", label: "Blueberry" },
			{ value: "grapes", label: "Grapes" },
			{ value: "pineapple", label: "Pineapple" },
		],
	},
	{
		label: "Vegetables",
		foods: [
			{ value: "aubergine", label: "Aubergine" },
			{ value: "broccoli", label: "Broccoli" },
			{ value: "carrot", label: "Carrot", disabled: true },
			{ value: "courgette", label: "Courgette" },
			{ value: "leek", label: "Leek" },
		],
	},
	{
		label: "Meat",
		foods: [
			{ value: "beef", label: "Beef" },
			{ value: "beef-with-sauce", label: "Beef with sauce" },
			{ value: "chicken", label: "Chicken" },
			{ value: "lamb", label: "Lamb" },
			{ value: "pork", label: "Pork" },
		],
	},
	{
		foods: [
			{ value: "candies", label: "Candies" },
			{ value: "chocolates", label: "Chocolates" },
		],
	},
];

export default {
	title: "Components/Menu",
	tags: ["autodocs"],
	excludeStories: ["TickIcon", "classes"],
};

export const Styled = () => (
	<MenuWithAnchor>
		<MenuItem onSelect={() => window.alert("undo")}>Undo</MenuItem>
		<MenuItem onSelect={() => window.alert("redo")}>Redo</MenuItem>
		<MenuSeparator />
		<MenuItem disabled onSelect={() => window.alert("cut")}>
			Cut
		</MenuItem>
		<MenuItem onSelect={() => window.alert("copy")}>Copy</MenuItem>
		<MenuItem onSelect={() => window.alert("paste")}>Paste</MenuItem>
	</MenuWithAnchor>
);

export const Submenus = () => {
	const [open1, setOpen1] = React.useState(false);
	const [open2, setOpen2] = React.useState(false);
	const [open3, setOpen3] = React.useState(false);
	const [open4, setOpen4] = React.useState(false);
	const [rtl, setRtl] = React.useState(false);
	const [animated, setAnimated] = React.useState(false);

	React.useEffect(() => {
		if (rtl) {
			document.documentElement.setAttribute("dir", "rtl");
			return () => document.documentElement.removeAttribute("dir");
		}
	}, [rtl]);

	return (
		<DirectionProvider dir={rtl ? "rtl" : "ltr"}>
			<div
				style={{
					marginBottom: 8,
					display: "grid",
					gridAutoFlow: "row",
					gap: 4,
				}}
			>
				<label>
					<input
						type="checkbox"
						checked={rtl}
						onChange={(event) => setRtl(event.currentTarget.checked)}
					/>
					Right-to-left
				</label>
				<label>
					<input
						type="checkbox"
						checked={animated}
						onChange={(event) => setAnimated(event.currentTarget.checked)}
					/>
					Animated
				</label>
			</div>
			<MenuWithAnchor>
				<MenuItem onSelect={() => window.alert("undo")}>Undo</MenuItem>
				<Submenu open={open1} onOpenChange={setOpen1} animated={animated}>
					<MenuItem disabled>Disabled</MenuItem>
					<MenuItem onSelect={() => window.alert("one")}>One</MenuItem>
					<Submenu open={open2} onOpenChange={setOpen2} animated={animated}>
						<MenuItem onSelect={() => window.alert("one")}>One</MenuItem>
						<MenuItem onSelect={() => window.alert("two")}>Two</MenuItem>
						<MenuItem onSelect={() => window.alert("three")}>Three</MenuItem>
						<MenuItem onSelect={() => window.alert("four")}>Four</MenuItem>
						<MenuItem onSelect={() => window.alert("five")}>Five</MenuItem>
						<MenuItem onSelect={() => window.alert("six")}>Six</MenuItem>
					</Submenu>
					<Submenu
						heading="Sub Menu"
						open={open3}
						onOpenChange={setOpen3}
						animated={animated}
					>
						<MenuItem onSelect={() => window.alert("one")}>One</MenuItem>
						<MenuItem onSelect={() => window.alert("two")}>Two</MenuItem>
						<MenuItem onSelect={() => window.alert("three")}>Three</MenuItem>
					</Submenu>
					<MenuItem onSelect={() => window.alert("two")}>Two</MenuItem>
					<Submenu
						open={open4}
						onOpenChange={setOpen4}
						animated={animated}
						disabled
					>
						<MenuItem onSelect={() => window.alert("one")}>One</MenuItem>
						<MenuItem onSelect={() => window.alert("two")}>Two</MenuItem>
						<MenuItem onSelect={() => window.alert("three")}>Three</MenuItem>
					</Submenu>
					<MenuItem onSelect={() => window.alert("three")}>Three</MenuItem>
				</Submenu>

				<MenuSeparator />
				<MenuItem disabled onSelect={() => window.alert("cut")}>
					Cut
				</MenuItem>
				<MenuItem onSelect={() => window.alert("copy")}>Copy</MenuItem>
				<MenuItem onSelect={() => window.alert("paste")}>Paste</MenuItem>
			</MenuWithAnchor>
		</DirectionProvider>
	);
};

export const WithLabels = () => (
	<MenuWithAnchor>
		{foodGroups.map((foodGroup) => (
			<MenuGroup key={foodGroup.label}>
				{foodGroup.label && (
					<MenuLabel key={foodGroup.label}>{foodGroup.label}</MenuLabel>
				)}
				{foodGroup.foods.map((food) => (
					<MenuItem
						key={food.value}
						disabled={food.disabled}
						onSelect={() => window.alert(food.label)}
					>
						{food.label}
					</MenuItem>
				))}
			</MenuGroup>
		))}
	</MenuWithAnchor>
);

const suits = [
	{ emoji: "♥️", label: "Hearts" },
	{ emoji: "♠️", label: "Spades" },
	{ emoji: "♦️", label: "Diamonds" },
	{ emoji: "♣️", label: "Clubs" },
];

export const Typeahead = () => (
	<>
		<h1>Testing ground for typeahead behaviour</h1>

		<div style={{ display: "flex", alignItems: "flex-start", gap: 100 }}>
			<div>
				<h2>Text labels</h2>
				<div style={{ marginBottom: 20 }}>
					<p>
						For comparison
						<br />
						try the closed select below
					</p>
					<select>
						{foodGroups.map((foodGroup) => (
							<React.Fragment key={foodGroup.label}>
								{foodGroup.foods.map((food) => (
									<option
										key={food.value}
										value={food.value}
										disabled={food.disabled}
									>
										{food.label}
									</option>
								))}
							</React.Fragment>
						))}
					</select>
				</div>
				<WithLabels />
			</div>

			<div>
				<h2>Complex children</h2>
				<p>(relying on `.textContent` — default)</p>
				<MenuWithAnchor>
					{suits.map((suit) => (
						<MenuItem key={suit.emoji}>
							{suit.label}
							<span role="img" aria-label={suit.label}>
								{suit.emoji}
							</span>
						</MenuItem>
					))}
				</MenuWithAnchor>
			</div>

			<div>
				<h2>Complex children</h2>
				<p>(with explicit `textValue` prop)</p>
				<MenuWithAnchor>
					{suits.map((suit) => (
						<MenuItem key={suit.emoji} textValue={suit.label}>
							<span role="img" aria-label={suit.label}>
								{suit.emoji}
							</span>
							{suit.label}
						</MenuItem>
					))}
				</MenuWithAnchor>
			</div>
		</div>
	</>
);

export const CheckboxItems = () => {
	const options = ["Crows", "Ravens", "Magpies", "Jackdaws"];

	const [selection, setSelection] = React.useState<string[]>([]);

	const handleSelectAll = () => {
		setSelection((currentSelection) =>
			currentSelection.length === options.length ? [] : options,
		);
	};

	return (
		<MenuWithAnchor>
			<MenuCheckboxItem
				checked={
					selection.length === options.length
						? true
						: selection.length
							? "indeterminate"
							: false
				}
				onCheckedChange={handleSelectAll}
			>
				Select all
			</MenuCheckboxItem>
			<MenuSeparator />
			{options.map((option) => (
				<MenuCheckboxItem
					key={option}
					checked={selection.includes(option)}
					onCheckedChange={() =>
						setSelection((current) =>
							current.includes(option)
								? current.filter((el) => el !== option)
								: current.concat(option),
						)
					}
				>
					{option}
				</MenuCheckboxItem>
			))}
		</MenuWithAnchor>
	);
};

export const RadioItems = () => {
	const files = ["README.md", "index.js", "page.css"];
	const [file, setFile] = React.useState(files[1]);

	return (
		<MenuWithAnchor>
			<MenuItem onSelect={() => window.alert("minimize")}>
				Minimize window
			</MenuItem>
			<MenuItem onSelect={() => window.alert("zoom")}>Zoom</MenuItem>
			<MenuItem onSelect={() => window.alert("smaller")}>Smaller</MenuItem>
			<MenuSeparator />
			<MenuRadioGroup value={file} onValueChange={setFile}>
				{files.map((file) => (
					<MenuRadioItem key={file} value={file}>
						{file}
					</MenuRadioItem>
				))}
			</MenuRadioGroup>
		</MenuWithAnchor>
	);
};

export const Animated = () => {
	const files = ["README.md", "index.js", "page.css"];
	const [file, setFile] = React.useState(files[1]);
	const [open, setOpen] = React.useState(true);
	const checkboxItems = [
		{ label: "Bold", state: React.useState(false) },
		{ label: "Italic", state: React.useState(true) },
		{ label: "Underline", state: React.useState(false) },
		{ label: "Strikethrough", state: React.useState(false), disabled: true },
	];

	return (
		<>
			<label>
				<input
					type="checkbox"
					checked={open}
					onChange={(event) => setOpen(event.target.checked)}
				/>{" "}
				open
			</label>
			<br />
			<br />
			<MenuWithAnchor open={open}>
				{checkboxItems.map(
					({ label, state: [checked, setChecked], disabled }) => (
						<MenuCheckboxItem
							key={label}
							checked={checked}
							onCheckedChange={setChecked}
							disabled={disabled}
						>
							{label}
							<MenuItemIndicator>
								<TickIcon />
							</MenuItemIndicator>
						</MenuCheckboxItem>
					),
				)}
				<MenuRadioGroup value={file} onValueChange={setFile}>
					{files.map((file) => (
						<MenuRadioItem key={file} value={file}>
							{file}
							<MenuItemIndicator>
								<TickIcon />
							</MenuItemIndicator>
						</MenuRadioItem>
					))}
				</MenuRadioGroup>
			</MenuWithAnchor>
		</>
	);
};

type MenuProps = Omit<
	React.ComponentProps<typeof Menu> & React.ComponentProps<typeof MenuContent>,
	| "trapFocus"
	| "onCloseAutoFocus"
	| "disableOutsidePointerEvents"
	| "disableOutsideScroll"
>;

const MenuWithAnchor: React.FC<MenuProps> = (props) => {
	const { open = true, children, ...contentProps } = props;
	return (
		<Menu open={open} onOpenChange={() => {}} modal={false}>
			{/* inline-block allows anchor to move when rtl changes on document */}
			<MenuAnchor style={{ display: "inline-block" }} />
			<MenuPortal>
				<MenuContent
					onCloseAutoFocus={(event: Event) => event.preventDefault()}
					align="start"
					{...contentProps}
				>
					{children}
				</MenuContent>
			</MenuPortal>
		</Menu>
	);
};

const Submenu: React.FC<
	MenuProps & { animated: boolean; disabled?: boolean; heading?: string }
> = (props) => {
	const {
		heading = "Submenu",
		open = true,
		onOpenChange,
		children,
		animated: _animated,
		disabled,
		...contentProps
	} = props;
	return (
		<MenuSub open={open} onOpenChange={onOpenChange}>
			<MenuSubTrigger disabled={disabled}>{heading} →</MenuSubTrigger>
			<MenuPortal>
				<MenuSubContent {...contentProps}>{children}</MenuSubContent>
			</MenuPortal>
		</MenuSub>
	);
};

export const TickIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 32 32"
		width="12"
		height="12"
		fill="none"
		stroke="currentcolor"
		strokeLinecap="round"
		strokeLinejoin="round"
		strokeWidth="3"
	>
		<title>Tick</title>
		<path d="M2 20 L12 28 30 4" />
	</svg>
);
