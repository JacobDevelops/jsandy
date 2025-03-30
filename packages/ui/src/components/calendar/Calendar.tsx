import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@jsandy/ui/button";
import { cn } from "@jsandy/ui/cn";
import * as React from "react";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/

type DateRange = {
	/**
	 * The start date of the selected range.
	 * Always required when using date range selection.
	 */
	from: Date;
	/**
	 * The end date of the selected range.
	 * Optional - if not provided, the range is considered incomplete,
	 * with only the start date selected.
	 */
	to?: Date;
};

type CaptionProps = {
	/**
	 * The date representing the month being displayed.
	 * Typically the first day of the month.
	 */
	date: Date;
	/**
	 * Callback function triggered when the user navigates to a different month
	 * using the previous or next buttons.
	 */
	onMonthChange: (month: Date) => void;
	/**
	 * Accessibility label for the next month navigation button.
	 * Used for screen readers and tooltips.
	 */
	nextLabel?: string;
	/**
	 * Accessibility label for the previous month navigation button.
	 * Used for screen readers and tooltips.
	 */
	prevLabel?: string;
	/**
	 * Whether the next month navigation button should be disabled.
	 * Typically true when:
	 * - There are multiple months displayed and this isn't the last one
	 * - The current month is at the maximum allowed date limit
	 */
	nextDisabled?: boolean;
	/**
	 * Whether the previous month navigation button should be disabled.
	 * Typically true when:
	 * - The current month is at the minimum allowed date limit
	 */
	prevDisabled?: boolean;
	/**
	 * Whether the next month navigation button should be hidden.
	 * Typically true when:
	 * - There are multiple months displayed and this isn't the last one
	 */
	nextHidden?: boolean;
	/**
	 * Whether the previous month navigation button should be disabled.
	 * Typically true when:
	 * - There are multiple months displayed and this isn't the first one
	 */
	prevHidden?: boolean;
};

type WeekdayProps = {
	/**
	 * The numeric day of the week (0-6), where:
	 * 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
	 */
	weekday: number;
	/**
	 * Function to format the weekday name for display.
	 * Default implementation returns a narrow weekday name based on locale.
	 */
	format?: (date: Date) => string;
};

type DayProps = {
	/**
	 * The date represented by this specific day cell.
	 */
	date: Date;
	/**
	 * The month currently being displayed in the calendar.
	 * Used to determine if this day is part of the current month or an outside day.
	 */
	displayMonth: Date;
	/**
	 * Callback function triggered when the day is clicked.
	 * Not called if the day is disabled or hidden.
	 */
	onClick?: (date: Date) => void;
	/**
	 * Whether this day is currently selected.
	 * The visual appearance will change based on this state.
	 */
	selected?: boolean;
	/**
	 * Whether this day is disabled and cannot be selected.
	 * Disabled days remain visible but cannot be interacted with.
	 */
	disabled?: boolean;
	/**
	 * Whether this day should be hidden entirely.
	 * Typically used for outside days when showOutsideDays is false.
	 */
	hidden?: boolean;
	/**
	 * Whether this day represents the current date.
	 * Usually highlighted with a different style.
	 */
	today?: boolean;
	/**
	 * Whether this day belongs to a month other than the one being displayed.
	 * These are days from the previous or next month that appear to complete weeks.
	 */
	isOutside?: boolean;
	/**
	 * Whether this day is the first day in a selected date range.
	 * Only applicable when using range selection mode.
	 */
	isRangeStart?: boolean;
	/**
	 * Whether this day is within a selected date range, but not the start or end.
	 * Only applicable when using range selection mode.
	 */
	isRangeMiddle?: boolean;
	/**
	 * Whether this day is the last day in a selected date range.
	 * Only applicable when using range selection mode.
	 */
	isRangeEnd?: boolean;
	/**
	 * Custom modifiers applied to this specific day.
	 * Each key is a modifier name, and the boolean value indicates if it's active.
	 */
	modifiers?: Record<string, boolean>;
	/**
	 * CSS class names to apply for each active modifier.
	 * Maps modifier names to CSS class names.
	 */
	modifiersClassNames?: Record<string, string>;
	/**
	 * Ref to be attached to the day button element.
	 * Used for programmatic focus control.
	 */
	dayRef?: React.RefObject<HTMLButtonElement | null>;
};

