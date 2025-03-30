import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@jsandy/ui/button";
import { cn } from "@jsandy/ui/cn";
import { Popover, PopoverContent, PopoverTrigger } from "@jsandy/ui/popover";
import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { Calendar, type DateRange } from "./Calendar";

const meta: Meta<typeof Calendar> = {
	title: "Components/Calendar",
	component: Calendar,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		mode: {
			control: { type: "select" },
			options: ["single", "multiple", "range"],
			description: "Selection mode of the calendar",
		},
		numberOfMonths: {
			control: { type: "number", min: 1, max: 3 },
			description: "Number of months to display",
		},
		showWeekNumber: {
			control: "boolean",
			description: "Show week numbers",
		},
		firstDayOfWeek: {
			control: { type: "select" },
			options: [0, 1, 2, 3, 4, 5, 6],
			description: "First day of the week (0 = Sunday, 1 = Monday, etc.)",
		},
		showOutsideDays: {
			control: "boolean",
			description: "Show days from the previous/next month",
		},
		fixedWeeks: {
			control: "boolean",
			description: "Always display 6 weeks per month",
		},
	},
};

export default meta;
type Story = StoryObj<typeof Calendar>;

/**
 * Default calendar with single date selection
 */
export const Default: Story = {
	args: {
		showOutsideDays: true,
	},
	parameters: {
		docs: {
			source: {
				code: `
import { useState } from 'react';
import { Calendar } from './Calendar';

export const SingleDateCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);

  return (
    <div className="border rounded-md p-1">
      <Calendar
        showOutsideDays={true}
        selected={date}
        onSelect={setDate}
      />
      <div className="p-3 text-sm">Selected: {date ? date.toLocaleDateString() : 'None'}</div>
    </div>
  );
};
        `,
			},
		},
	},
	render: (args) => {
		// We need to use a wrapper component for state management
		const CalendarWithState = () => {
			const [date, setDate] = useState<Date | undefined>(undefined);

			return (
				<div className="rounded-md border p-1">
					<Calendar
						showOutsideDays={args.showOutsideDays}
						selected={date}
						onSelect={setDate}
					/>
					<div className="p-3 text-sm">
						Selected: {date ? date.toLocaleDateString() : "None"}
					</div>
				</div>
			);
		};

		return <CalendarWithState />;
	},
};

/**
 * Calendar configured for date range selection
 */
export const RangeSelection: Story = {
	args: {
		numberOfMonths: 1,
		showOutsideDays: true,
	},
	parameters: {
		docs: {
			source: {
				code: `
import { useState } from 'react';
import { Calendar, type DateRange } from './Calendar';

export const RangeSelectionCalendar = () => {
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  return (
    <div className="border rounded-md p-1">
      <Calendar
        mode="range"
        numberOfMonths={1}
        showOutsideDays={true}
        selected={range}
        onSelect={(selectedDate) => setRange(selectedDate as DateRange)}
      />
      <div className="p-3 text-sm">
        Selected range:{' '}
        {range?.from
          ? \`\${range.from.toLocaleDateString()} - \${
              range.to ? range.to.toLocaleDateString() : 'Selecting...'
            }\`
          : 'None'}
      </div>
    </div>
  );
};
        `,
			},
		},
	},
	render: (args) => {
		// Wrapper component for state management
		const CalendarWithState = () => {
			const [range, setRange] = useState<DateRange | undefined>(undefined);

			return (
				<div className="rounded-md border p-1">
					<Calendar
						{...args}
						mode="range"
						selected={range}
						onSelect={(selectedDate) => setRange(selectedDate as DateRange)}
					/>
					<div className="p-3 text-sm">
						Selected range:{" "}
						{range?.from
							? `${range.from.toLocaleDateString()} - ${
									range.to ? range.to.toLocaleDateString() : "Selecting..."
								}`
							: "None"}
					</div>
				</div>
			);
		};

		return <CalendarWithState />;
	},
};

/**
 * Calendar configured for multiple date selection
 */