type CalendarBaseProps = {
	/**
	 * The earliest date that can be selected in the calendar.
	 * Dates before this will be automatically disabled.
	 */
	minDate?: Date;
	/**
	 * The latest date that can be selected in the calendar.
	 * Dates after this will be automatically disabled.
	 */
	maxDate?: Date;
	/**
	 * The number of consecutive months to display in the calendar view.
	 * Useful for date range selection or for providing a broader view.
	 * Default is 1.
	 */
	numberOfMonths?: number;
	/**
	 * The initial month to display when the calendar first renders.
	 * Only used when the calendar is uncontrolled (no 'month' prop).
	 * Default is the current month.
	 */
	defaultMonth?: Date;
	/**
	 * The currently displayed month in controlled mode.
	 * When provided, the calendar will not manage its own month state.
	 */
	month?: Date;
	/**
	 * Callback function triggered when the displayed month changes,
	 * either through navigation buttons or when a date from another month is selected.
	 */
	onMonthChange?: (month: Date) => void;
	/**
	 * Custom formatting functions for textual elements in the calendar.
	 * Override the default formatters to support localization or custom display formats.
	 */
	formatters?: {
		formatWeekdayName?: (date: Date) => string;
		formatMonthCaption?: (date: Date) => string;
	};
	/**
	 * Specify dates that should be disabled in the calendar.
	 * Can be either:
	 * - An array of specific dates to disable
	 * - A function that returns true for dates that should be disabled
	 */
	disabled?: Date[] | ((date: Date) => boolean);
	/**
	 * Custom CSS class names to override the default styling.
	 * Allows for targeted styling of different calendar elements.
	 */
	classNames?: {
		root?: string;
		month?: string;
		caption?: string;
		weekday?: string;
		day?: string;
		selected?: string;
		disabled?: string;
		today?: string;
		range?: string;
		rangeStart?: string;
		rangeMiddle?: string;
		rangeEnd?: string;
	};
	/**
	 * Whether to display the week number at the beginning of each week row.
	 * Week numbers are calculated based on ISO 8601 standard.
	 */
	showWeekNumber?: boolean;
	/**
	 * Defines which day is considered the first day of the week.
	 * 0 = Sunday, 1 = Monday, and so on.
	 */
	firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
	/**
	 * Whether to display days from the previous and next months
	 * to fill out complete weeks in the calendar view.
	 * When false, days outside the current month will be hidden.
	 */
	showOutsideDays?: boolean;
	/**
	 * Whether to always show 6 weeks in the calendar, regardless of the current month.
	 * When true, creates a consistent calendar height across months.
	 * When false, the calendar shrinks or grows based on how many weeks are needed.
	 */
	fixedWeeks?: boolean;
	/**
	 * Custom modifiers to apply to specific days, which can be used for styling or behavior.
	 * Each key represents a modifier name, and the value can be:
	 * - An array of specific dates to apply the modifier to
	 * - A function that returns true for dates that should have the modifier applied
	 */
	modifiers?: Record<string, Date[] | ((date: Date) => boolean)>;
	/**
	 * CSS class names to apply to days that match the corresponding modifiers.
	 * The keys should match those defined in the modifiers prop.
	 */
	modifiersClassNames?: Record<string, string>;
	/**
	 * Additional CSS class name to apply to the root calendar element.
	 * Allows for custom styling when used within different contexts.
	 */
	className?: string;
	/**
	 * When true, the calendar will focus the first selected day (if selected)
	 * or today's date (if not disabled) when the component mounts.
	 * Improves accessibility after user actions like opening a date picker.
	 */
	initialFocus?: boolean;
};

type CalendarSingleProps = CalendarBaseProps & {
	/**
	 * The selection mode for the calendar:
	 * - 'single': Select a single date
	 * - 'multiple': Select multiple individual dates
	 * - 'range': Select a continuous range of dates
	 */
	mode?: "single";
	/**
	 * The selected date(s), which can be:
	 * - A single Date object when mode is 'single'
	 * - An array of Date objects when mode is 'multiple'
	 * - A DateRange object containing 'from' and optional 'to' dates when mode is 'range'
	 */
	selected?: Date;
	/**
	 * Callback function triggered when a date is selected or deselected.
	 * The argument passed will match the format specified by the current mode:
	 * - Single Date object in 'single' mode
	 * - Array of Date objects in 'multiple' mode
	 * - DateRange object in 'range' mode
	 */
	onSelect?: (date?: Date) => void;
};

type CalendarMultipleProps = CalendarBaseProps & {
	/**
	 * The selection mode for the calendar:
	 * - 'single': Select a single date
	 * - 'multiple': Select multiple individual dates
	 * - 'range': Select a continuous range of dates
	 */
	mode: "multiple";
	/**
	 * The selected date(s), which can be:
	 * - A single Date object when mode is 'single'
	 * - An array of Date objects when mode is 'multiple'
	 * - A DateRange object containing 'from' and optional 'to' dates when mode is 'range'
	 */
	selected?: Date[];
	/**
	 * Callback function triggered when a date is selected or deselected.
	 * The argument passed will match the format specified by the current mode:
	 * - Single Date object in 'single' mode
	 * - Array of Date objects in 'multiple' mode
	 * - DateRange object in 'range' mode
	 */
	onSelect?: (date?: Date[]) => void;
};

type CalendarRangeProps = CalendarBaseProps & {
	/**
	 * The selection mode for the calendar:
	 * - 'single': Select a single date
	 * - 'multiple': Select multiple individual dates
	 * - 'range': Select a continuous range of dates
	 */
	mode: "range";
	/**
	 * The selected date(s), which can be:
	 * - A single Date object when mode is 'single'
	 * - An array of Date objects when mode is 'multiple'
	 * - A DateRange object containing 'from' and optional 'to' dates when mode is 'range'
	 */
	selected?: DateRange;
	/**
	 * Callback function triggered when a date is selected or deselected.
	 * The argument passed will match the format specified by the current mode:
	 * - Single Date object in 'single' mode
	 * - Array of Date objects in 'multiple' mode
	 * - DateRange object in 'range' mode
	 */
	onSelect?: (date?: DateRange) => void;
};

type CalendarProps =
	| CalendarSingleProps
	| CalendarMultipleProps
	| CalendarRangeProps;

type DatePickerProps = {
	/**
	 * The currently selected date or date range.
	 * - Use a Date object for single date selection
	 * - Use a DateRange object for range selection
	 */
	value?: Date | DateRange;
	/**
	 * Callback function triggered when the selected date changes.
	 * The argument will be the newly selected date or date range.
	 */
	onChange?: (date?: Date | DateRange) => void;
	/**
	 * Whether the entire date picker is disabled.
	 * When true, the date picker becomes non-interactive.
	 */
	disabled?: boolean;
	/**
	 * Props to pass to the underlying Calendar component.
	 * Allows customization of the calendar's appearance and behavior.
	 * The 'selected' and 'onSelect' props are managed by the DatePicker.
	 */
	calendarProps?: Omit<CalendarProps, "selected" | "onSelect">;
	/**
	 * Additional CSS class name to apply to the root date picker element.
	 * Allows for custom styling when used within different contexts.
	 */
	className?: string;
};

/* -------------------------------------------------------------------------------------------------
 * Utility Functions
 * -----------------------------------------------------------------------------------------------*/

/**
 * Formats a date to display only the day number (1-31).
 */
function formatDay(date: Date): string {
	return date.getDate().toString();
}

/**
 * Formats a date to display the month and year (e.g., "January 2023").
 * Used primarily for the calendar caption/header.
 */