export const MultipleSelection: Story = {
	args: {
		showOutsideDays: true,
	},
	parameters: {
		docs: {
			source: {
				code: `
import { useState } from 'react';
import { Calendar } from './Calendar';

export const MultipleSelectionCalendar = () => {
  const [dates, setDates] = useState<Date[]>([]);

  return (
    <div className="border rounded-md p-1">
      <Calendar
        mode="multiple"
        showOutsideDays={true}
        selected={dates}
        onSelect={(selectedDates) =>
          setDates(Array.isArray(selectedDates) ? selectedDates : [])
        }
      />
      <div className="max-w-[280px] text-wrap">
        Selected dates:{' '}
        {dates.length > 0 ? dates.map((date) => date.toLocaleDateString()).join(', ') : 'None'}
      </div>
    </div>
  );
};
        `,
			},
		},
	},
	render: (args) => {
		// Wrapper component for state management
		const CalendarWithState = () => {
			const [dates, setDates] = useState<Date[]>([]);

			return (
				<div className="rounded-md border p-1">
					<Calendar
						{...args}
						mode="multiple"
						selected={dates}
						onSelect={(selectedDates) =>
							setDates(Array.isArray(selectedDates) ? selectedDates : [])
						}
					/>
					<div className="max-w-[280px] text-wrap">
						Selected dates:{" "}
						{dates.length > 0
							? dates.map((date) => date.toLocaleDateString()).join(", ")
							: "None"}
					</div>
				</div>
			);
		};

		return <CalendarWithState />;
	},
};

/**
 * Calendar with disabled dates (weekends and specific dates)
 */
export const DisabledDates: Story = {
	args: {
		showOutsideDays: true,
	},
	parameters: {
		docs: {
			source: {
				code: `
import { useState } from 'react';
import { Calendar } from './Calendar';

export const DisabledDatesCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);

  // Disable weekends
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Get next business day
  const getNextBusinessDay = (date: Date) => {
    const nextDay = new Date(date);
    do {
      nextDay.setDate(nextDay.getDate() + 1);
    } while (isWeekend(nextDay));
    return nextDay;
  };

  // Get specific disabled date (today + 2, adjusted to next business day if weekend)
  const getSpecificDisabledDate = () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    return isWeekend(futureDate) ? getNextBusinessDay(futureDate) : futureDate;
  };

  const specificDisabledDate = getSpecificDisabledDate();

  return (
    <div className="border rounded-md p-1">
      <Calendar
        showOutsideDays={true}
        selected={date}
        onSelect={setDate}
        disabled={(date) =>
          isWeekend(date) ||
          (date.getDate() === specificDisabledDate.getDate() &&
            date.getMonth() === specificDisabledDate.getMonth() &&
            date.getFullYear() === specificDisabledDate.getFullYear())
        }
      />
      <div className="p-3 text-sm">
        <div>Selected: {date ? date.toLocaleDateString() : 'None'}</div>
        <div className="text-muted-foreground">
          Weekends and {specificDisabledDate.toLocaleDateString()} are disabled
        </div>
      </div>
    </div>
  );
};
        `,
			},
		},
	},
	render: (args) => {
		// Wrapper component with disabled dates logic
		const CalendarWithDisabledDates = () => {
			const [date, setDate] = useState<Date | undefined>(undefined);

			// Disable weekends
			const isWeekend = (date: Date) => {
				const day = date.getDay();
				return day === 0 || day === 6;
			};

			// Get next business day
			const getNextBusinessDay = (date: Date) => {
				const nextDay = new Date(date);
				do {
					nextDay.setDate(nextDay.getDate() + 1);
				} while (isWeekend(nextDay));
				return nextDay;
			};

			// Get specific disabled date (today + 2, adjusted to next business day if weekend)
			const getSpecificDisabledDate = () => {
				const futureDate = new Date();
				futureDate.setDate(futureDate.getDate() + 2);
				return isWeekend(futureDate)
					? getNextBusinessDay(futureDate)
					: futureDate;
			};

			const specificDisabledDate = getSpecificDisabledDate();

			return (
				<div className="rounded-md border p-1">
					<Calendar
						showOutsideDays={args.showOutsideDays}
						selected={date}
						onSelect={setDate}
						disabled={(date) =>
							isWeekend(date) ||
							(date.getDate() === specificDisabledDate.getDate() &&
								date.getMonth() === specificDisabledDate.getMonth() &&
								date.getFullYear() === specificDisabledDate.getFullYear())
						}
					/>
					<div className="p-3 text-sm">
						<div>Selected: {date ? date.toLocaleDateString() : "None"}</div>
						<div className="text-muted-foreground">
							Weekends and {specificDisabledDate.toLocaleDateString()} are
							disabled
						</div>
					</div>
				</div>
			);
		};

		return <CalendarWithDisabledDates />;
	},
};