function formatMonthCaption(date: Date): string {
	return date.toLocaleString("default", { month: "long", year: "numeric" });
}

/**
 * Formats a date to display a narrow weekday name (e.g., "M" for Monday).
 * Used for column headers in the calendar.
 */
function formatWeekdayName(date: Date): string {
	return date.toLocaleString("default", { weekday: "narrow" });
}

/**
 * Creates a new date by adding or subtracting a specified number of months.
 * Handles wrapping around year boundaries correctly.
 */
function addMonths(date: Date, amount: number): Date {
	const result = new Date(date);
	const currentMonth = result.getMonth();
	const newMonth = (currentMonth + amount) % 12;
	result.setMonth(newMonth);
	return result;
}

/**
 * Gets the first day of the week that contains the provided date.
 * Respects the specified first day of week preference (e.g., Sunday or Monday).
 */
function startOfWeek(date: Date, firstDayOfWeek = 0): Date {
	const result = new Date(date);
	const day = result.getDay();
	const diff = (day < firstDayOfWeek ? 7 : 0) + day - firstDayOfWeek;
	result.setDate(result.getDate() - diff);
	result.setHours(0, 0, 0, 0);
	return result;
}

/**
 * Generates a matrix of dates representing all weeks in a month.
 * Each inner array represents one week, containing 7 Date objects.
 */
function getWeeksInMonth(
	date: Date,
	firstDayOfWeek = 0,
	fixedWeeks = false,
): Date[][] {
	const month = date.getMonth();
	const year = date.getFullYear();
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	const startDate = startOfWeek(firstDay, firstDayOfWeek);

	// If we don't need fixed weeks, calculate the exact number of weeks
	const endDate = fixedWeeks
		? addDays(startDate, 41) // Always show 6 weeks
		: startOfWeek(addDays(lastDay, 1), firstDayOfWeek);

	const weeks: Date[][] = [];
	let currentDate = startDate;

	while (currentDate < endDate) {
		const week: Date[] = [];
		for (let i = 0; i < 7; i++) {
			week.push(new Date(currentDate));
			currentDate = addDays(currentDate, 1);
		}
		weeks.push(week);
	}

	return weeks;
}

/**
 * Checks if two dates represent the same calendar day.
 * Ignores time components and only compares year, month, and day.
 */
function isSameDay(date1: Date, date2: Date): boolean {
	return (
		date1.getDate() === date2.getDate() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getFullYear() === date2.getFullYear()
	);
}

/**
 * Checks if two dates are in the same month and year.
 * Useful for determining if a day belongs to the currently displayed month.
 */
function isSameMonth(date1: Date, date2: Date): boolean {
	return (
		date1.getMonth() === date2.getMonth() &&
		date1.getFullYear() === date2.getFullYear()
	);
}

/**
 * Checks if a date is today's date.
 */
function isToday(date: Date): boolean {
	return isSameDay(date, new Date());
}

/**
 * Creates a new date by adding or subtracting a specified number of days.
 */
function addDays(date: Date, amount: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + amount);
	return result;
}

/**
 * Determines if a date should be disabled based on various criteria.
 */
function isDateDisabled(
	date: Date,
	disabled?: Date[] | ((date: Date) => boolean),
	fromDate?: Date,
	toDate?: Date,
): boolean {
	if (!disabled && !fromDate && !toDate) return false;

	if (fromDate && date < fromDate) return true;
	if (toDate && date > toDate) return true;

	if (Array.isArray(disabled)) {
		return disabled.some((disabledDate) => isSameDay(date, disabledDate));
	}

	if (typeof disabled === "function") {
		return disabled(date);
	}

	return false;
}

/**
 * Determines if a date is currently selected based on the selection mode.
 * Works with single dates, multiple dates, or date ranges.
 */