/**
 * Calendar with min/max date constraints
 */
export const DateConstraints: Story = {
	args: {
		showOutsideDays: true,
	},
	parameters: {
		docs: {
			source: {
				code: `
import { useState } from 'react';
import { Calendar } from './Calendar';

export const DateConstraintsCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);

  // Min date: today
  const minDate = new Date();

  // Max date: 30 days from today
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  return (
    <div className="border rounded-md p-1">
      <Calendar
        showOutsideDays={true}
        selected={date}
        onSelect={setDate}
        minDate={minDate}
        maxDate={maxDate}
      />
      <div className="p-3 text-sm">
        <div>Selected: {date ? date.toLocaleDateString() : 'None'}</div>
        <div className="text-muted-foreground">
          Available dates: {minDate.toLocaleDateString()} to {maxDate.toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};
        `,
			},
		},
	},
	render: (args) => {
		// Wrapper component with min/max date constraints
		const CalendarWithConstraints = () => {
			const [date, setDate] = useState<Date | undefined>(undefined);

			// Min date: today
			const minDate = new Date();

			// Max date: 30 days from today
			const maxDate = new Date();
			maxDate.setDate(maxDate.getDate() + 30);

			return (
				<div className="rounded-md border p-1">
					<Calendar
						showOutsideDays={args.showOutsideDays}
						selected={date}
						onSelect={setDate}
						minDate={minDate}
						maxDate={maxDate}
					/>
					<div className="p-3 text-sm">
						<div>Selected: {date ? date.toLocaleDateString() : "None"}</div>
						<div className="text-muted-foreground">
							Available dates: {minDate.toLocaleDateString()} to{" "}
							{maxDate.toLocaleDateString()}
						</div>
					</div>
				</div>
			);
		};

		return <CalendarWithConstraints />;
	},
};

/**
 * Calendar with week numbers
 */
export const WithWeekNumbers: Story = {
	args: {
		showOutsideDays: true,
		showWeekNumber: true,
		fixedWeeks: true,
	},
	parameters: {
		docs: {
			source: {
				code: `
import { useState } from 'react';
import { Calendar } from './Calendar';

export const WithWeekNumbersCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);

  return (
    <div className="border rounded-md p-1">
      <Calendar
        showOutsideDays={true}
        showWeekNumber={true}
        fixedWeeks={true}
        selected={date}
        onSelect={setDate}
      />
      <div className="p-3 text-sm">Selected: {date ? date.toLocaleDateString() : 'None'}</div>
    </div>
  );
};
        `,
			},
		},
	},
	render: (args) => {
		const CalendarWithState = () => {
			const [date, setDate] = useState<Date | undefined>(undefined);

			return (
				<div className="rounded-md border p-1">
					<Calendar
						showOutsideDays={args.showOutsideDays}
						showWeekNumber={args.showWeekNumber}
						fixedWeeks={args.fixedWeeks}
						selected={date}
						onSelect={setDate}
					/>
					<div className="p-3 text-sm">
						Selected: {date ? date.toLocaleDateString() : "None"}
					</div>
				</div>
			);
		};

		return <CalendarWithState />;
	},
};

/**
 * Calendar starting with Monday as first day of week
 */
export const MondayFirst: Story = {
	args: {
		showOutsideDays: true,
		firstDayOfWeek: 1, // Monday
	},
	parameters: {
		docs: {
			source: {
				code: `
import { useState } from 'react';
import { Calendar } from './Calendar';

export const MondayFirstCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);

  return (
    <div className="border rounded-md p-1">
      <Calendar
        showOutsideDays={true}
        firstDayOfWeek={1} // Monday
        selected={date}
        onSelect={setDate}
      />
      <div className="p-3 text-sm text-muted-foreground">
        Calendar with Monday as first day of week
      </div>
    </div>
  );
};
        `,
			},
		},
	},
	render: (args) => {
		const CalendarWithState = () => {
			const [date, setDate] = useState<Date | undefined>(undefined);

			return (
				<div className="rounded-md border p-1">
					<Calendar
						showOutsideDays={args.showOutsideDays}
						firstDayOfWeek={args.firstDayOfWeek}
						selected={date}
						onSelect={setDate}
					/>
					<div className="p-3 text-muted-foreground text-sm">
						Calendar with Monday as first day of week
					</div>
				</div>
			);
		};

		return <CalendarWithState />;
	},
};

/**
 * Calendar with custom modifiers for highlighting specific dates
 */
export const CustomModifiers: Story = {
	args: {
		showOutsideDays: true,
	},
	parameters: {
		docs: {
			source: {
				code: `
import { useState } from 'react';
import { Calendar } from './Calendar';

export const CustomModifiersCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);

  // Highlight paydays (15th and last day of month)
  const isPayday = (date: Date) => {
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return date.getDate() === 15 || date.getDate() === lastDayOfMonth;
  };

  // Highlight holidays (for demo, just marking a couple dates)
  const isHoliday = (date: Date) => {
    const holiday1 = new Date();
    holiday1.setDate(holiday1.getDate() + 5);

    const holiday2 = new Date();
    holiday2.setDate(holiday2.getDate() + 12);

    return (
      (date.getDate() === holiday1.getDate() &&
        date.getMonth() === holiday1.getMonth() &&
        date.getFullYear() === holiday1.getFullYear()) ||
      (date.getDate() === holiday2.getDate() &&
        date.getMonth() === holiday2.getMonth() &&
        date.getFullYear() === holiday2.getFullYear())
    );
  };

  return (
    <div className="border rounded-md p-1">
      <Calendar
        showOutsideDays={true}
        selected={date}
        onSelect={setDate}
        modifiers={{
          payday: isPayday,
          holiday: isHoliday,
        }}
        modifiersClassNames={{
          payday: 'bg-green-100 font-bold text-green-800',
          holiday: 'bg-red-100 font-bold text-red-800',
        }}
      />
      <div className="p-3 text-sm space-y-1">
        <div>Selected: {date ? date.toLocaleDateString() : 'None'}</div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-100"></span>
          <span className="text-muted-foreground">Paydays (15th and last day of month)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-100"></span>
          <span className="text-muted-foreground">Holidays</span>
        </div>
      </div>
    </div>
  );
};
        `,
			},
		},
	},
	render: (args) => {
		const CalendarWithCustomModifiers = () => {
			const [date, setDate] = useState<Date | undefined>(undefined);

			// Highlight paydays (15th and last day of month)
			const isPayday = (date: Date) => {
				const lastDayOfMonth = new Date(
					date.getFullYear(),
					date.getMonth() + 1,
					0,
				).getDate();
				return date.getDate() === 15 || date.getDate() === lastDayOfMonth;
			};

			// Highlight holidays (for demo, just marking a couple dates)
			const isHoliday = (date: Date) => {
				const holiday1 = new Date();
				holiday1.setDate(holiday1.getDate() + 5);

				const holiday2 = new Date();
				holiday2.setDate(holiday2.getDate() + 12);

				return (
					(date.getDate() === holiday1.getDate() &&
						date.getMonth() === holiday1.getMonth() &&
						date.getFullYear() === holiday1.getFullYear()) ||
					(date.getDate() === holiday2.getDate() &&
						date.getMonth() === holiday2.getMonth() &&
						date.getFullYear() === holiday2.getFullYear())
				);
			};

			return (
				<div className="rounded-md border p-1">
					<Calendar
						showOutsideDays={args.showOutsideDays}
						selected={date}
						onSelect={setDate}
						modifiers={{
							payday: isPayday,
							holiday: isHoliday,
						}}
						modifiersClassNames={{
							payday: "bg-green-100 font-bold text-green-800",
							holiday: "bg-red-100 font-bold text-red-800",
						}}
					/>
					<div className="space-y-1 p-3 text-sm">
						<div>Selected: {date ? date.toLocaleDateString() : "None"}</div>
						<div className="flex items-center gap-2">
							<span className="h-3 w-3 rounded-full bg-green-100" />
							<span className="text-muted-foreground">
								Paydays (15th and last day of month)
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="h-3 w-3 rounded-full bg-red-100" />
							<span className="text-muted-foreground">Holidays</span>
						</div>
					</div>
				</div>
			);
		};

		return <CalendarWithCustomModifiers />;
	},
};