function isDaySelected(
	date: Date,
	selected?: Date | Date[] | DateRange,
): boolean {
	if (!selected) return false;

	if (selected instanceof Date) {
		return isSameDay(date, selected);
	}

	if (Array.isArray(selected)) {
		return selected.some((selectedDate) => isSameDay(date, selectedDate));
	}

	// DateRange
	if (selected.from && selected.to) {
		return (
			(date >= selected.from && date <= selected.to) ||
			isSameDay(date, selected.from) ||
			isSameDay(date, selected.to)
		);
	}

	return selected.from ? isSameDay(date, selected.from) : false;
}

/**
 * Checks if a date falls within a specified date range.
 * Includes the boundaries (from and to dates).
 */
function isDateInRange(date: Date, range?: DateRange): boolean {
	if (!range?.from) return false;
	if (!range.to) return isSameDay(date, range.from);

	return date >= range.from && date <= range.to;
}

/**
 * Checks if a date is the starting date of a range.
 */
function isDateRangeStart(date: Date, range?: DateRange): boolean {
	if (!range?.from) return false;
	return isSameDay(date, range.from);
}

/**
 * Checks if a date is the ending date of a range.
 */
function isDateRangeEnd(date: Date, range?: DateRange): boolean {
	if (!range?.to) return false;
	return isSameDay(date, range.to);
}

/**
 * Calculates the ISO 8601 week number for a given date.
 * Week 1 is the week with the first Thursday of the year.
 */
function getWeekNumber(date: Date): number {
	const target = new Date(date);
	const dayNumber = (date.getDay() + 6) % 7;
	target.setDate(target.getDate() - dayNumber + 3);
	const firstThursday = target.valueOf();
	target.setMonth(0, 1);
	if (target.getDay() !== 4) {
		target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
	}
	return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

/**
 * Generates an array of dates representing each day of the week.
 * Used for building the weekday header in the calendar.
 */
function getWeekdays(firstDayOfWeek = 0): Date[] {
	const weekdays: Date[] = [];
	const now = new Date();
	const start = startOfWeek(now, firstDayOfWeek);

	for (let i = 0; i < 7; i++) {
		weekdays.push(addDays(start, i));
	}

	return weekdays;
}

/**
 * Creates or updates a date range based on a new selected date.
 * If range is undefined, creates a new DateRange starting from the given date.
 * If a range with only a `from` date exists, completes the range.
 */
function createDateRange(date: Date, range?: DateRange): DateRange {
	if (!range?.from || (range.from && range.to)) {
		return { from: date };
	}

	if (date < range.from) {
		return { from: date, to: range.from };
	}

	return { from: range.from, to: date };
}

/* -------------------------------------------------------------------------------------------------
 * Day Component
 * -----------------------------------------------------------------------------------------------*/

/**
 * Day component renders an individual day cell within the calendar.
 *
 * Features:
 * - Displays the day number
 * - Handles selection states (selected, range start/middle/end)
 * - Supports disabled and hidden states
 * - Highlights today's date
 * - Visually distinguishes days outside the current month
 * - Applies custom modifiers for additional styling
 * - Handles click interactions for date selection
 *
 * The component includes proper ARIA attributes for accessibility
 * and supports different visual states through CSS classes.
 */
const Day: React.FC<DayProps> = ({
	date,
	onClick,
	selected,
	disabled,
	hidden,
	today,
	isOutside,
	isRangeStart,
	isRangeMiddle,
	isRangeEnd,
	modifiers,
	modifiersClassNames,
	dayRef,
}) => {
	const handleClick = () => {
		if (disabled || hidden) return;
		onClick?.(date);
	};

	const dayClassNames = cn(
		{
			"opacity-50": isOutside,
			"bg-gray-300 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800":
				today && !selected,
			"bg-primary/60": isRangeMiddle && selected,
			"bg-primary/10 text-primary": isRangeMiddle && !selected,
			"rounded-l-md": isRangeStart,
			"rounded-r-md": isRangeEnd,
		},
		...(modifiers && modifiersClassNames
			? Object.entries(modifiers)
					.filter(([_, enabled]) => enabled)
					.map(([name]) => modifiersClassNames[name] || "")
			: []),
	);

	if (hidden) {
		return <div className="h-9 w-9" />;
	}

	return (
		<button
			ref={dayRef}
			type="button"
			className={cn(
				"h-9 w-9 p-0 font-normal aria-selected:opacity-100",
				"flex items-center justify-center rounded-md text-sm transition-colors",
				"hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
				selected &&
					"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
				disabled &&
					"text-muted-foreground opacity-50 hover:bg-transparent hover:text-muted-foreground",
				dayClassNames,
			)}
			onClick={handleClick}
			disabled={disabled}
			tabIndex={isOutside ? -1 : 0}
			aria-selected={selected}
			data-outside={isOutside || undefined}
			data-today={today || undefined}
			data-range-start={isRangeStart || undefined}
			data-range-middle={isRangeMiddle || undefined}
			data-range-end={isRangeEnd || undefined}
			{...Object.entries(modifiers || {}).reduce(
				(acc, [name, enabled]) => ({
					// biome-ignore lint/performance/noAccumulatingSpread: This is a workaround for a bug in React
					...acc,
					[`data-${name}`]: enabled || undefined,
				}),
				{},
			)}
		>
			{formatDay(date)}
		</button>
	);
};

/* -------------------------------------------------------------------------------------------------
 * Weekday Component
 * -----------------------------------------------------------------------------------------------*/

/**
 * Weekday component renders column headers for each day of the week.
 *
 * Features:
 * - Displays abbreviated weekday names based on locale settings
 * - Supports custom formatting through the format prop
 * - Uses semantic HTML (th elements) for better accessibility
 * - Adjusts to different first-day-of-week configurations
 *
 * The component creates a date object for the current week with the given
 * weekday number, allowing it to use standard date formatting methods
 * to display localized weekday names.
 */
const Weekday: React.FC<WeekdayProps> = ({
	weekday,
	format = formatWeekdayName,
}) => {
	// Create a date object for the current week with the given weekday
	const date = new Date();
	const currentDay = date.getDay();
	const diff = weekday - currentDay;
	date.setDate(date.getDate() + diff);

	return (
		<th
			scope="col"
			className="w-9 py-2 text-center font-medium text-muted-foreground text-xs"
		>
			{format(date)}
		</th>
	);
};

/* -------------------------------------------------------------------------------------------------
 * Caption Component
 * -----------------------------------------------------------------------------------------------*/

/**
 * Caption component renders the month and navigation section of a calendar month.
 *
 * Features:
 * - Displays the current month and year
 * - Provides navigation buttons to move to previous/next months
 * - Handles month navigation logic
 * - Supports disabled states for navigation buttons
 * - Includes proper accessibility labels for navigation controls
 *
 * The component is designed to work with both single and multi-month
 * calendar views, with intelligent navigation controls that respect
 * the calendar's date limits and multi-month display settings.
 */
const Caption: React.FC<CaptionProps> = ({
	date,
	onMonthChange,
	nextLabel = "Next Month",
	prevLabel = "Previous Month",
	nextDisabled = false,
	prevDisabled = false,
	nextHidden = false,
	prevHidden = false,
}) => {
	const handlePreviousClick = () => {
		onMonthChange(addMonths(date, -1));
	};

	const handleNextClick = () => {
		onMonthChange(addMonths(date, 1));
	};

	return (
		<div className="flex items-center justify-between px-2 py-1">
			<Button
				variant="ghost"
				size="icon"
				onClick={handlePreviousClick}
				disabled={prevDisabled}
				aria-label={prevLabel}
			>
				{!prevHidden && <ChevronLeft className="h-4 w-4" />}
			</Button>
			<div className="font-medium text-sm">{formatMonthCaption(date)}</div>
			<Button
				variant="ghost"
				size="icon"
				onClick={handleNextClick}
				disabled={nextDisabled}
				aria-label={nextLabel}
			>
				{!nextHidden && <ChevronRight className="h-4 w-4" />}
			</Button>
		</div>
	);
};

/* -------------------------------------------------------------------------------------------------
 * Calendar Component
 * -----------------------------------------------------------------------------------------------*/

/**
 * Calendar component for displaying and selecting dates.
 *
 * Features:
 * - Support for single date, multiple date, or date range selection
 * - Month navigation with optional constraints (min/max dates)
 * - Custom day rendering and styling
 * - Weekday and week number display options
 * - Customizable first day of week
 * - Support for disabled dates
 * - Outside days display control
 * - Initial focus on selected date or today's date for improved accessibility
 *
 * The component can be controlled (using the month prop) or uncontrolled (using defaultMonth).
 */
const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
	(
		{
			selected,
			onSelect,
			minDate,
			maxDate,
			numberOfMonths = 1,
			defaultMonth = new Date(),
			month: controlledMonth,
			onMonthChange,
			formatters = {},
			disabled,
			classNames = {},
			showWeekNumber = false,
			firstDayOfWeek = 0,
			mode = "single",
			showOutsideDays = false,
			fixedWeeks = false,
			modifiers = {},
			modifiersClassNames = {},
			className,
			initialFocus = false,
			...rest
		},
		ref,
	) => {
		// State for uncontrolled month
		const [internalMonth, setInternalMonth] = React.useState(defaultMonth);

		// Use controlled month if provided, otherwise use internal state
		const currentMonth = controlledMonth || internalMonth;

		// Create a ref to track the day element that should receive initial focus

		const focusableDay = React.useRef<HTMLButtonElement>(null);

		// Handle month change
		const handleMonthChange = (month: Date) => {
			onMonthChange?.(month);
			if (!controlledMonth) {
				setInternalMonth(month);
			}
		};

		// Custom components
		const DayComponent = Day;
		const CaptionComponent = Caption;

		// Get weekdays based on firstDayOfWeek
		const weekdays = getWeekdays(firstDayOfWeek);

		// Handle day click
		const handleDayClick = (date: Date) => {
			if (mode === "single") {
				// We know that onSelect expects a Date parameter
				(onSelect as ((date?: Date) => void) | undefined)?.(date);
			} else if (mode === "multiple") {
				const currentSelected = Array.isArray(selected) ? selected : [];
				const isAlreadySelected = currentSelected.some(
					(selectedDate) => selectedDate.getTime() === date.getTime(),
				);

				if (isAlreadySelected) {
					// We know that onSelect expects a Date[] parameter
					(onSelect as ((dates?: Date[]) => void) | undefined)?.(
						currentSelected.filter(
							(selectedDate) => selectedDate.getTime() !== date.getTime(),
						),
					);
				} else {
					// We know that onSelect expects a Date[] parameter
					(onSelect as ((dates?: Date[]) => void) | undefined)?.([
						...currentSelected,
						date,
					]);
				}
			} else if (mode === "range") {
				const range = selected as DateRange;
				// We know that onSelect expects a DateRange parameter
				(onSelect as ((range?: DateRange) => void) | undefined)?.(
					createDateRange(date, range),
				);
			}
		};

		// Apply initial focus effect when component mounts

		React.useEffect(() => {
			if (initialFocus && focusableDay.current) {
				focusableDay.current.focus();
			}
		}, [initialFocus]);

		// Generate months based on numberOfMonths
		const months: Date[] = [];
		for (let i = 0; i < numberOfMonths; i++) {
			const monthDate = new Date(currentMonth);
			monthDate.setMonth(monthDate.getMonth() + i);
			months.push(monthDate);
		}

		// Determine which date should receive initial focus
		const getFocusableDate = (): Date | null => {
			// First priority: selected date
			if (selected) {
				if (selected instanceof Date) {
					return selected;
				}

				if (Array.isArray(selected) && selected.length > 0) {
					return selected[0];
				}

				if ("from" in selected && selected.from) {
					return selected.from;
				}
			}

			// Second priority: today's date (if not disabled)
			const today = new Date();
			if (!isDateDisabled(today, disabled, minDate, maxDate)) {
				return today;
			}

			return null;
		};

		const focusableDate = getFocusableDate();

		return (
			<div ref={ref} className={cn("p-3", className)} {...rest}>
				<div
					className={cn(
						"flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0",
					)}
				>
					{months.map((monthDate, monthIndex) => (
						<div
							key={`month-${monthDate.getMonth()}-${monthDate.getFullYear()}`}
							className={cn("space-y-4", classNames.month)}
						>
							<CaptionComponent
								date={monthDate}
								onMonthChange={handleMonthChange}
								nextDisabled={
									monthIndex < months.length - 1 ||
									(maxDate && monthDate >= maxDate)
								}
								nextHidden={monthIndex < months.length - 1}
								prevDisabled={
									monthIndex > 0 || (minDate && monthDate <= minDate)
								}
								prevHidden={monthIndex > 0}
							/>

							<table className="w-full border-collapse space-y-1">
								<thead>
									<tr className="flex">
										{showWeekNumber && (
											<th className="w-9 py-2 text-center font-medium text-muted-foreground text-xs">
												#
											</th>
										)}
										{weekdays.map((weekday) => (
											<Weekday
												key={`weekday-${weekday.getTime()}`}
												weekday={weekday.getDay()}
												format={formatters.formatWeekdayName}
											/>
										))}
									</tr>
								</thead>

								<tbody>
									{getWeeksInMonth(monthDate, firstDayOfWeek, fixedWeeks).map(
										(week) => (
											<tr
												key={`week-${week[0].getTime()}`}
												className="flex w-full"
											>
												{showWeekNumber && (
													<td className="w-9 py-2 text-center font-medium text-muted-foreground text-xs">
														{getWeekNumber(week[0])}
													</td>
												)}

												{week.map((date) => {
													const isOutside = !isSameMonth(date, monthDate);
													const isSelectedDay = isDaySelected(date, selected);
													const isDisabled = isDateDisabled(
														date,
														disabled,
														minDate,
														maxDate,
													);
													const isDayToday = isToday(date);

													// Range specific props
													let isRangeStart = false;
													let isRangeMiddle = false;
													let isRangeEnd = false;

													if (mode === "range" && selected) {
														isRangeStart = isDateRangeStart(
															date,
															selected as DateRange,
														);
														isRangeEnd = isDateRangeEnd(
															date,
															selected as DateRange,
														);
														isRangeMiddle =
															isDateInRange(date, selected as DateRange) &&
															!isRangeStart &&
															!isRangeEnd;
													}

													// Apply custom modifiers
													const customModifiers: Record<string, boolean> = {};
													for (const [name, modifier] of Object.entries(
														modifiers,
													)) {
														if (Array.isArray(modifier)) {
															customModifiers[name] = modifier.some(
																(modDate) =>
																	modDate.getTime() === date.getTime(),
															);
														} else if (typeof modifier === "function") {
															customModifiers[name] = modifier(date);
														}
													}

													// Determine if this day should receive focus
													const shouldFocus =
														focusableDate &&
														isSameDay(date, focusableDate) &&
														isSameMonth(date, monthDate) &&
														!isOutside &&
														!isDisabled;

													const dayProps: DayProps = {
														date,
														displayMonth: monthDate,
														onClick: handleDayClick,
														selected: isSelectedDay,
														disabled: isDisabled,
														hidden: isOutside && !showOutsideDays,
														today: isDayToday,
														isOutside,
														isRangeStart,
														isRangeMiddle,
														isRangeEnd,
														modifiers: customModifiers,
														modifiersClassNames,
														// Pass the ref only to the day that should receive focus
														dayRef: shouldFocus ? focusableDay : undefined,
													};

													return (
														<td
															key={`day-${date.getTime()}`}
															className="relative p-0 text-center"
														>
															<DayComponent {...dayProps} />
														</td>
													);
												})}
											</tr>
										),
									)}
								</tbody>
							</table>
						</div>
					))}
				</div>
			</div>
		);
	},
);

Calendar.displayName = "Calendar";

export { Calendar };
export type {
	CalendarProps,
	CaptionProps,
	DayProps,
	WeekdayProps,
	DateRange,
	DatePickerProps,
};