/**
 * Calendar configured for month selection (just navigation)
 */
export const MonthNavigation: Story = {
	args: {
		showOutsideDays: true,
	},
	parameters: {
		docs: {
			source: {
				code: `
import { useState } from 'react';
import { Calendar } from './Calendar';

export const MonthNavigationCalendar = () => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  return (
    <div className="border rounded-md p-1">
      <Calendar
        showOutsideDays={true}
        month={selectedMonth}
        onMonthChange={setSelectedMonth}
      />
      <div className="p-3 text-sm text-center">
        Current month view:{' '}
        {selectedMonth.toLocaleDateString(undefined, {
          month: 'long',
          year: 'numeric',
        })}
      </div>
    </div>
  );
};
        `,
			},
		},
	},
	render: (args) => {
		const CalendarMonthNavigation = () => {
			const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
			const [date, setDate] = useState<Date | undefined>(undefined);

			return (
				<div className="rounded-md border p-1">
					<Calendar
						{...args}
						mode="single"
						month={selectedMonth}
						onMonthChange={setSelectedMonth}
						selected={date}
						onSelect={setDate}
					/>
					<div className="p-3 text-center text-sm">
						Current month view:{" "}
						{selectedMonth.toLocaleDateString(undefined, {
							month: "long",
							year: "numeric",
						})}
					</div>
				</div>
			);
		};

		return <CalendarMonthNavigation />;
	},
};

/**
 * Calendar with multiple months view
 */
export const MultipleMonths: Story = {
	args: {
		numberOfMonths: 2,
		showOutsideDays: true,
	},
	parameters: {
		docs: {
			source: {
				code: `
import { useState } from 'react';
import { Calendar } from './Calendar';

export const MultipleMonthsCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);

  return (
    <div className="border rounded-md p-1">
      <Calendar
        numberOfMonths={2}
        showOutsideDays={true}
        selected={date}
        onSelect={setDate}
      />
      <div className="p-3 text-sm">Selected: {date ? date.toLocaleDateString() : 'None'}</div>
    </div>
  );
};
        `,
			},
		},
	},
	render: (args) => {
		const CalendarWithState = () => {
			const [date, setDate] = useState<Date | undefined>(undefined);

			return (
				<div className="rounded-md border p-1">
					<Calendar
						numberOfMonths={args.numberOfMonths}
						showOutsideDays={args.showOutsideDays}
						selected={date}
						onSelect={setDate}
					/>
					<div className="p-3 text-sm">
						Selected: {date ? date.toLocaleDateString() : "None"}
					</div>
				</div>
			);
		};

		return <CalendarWithState />;
	},
};

/*
 * Combined Calendar and Popover component, typically used in forms and showcases the new `initialFocus` prop
 */
export const DatePicker: Story = {
	args: {
		showOutsideDays: true,
	},
	render: (args) => {
		const [date, setDate] = React.useState<Date | undefined>(undefined);
		const [dropdownOpen, setDropdownOpen] = React.useState(false);

		const handleSelectDate = (newDate: Date | undefined) => {
			if (newDate) {
				setDate(newDate);
			} else {
				setDate(undefined);
			}
		};

		const handleSave = () => {
			setDropdownOpen(false);
		};

		return (
			<Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className={cn(
							"inline-flex h-10 w-72 items-center justify-start px-4 py-2 text-left font-normal",
							!date && "text-muted-foreground",
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{date ? (
							date.toLocaleDateString(undefined, {
								month: "short",
								day: "2-digit",
								year: "numeric",
							})
						) : (
							<span>Pick a date</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-72 p-0" align="start">
					<Calendar
						mode="single"
						selected={date}
						onSelect={handleSelectDate}
						showOutsideDays={args.showOutsideDays}
						initialFocus
					/>
					<div className="flex justify-end gap-2 border-border border-t p-3">
						<Button
							size="sm"
							variant="outline"
							onClick={() => setDropdownOpen(false)}
						>
							Cancel
						</Button>
						<Button size="sm" onClick={handleSave}>
							Save
						</Button>
					</div>
				</PopoverContent>
			</Popover>
		);
	},
};
