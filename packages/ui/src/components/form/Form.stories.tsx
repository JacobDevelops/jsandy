import { LoaderCircle, Plus, Trash } from "lucide-react";
import { Button } from "@jsandy/ui/button";
import { Checkbox } from "@jsandy/ui/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	useFieldArray,
	useForm,
} from "@jsandy/ui/form";
import { Input } from "@jsandy/ui/input";
import { RadioGroup, RadioGroupItem } from "@jsandy/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@jsandy/ui/select";
import { Switch } from "@jsandy/ui/switch";
import { Textarea } from "@jsandy/ui/textarea";
import { toast } from "@jsandy/ui/toast";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Separator } from "../separator";
import { zodResolver } from "./resolvers";

const meta: Meta<typeof Form> = {
	title: "Components/Form",
	component: Form,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof Form>;

/**
 * # Basic Form Example
 *
 * A simple form with email and password fields. This example demonstrates:
 * - Basic form setup with React Hook Form
 * - Form validation using Zod
 * - Error messages and submission handling
 */
export const BasicForm: Story = {
	parameters: {
		docs: {
			source: {
				code: `
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "@jsandy/ui/form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@jsandy/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

// Define the form schema with Zod
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
});

export function BasicLoginForm() {
  // Initialize the form with React Hook Form and the Zod resolver
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: ""
    },
  });

  // Define the form submission handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    toast({
      title: "Login attempted",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full max-w-md">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormDescription>
                Enter your registered email address.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Sign In</Button>
      </form>
    </Form>
  );
}`,
			},
		},
	},
	render: () => {
		// Define the form schema with Zod
		const formSchema = z.object({
			email: z
				.string()
				.email({ message: "Please enter a valid email address" }),
			password: z
				.string()
				.min(8, { message: "Password must be at least 8 characters" }),
		});

		// Create the form component
		function LoginForm() {
			const form = useForm<z.infer<typeof formSchema>>({
				resolver: zodResolver(formSchema),
				defaultValues: {
					email: "",
					password: "",
				},
			});

			function onSubmit(values: z.infer<typeof formSchema>) {
				toast({
					title: "Login attempted",
					description: (
						<pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
							<code className="text-white">
								{JSON.stringify(values, null, 2)}
							</code>
						</pre>
					),
				});
			}

			return (
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="w-full max-w-md space-y-8"
					>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input placeholder="email@example.com" {...field} />
									</FormControl>
									<FormDescription>
										Enter your registered email address.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input type="password" placeholder="********" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit">Sign In</Button>
					</form>
				</Form>
			);
		}

		return <LoginForm />;
	},
};

/**
 * # Profile Form
 *
 * A more complex form with various field types and advanced validation. This example demonstrates:
 * - Multiple field types (text, select, checkbox, etc.)
 * - Custom validation rules
 * - Form layout and organization
 */
export const ProfileForm: Story = {
	parameters: {
		docs: {
			source: {
				code: `
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "@jsandy/ui/form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@jsandy/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, { message: "Username must be at least 2 characters." })
    .max(30, { message: "Username cannot be longer than 30 characters." }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address." }),
  bio: z
    .string()
    .max(160, { message: "Bio cannot be longer than 160 characters." })
    .optional(),
  role: z.enum(["user", "admin", "manager"], {
    required_error: "Please select a role.",
  }),
  notifications: z.boolean().default(false).optional(),
});

export function ProfileFormExample() {
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      email: "",
      bio: "",
      role: "user",
      notifications: false,
    },
  });

  function onSubmit(values: z.infer<typeof profileFormSchema>) {
    toast({
      title: "Profile updated",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Profile</h3>
          <p className="text-sm text-muted-foreground">
            Update your profile information.
          </p>
        </div>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormDescription>
                We'll never share your email with anyone else.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about yourself"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                You can <span>@mention</span> other users and organizations.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                This is the role that will be assigned to your account.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notifications"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Email Notifications</FormLabel>
                <FormDescription>
                  Receive emails about your account activity.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit">Update profile</Button>
      </form>
    </Form>
  );
}`,
			},
		},
	},
	render: () => {
		const profileFormSchema = z.object({
			username: z
				.string()
				.min(2, { message: "Username must be at least 2 characters." })
				.max(30, { message: "Username cannot be longer than 30 characters." }),
			email: z
				.string()
				.email({ message: "Please enter a valid email address." }),
			bio: z
				.string()
				.max(160, { message: "Bio cannot be longer than 160 characters." })
				.optional(),
			role: z.enum(["user", "admin", "manager"], {
				required_error: "Please select a role.",
			}),
			notifications: z.boolean().default(false).optional(),
		});

		function ProfileFormExample() {
			const form = useForm<z.infer<typeof profileFormSchema>>({
				resolver: zodResolver(profileFormSchema),
				defaultValues: {
					username: "",
					email: "",
					bio: "",
					role: "user",
					notifications: false,
				},
			});

			function onSubmit(values: z.infer<typeof profileFormSchema>) {
				toast({
					title: "Profile updated",
					description: (
						<pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
							<code className="text-white">
								{JSON.stringify(values, null, 2)}
							</code>
						</pre>
					),
				});
			}

			return (
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="w-full max-w-md space-y-8"
					>
						<div className="space-y-4">
							<h3 className="font-medium text-lg">Profile</h3>
							<p className="text-muted-foreground text-sm">
								Update your profile information.
							</p>
						</div>
						<FormField
							control={form.control}
							name="username"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Username</FormLabel>
									<FormControl>
										<Input placeholder="username" {...field} />
									</FormControl>
									<FormDescription>
										This is your public display name.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input placeholder="email@example.com" {...field} />
									</FormControl>
									<FormDescription>
										We&apos;ll never share your email with anyone else.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="bio"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Bio</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Tell us a little bit about yourself"
											className="resize-none"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										You can <span>@mention</span> other users and organizations.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Role</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a role" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="user">User</SelectItem>
											<SelectItem value="manager">Manager</SelectItem>
											<SelectItem value="admin">Admin</SelectItem>
										</SelectContent>
									</Select>
									<FormDescription>
										This is the role that will be assigned to your account.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="notifications"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>Email Notifications</FormLabel>
										<FormDescription>
											Receive emails about your account activity.
										</FormDescription>
									</div>
								</FormItem>
							)}
						/>
						<Button type="submit">Update profile</Button>
					</form>
				</Form>
			);
		}

		return <ProfileFormExample />;
	},
};

/**
 * # Form with Radio Groups
 *
 * This example demonstrates how to use radio groups in a form. It shows:
 * - Setting up radio inputs with validation
 * - Styling radio groups
 * - Handling mutually exclusive options
 */
export const RadioGroupForm: Story = {
	parameters: {
		docs: {
			source: {
				code: `
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "@jsandy/ui/form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@jsandy/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/use-toast";

const formSchema = z.object({
  type: z.enum(["all", "mentions", "none"], {
    required_error: "You need to select a notification type.",
  }),
  marketingEmails: z.enum(["yes", "no"], {
    required_error: "Please specify your marketing preference.",
  }),
});

export function RadioGroupFormExample() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Notification Preferences</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="all" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      All notifications
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="mentions" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Only mentions and direct messages
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="none" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      No notifications
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Select the type of notifications you want to receive.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="marketingEmails"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Marketing Emails</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="yes" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Yes, I want to receive marketing emails
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="no" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      No, please don't send me marketing emails
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">Save preferences</Button>
      </form>
    </Form>
  );
}`,
			},
		},
	},
	render: () => {
		const formSchema = z.object({
			type: z.enum(["all", "mentions", "none"], {
				required_error: "You need to select a notification type.",
			}),
			marketingEmails: z.enum(["yes", "no"], {
				required_error: "Please specify your marketing preference.",
			}),
		});

		function RadioGroupFormExample() {
			const form = useForm<z.infer<typeof formSchema>>({
				resolver: zodResolver(formSchema),
			});

			function onSubmit(data: z.infer<typeof formSchema>) {
				toast({
					title: "You submitted the following values:",
					description: (
						<pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
							<code className="text-white">
								{JSON.stringify(data, null, 2)}
							</code>
						</pre>
					),
				});
			}

			return (
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="w-full max-w-md space-y-6"
					>
						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem className="space-y-3">
									<FormLabel>Notification Preferences</FormLabel>
									<FormControl>
										<RadioGroup
											onValueChange={field.onChange}
											defaultValue={field.value}
											className="flex flex-col space-y-1"
										>
											<FormItem className="flex items-center space-x-3 space-y-0">
												<FormControl>
													<RadioGroupItem value="all" />
												</FormControl>
												<FormLabel className="font-normal">
													All notifications
												</FormLabel>
											</FormItem>
											<FormItem className="flex items-center space-x-3 space-y-0">
												<FormControl>
													<RadioGroupItem value="mentions" />
												</FormControl>
												<FormLabel className="font-normal">
													Only mentions and direct messages
												</FormLabel>
											</FormItem>
											<FormItem className="flex items-center space-x-3 space-y-0">
												<FormControl>
													<RadioGroupItem value="none" />
												</FormControl>
												<FormLabel className="font-normal">
													No notifications
												</FormLabel>
											</FormItem>
										</RadioGroup>
									</FormControl>
									<FormDescription>
										Select the type of notifications you want to receive.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="marketingEmails"
							render={({ field }) => (
								<FormItem className="space-y-3">
									<FormLabel>Marketing Emails</FormLabel>
									<FormControl>
										<RadioGroup
											onValueChange={field.onChange}
											defaultValue={field.value}
											className="flex flex-col space-y-1"
										>
											<FormItem className="flex items-center space-x-3 space-y-0">
												<FormControl>
													<RadioGroupItem value="yes" />
												</FormControl>
												<FormLabel className="font-normal">
													Yes, I want to receive marketing emails
												</FormLabel>
											</FormItem>
											<FormItem className="flex items-center space-x-3 space-y-0">
												<FormControl>
													<RadioGroupItem value="no" />
												</FormControl>
												<FormLabel className="font-normal">
													No, please don&apos;t send me marketing emails
												</FormLabel>
											</FormItem>
										</RadioGroup>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button type="submit">Save preferences</Button>
					</form>
				</Form>
			);
		}

		return <RadioGroupFormExample />;
	},
};

/**
 * # Form with Async Submission
 *
 * This example demonstrates a form with async submission handling. It shows:
 * - Loading states during submission
 * - Error handling with async operations
 * - Disabling form controls during submission
 */
export const AsyncSubmissionForm: Story = {
	parameters: {
		docs: {
			source: {
				code: `
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "@jsandy/ui/form";
import * as z from "zod";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@jsandy/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

const formSchema = z.object({
  username: z
    .string()
    .min(2, { message: "Username must be at least 2 characters." })
    .max(50, { message: "Username cannot be more than 50 characters." }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address." }),
});

// Simulate an API call
const simulateApiCall = () => new Promise<void>((resolve, reject) => {
  // 80% chance of success
  if (Math.random() > 0.2) {
    setTimeout(() => resolve(), 2000);
  } else {
    setTimeout(() => reject(new Error("Server error occurred")), 2000);
  }
});

export function AsyncSubmissionFormExample() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      await simulateApiCall();
      
      toast({
        title: "Form submitted successfully",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(values, null, 2)}</code>
          </pre>
        ),
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Your username" 
                  {...field} 
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="email@example.com" 
                  {...field} 
                  disabled={isSubmitting} 
                />
              </FormControl>
              <FormDescription>
                We'll never share your email with anyone else.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </Form>
  );
}`,
			},
		},
	},
	render: () => {
		const formSchema = z.object({
			username: z
				.string()
				.min(2, { message: "Username must be at least 2 characters." })
				.max(50, { message: "Username cannot be more than 50 characters." }),
			email: z
				.string()
				.email({ message: "Please enter a valid email address." }),
		});

		// Simulate an API call
		const simulateApiCall = () =>
			new Promise<void>((resolve, reject) => {
				// 80% chance of success
				if (Math.random() > 0.2) {
					setTimeout(() => resolve(), 2000);
				} else {
					setTimeout(() => reject(new Error("Server error occurred")), 2000);
				}
			});

		function AsyncSubmissionFormExample() {
			const [isSubmitting, setIsSubmitting] = useState(false);

			const form = useForm<z.infer<typeof formSchema>>({
				resolver: zodResolver(formSchema),
				defaultValues: {
					username: "",
					email: "",
				},
			});

			async function onSubmit(values: z.infer<typeof formSchema>) {
				setIsSubmitting(true);

				try {
					await simulateApiCall();

					toast({
						title: "Form submitted successfully",
						description: (
							<pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
								<code className="text-white">
									{JSON.stringify(values, null, 2)}
								</code>
							</pre>
						),
					});

					form.reset();
				} catch (error) {
					toast({
						title: "Submission failed",
						description:
							error instanceof Error
								? error.message
								: "An unknown error occurred",
						variant: "destructive",
					});
				} finally {
					setIsSubmitting(false);
				}
			}

			return (
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="w-full max-w-md space-y-8"
					>
						<FormField
							control={form.control}
							name="username"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Username</FormLabel>
									<FormControl>
										<Input
											placeholder="Your username"
											{...field}
											disabled={isSubmitting}
										/>
									</FormControl>
									<FormDescription>
										This is your public display name.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="email@example.com"
											{...field}
											disabled={isSubmitting}
										/>
									</FormControl>
									<FormDescription>
										We&apos;ll never share your email with anyone else.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && (
								<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
							)}
							{isSubmitting ? "Submitting..." : "Submit"}
						</Button>
					</form>
				</Form>
			);
		}

		return <AsyncSubmissionFormExample />;
	},
};

/**
 * # Form with Dynamic Fields
 *
 * This example demonstrates a form with dynamic fields that can be added or removed by the user.
 * It shows how to:
 * - Handle arrays of fields
 * - Add and remove fields dynamically
 * - Validate dynamic field groups
 */
export const DynamicFieldsForm: Story = {
	parameters: {
		docs: {
			source: {
				code: `
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "@jsandy/ui/form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@jsandy/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

// Define the schema for each education entry
const contactSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z
    .string()
    .regex(/^\\d{10}$/, { message: 'Phone number must be 10 digits' })
    .optional(),
});

const formSchema = z.object({
  title: z.string().min(2, { message: 'Title is required' }),
  contacts: z.array(contactSchema).min(1, {
    message: 'You need at least one contact',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function DynamicFieldsFormExample() {
  // Initialize the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      contacts: [{ name: '', email: '', phone: '' }],
    },
  });

  // Set up the dynamic field array for contacts
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'contacts',
  });

  // Handle form submission
  function onSubmit(data: FormValues) {
    toast({
      title: 'Form submitted!',
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact List Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter a title" {...field} />
                </FormControl>
                <FormDescription>
                  Name your list of contacts (e.g., &quot;Work Contacts&quot;)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Contacts</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: '', email: '', phone: '' })}
                className="flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4" />
                Add Contact
              </Button>
            </div>

            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium">Contact #{index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name={\`contacts.\${index}.name\`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={\`contacts.\${index}.email\`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="john.doe@example.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={\`contacts.\${index}.phone\`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {form.formState.errors.contacts?.root && (
              <p className="text-sm font-medium text-red-500">
                {form.formState.errors.contacts.root.message}
              </p>
            )}
          </div>

          <Button type="submit">Submit</Button>
        </form>
      </Form>
  );
}`,
			},
		},
	},
	render: () => {
		const contactSchema = z.object({
			name: z
				.string()
				.min(2, { message: "Name must be at least 2 characters" }),
			email: z
				.string()
				.email({ message: "Please enter a valid email address" }),
			phone: z
				.string()
				.regex(/^\d{10}$/, { message: "Phone number must be 10 digits" })
				.optional(),
		});

		const formSchema = z.object({
			title: z.string().min(2, { message: "Title is required" }),
			contacts: z.array(contactSchema).min(1, {
				message: "You need at least one contact",
			}),
		});

		type FormValues = z.infer<typeof formSchema>;

		// Initialize the form with default values
		const form = useForm<FormValues>({
			resolver: zodResolver(formSchema),
			defaultValues: {
				title: "",
				contacts: [{ name: "", email: "", phone: "" }],
			},
		});

		// Set up the dynamic field array for contacts
		const { fields, append, remove } = useFieldArray({
			control: form.control,
			name: "contacts",
		});

		// Handle form submission
		function onSubmit(data: FormValues) {
			toast({
				title: "Form submitted!",
				description: (
					<pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
						<code className="text-white">{JSON.stringify(data, null, 2)}</code>
					</pre>
				),
			});
		}

		return (
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Contact List Title</FormLabel>
								<FormControl>
									<Input placeholder="Enter a title" {...field} />
								</FormControl>
								<FormDescription>
									Name your list of contacts (e.g., &quot;Work Contacts&quot;)
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="font-medium text-lg">Contacts</h3>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => append({ name: "", email: "", phone: "" })}
								className="flex items-center gap-1"
							>
								<Plus className="h-4 w-4" />
								Add Contact
							</Button>
						</div>

						{fields.map((field, index) => (
							<Card key={field.id}>
								<CardContent className="pt-6">
									<div className="mb-4 flex items-start justify-between">
										<h4 className="font-medium">Contact #{index + 1}</h4>
										{fields.length > 1 && (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => remove(index)}
												className="text-red-500 hover:bg-red-50 hover:text-red-700"
											>
												<Trash className="mr-1 h-4 w-4" />
												Remove
											</Button>
										)}
									</div>

									<div className="grid gap-4 md:grid-cols-3">
										<FormField
											control={form.control}
											name={`contacts.${index}.name`}
											render={({ field }) => (
												<FormItem>
													<FormLabel>Name</FormLabel>
													<FormControl>
														<Input placeholder="John Doe" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name={`contacts.${index}.email`}
											render={({ field }) => (
												<FormItem>
													<FormLabel>Email</FormLabel>
													<FormControl>
														<Input
															placeholder="john.doe@example.com"
															type="email"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name={`contacts.${index}.phone`}
											render={({ field }) => (
												<FormItem>
													<FormLabel>Phone (optional)</FormLabel>
													<FormControl>
														<Input placeholder="1234567890" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</CardContent>
							</Card>
						))}

						{form.formState.errors.contacts && (
							<p className="font-medium text-red-500 text-sm">
								{form.formState.errors.contacts.message}
							</p>
						)}
					</div>

					<Button type="submit">Submit</Button>
				</form>
			</Form>
		);
	},
};

/**
 * # Form with Conditional Fields
 *
 * This example demonstrates a form with fields that appear or disappear based on other field values.
 * It shows how to:
 * - Implement conditional rendering of form fields
 * - Handle validation for conditionally displayed fields
 * - Create dependent field relationships
 */
export const ConditionalFieldsForm: Story = {
	parameters: {
		docs: {
			source: {
				code: `
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "@jsandy/ui/form";
import { useEffect, useState } from "react";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@jsandy/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

// Define the form schema with conditional validation
const formSchema = z.object({
  contactMethod: z.enum(["email", "phone", "mail"], {
    required_error: "Please select a contact method.",
  }),
  
  // Email field - required only when contactMethod is "email"
  email: z.string().email({ message: "Please enter a valid email address." }).optional(),
  
  // Phone fields - required only when contactMethod is "phone"
  phone: z.string().optional(),
  allowTexting: z.boolean().optional(),
  
  // Mailing address fields - required only when contactMethod is "mail"
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  
  // Additional notes - always optional
  additionalNotes: z.string().optional(),
})
.refine((data) => {
  if (data.contactMethod === "email") {
    return !!data.email;
  }
  return true;
}, {
  message: "Email is required when Email is selected as contact method",
  path: ["email"],
})
.refine((data) => {
  if (data.contactMethod === "phone") {
    return !!data.phone;
  }
  return true;
}, {
  message: "Phone number is required when Phone is selected as contact method",
  path: ["phone"],
})
.refine((data) => {
  if (data.contactMethod === "mail") {
    return !!data.address && !!data.city && !!data.state && !!data.zipCode;
  }
  return true;
}, {
  message: "All address fields are required when Mail is selected as contact method",
  path: ["address"],
});

export function ConditionalFieldsFormExample() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactMethod: "email",
      email: "",
      phone: "",
      allowTexting: false,
      address: "",
      city: "",
      state: "",
      zipCode: "",
      additionalNotes: "",
    },
  });
  
  // Watch the contact method to conditionally render fields
  const contactMethod = form.watch("contactMethod");

  function onSubmit(values: z.infer<typeof formSchema>) {
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="contactMethod"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Preferred Contact Method</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="email" />
                    </FormControl>
                    <FormLabel className="font-normal">Email</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="phone" />
                    </FormControl>
                    <FormLabel className="font-normal">Phone</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="mail" />
                    </FormControl>
                    <FormLabel className="font-normal">Postal Mail</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                How would you like us to contact you?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Conditional Email Field */}
        {contactMethod === "email" && (
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" {...field} />
                </FormControl>
                <FormDescription>
                  We'll use this email to contact you.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {/* Conditional Phone Fields */}
        {contactMethod === "phone" && (
          <>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 555-5555" {...field} />
                  </FormControl>
                  <FormDescription>
                    We'll use this number to contact you.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="allowTexting"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Text Message Alerts</FormLabel>
                    <FormDescription>
                      Allow sending text messages to your phone number.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}
        
        {/* Conditional Mailing Address Fields */}
        {contactMethod === "mail" && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl>
                    <Input placeholder="12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        
        {/* Additional Notes - Always visible */}
        <FormField
          control={form.control}
          name="additionalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional information you'd like us to know..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional: Add any other details you'd like us to know.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}`,
			},
		},
	},
	render: () => {
		// Define the form schema with conditional validation
		const formSchema = z
			.object({
				contactMethod: z.enum(["email", "phone", "mail"], {
					required_error: "Please select a contact method.",
				}),

				// Email field - required only when contactMethod is "email"
				email: z
					.string()
					.email({ message: "Please enter a valid email address." })
					.optional(),

				// Phone fields - required only when contactMethod is "phone"
				phone: z.string().optional(),
				allowTexting: z.boolean().optional(),

				// Mailing address fields - required only when contactMethod is "mail"
				address: z.string().optional(),
				city: z.string().optional(),
				state: z.string().optional(),
				zipCode: z.string().optional(),

				// Additional notes - always optional
				additionalNotes: z.string().optional(),
			})
			.refine(
				(data) => {
					if (data.contactMethod === "email") {
						return !!data.email;
					}
					return true;
				},
				{
					message: "Email is required when Email is selected as contact method",
					path: ["email"],
				},
			)
			.refine(
				(data) => {
					if (data.contactMethod === "phone") {
						return !!data.phone;
					}
					return true;
				},
				{
					message:
						"Phone number is required when Phone is selected as contact method",
					path: ["phone"],
				},
			)
			.refine(
				(data) => {
					if (data.contactMethod === "mail") {
						return (
							!!data.address && !!data.city && !!data.state && !!data.zipCode
						);
					}
					return true;
				},
				{
					message:
						"All address fields are required when Mail is selected as contact method",
					path: ["address"],
				},
			);

		function ConditionalFieldsFormExample() {
			const form = useForm<z.infer<typeof formSchema>>({
				resolver: zodResolver(formSchema),
				defaultValues: {
					contactMethod: "email",
					email: "",
					phone: "",
					allowTexting: false,
					address: "",
					city: "",
					state: "",
					zipCode: "",
					additionalNotes: "",
				},
			});

			// Watch the contact method to conditionally render fields
			const contactMethod = form.watch("contactMethod");

			function onSubmit(values: z.infer<typeof formSchema>) {
				toast({
					title: "You submitted the following values:",
					description: (
						<pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
							<code className="text-white">
								{JSON.stringify(values, null, 2)}
							</code>
						</pre>
					),
				});
			}

			return (
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="w-full max-w-md space-y-8"
					>
						<FormField
							control={form.control}
							name="contactMethod"
							render={({ field }) => (
								<FormItem className="space-y-3">
									<FormLabel>Preferred Contact Method</FormLabel>
									<FormControl>
										<RadioGroup
											onValueChange={field.onChange}
											defaultValue={field.value}
											className="flex flex-col space-y-1"
										>
											<FormItem className="flex items-center space-x-3 space-y-0">
												<FormControl>
													<RadioGroupItem value="email" />
												</FormControl>
												<FormLabel className="font-normal">Email</FormLabel>
											</FormItem>
											<FormItem className="flex items-center space-x-3 space-y-0">
												<FormControl>
													<RadioGroupItem value="phone" />
												</FormControl>
												<FormLabel className="font-normal">Phone</FormLabel>
											</FormItem>
											<FormItem className="flex items-center space-x-3 space-y-0">
												<FormControl>
													<RadioGroupItem value="mail" />
												</FormControl>
												<FormLabel className="font-normal">
													Postal Mail
												</FormLabel>
											</FormItem>
										</RadioGroup>
									</FormControl>
									<FormDescription>
										How would you like us to contact you?
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Conditional Email Field */}
						{contactMethod === "email" && (
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email Address</FormLabel>
										<FormControl>
											<Input placeholder="you@example.com" {...field} />
										</FormControl>
										<FormDescription>
											We&apos;ll use this email to contact you.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{/* Conditional Phone Fields */}
						{contactMethod === "phone" && (
							<>
								<FormField
									control={form.control}
									name="phone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Phone Number</FormLabel>
											<FormControl>
												<Input placeholder="(555) 555-5555" {...field} />
											</FormControl>
											<FormDescription>
												We&apos;ll use this number to contact you.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="allowTexting"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
											<div className="space-y-0.5">
												<FormLabel className="text-base">
													Text Message Alerts
												</FormLabel>
												<FormDescription>
													Allow sending text messages to your phone number.
												</FormDescription>
											</div>
											<FormControl>
												<Switch
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
							</>
						)}

						{/* Conditional Mailing Address Fields */}
						{contactMethod === "mail" && (
							<div className="space-y-4">
								<FormField
									control={form.control}
									name="address"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Street Address</FormLabel>
											<FormControl>
												<Input placeholder="123 Main St" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="city"
										render={({ field }) => (
											<FormItem>
												<FormLabel>City</FormLabel>
												<FormControl>
													<Input placeholder="City" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="state"
										render={({ field }) => (
											<FormItem>
												<FormLabel>State</FormLabel>
												<FormControl>
													<Input placeholder="State" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="zipCode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>ZIP Code</FormLabel>
											<FormControl>
												<Input placeholder="12345" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						)}

						{/* Additional Notes - Always visible */}
						<FormField
							control={form.control}
							name="additionalNotes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Additional Notes</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Any additional information you'd like us to know..."
											className="resize-none"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Optional: Add any other details you&apos;d like us to know.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button type="submit">Submit</Button>
					</form>
				</Form>
			);
		}

		return <ConditionalFieldsFormExample />;
	},
};

export const DeepNestedForm: Story = {
	parameters: {
		docs: {
			source: {
				code: `
    // Define a schema for our order settings form
    const formSchema = z.object({
      config: z.object({
        deliveryFee: z.number().min(0, 'Value must not be negative'),
        deliveryFeeTaxPercentage: z.number().min(0, 'Value must not be negative'),
        deliveryMinOrder: z.number().min(0, 'Value must not be negative'),
        deliveryDistanceMax: z.number().min(0, 'Value must not be negative'),
        waitTimeMins: z.number().min(0, 'Value must not be negative'),
        allowItemNotes: z.boolean(),
        allowOrderNotes: z.boolean(),
        itemNotesMaxLength: z.number().min(0, 'Value must not be negative'),
        orderNotesMaxLength: z.number().min(0, 'Value must not be negative'),
        orderingNotificationMessages: z
          .object({
            ACCEPTED: z
              .object({
                disabled: z.boolean().optional(),
                title: z.string().optional(),
                body: z.string().optional(),
              })
              .optional(),
            REJECTED: z
              .object({
                disabled: z.boolean().optional(),
                title: z.string().optional(),
                body: z.string().optional(),
              })
              .optional(),
            COMPLETED: z
              .object({
                disabled: z.boolean().optional(),
                title: z.string().optional(),
                body: z.string().optional(),
              })
              .optional(),
          })
          .optional(),
      }),
      settings: z.object({
        fulfillmentTypeEnabled: z.boolean(),
        base: z.object({
          excludedDeliveryAreaIds: z.array(
            z.object({
              value: z.string(),
            })
          ),
          timeSlotsEnabled: z.boolean(),
        }),
        delivery: z.object({
          timeSlotsEnabled: z.boolean(),
          excludedDeliveryAreaIds: z.array(z.string()).optional(),
        }),
      }),
      deliveryPostcodesString: z.string().optional(),
    });

    type FormValues = z.infer<typeof formSchema>;

    // List of notification statuses for iteration
    const OrderingNotificationStatuses = ['ACCEPTED', 'REJECTED', 'COMPLETED'] as const;
    
    const form = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        config: {
          deliveryFee: 0,
          deliveryFeeTaxPercentage: 0,
          deliveryMinOrder: 0,
          deliveryDistanceMax: 0,
          waitTimeMins: 0,
          allowItemNotes: false,
          allowOrderNotes: false,
          itemNotesMaxLength: 0,
          orderNotesMaxLength: 0,
          orderingNotificationMessages: {
            ACCEPTED: {
              disabled: false,
              title: 'Order Accepted',
              body: 'Your order has been accepted',
            },
            REJECTED: {
              disabled: false,
              title: 'Order Rejected',
              body: 'Your order has been rejected',
            },
            COMPLETED: {
              disabled: false,
              title: 'Order Completed',
              body: 'Your order has been completed',
            },
          },
        },
        settings: {
          fulfillmentTypeEnabled: false,
          base: {
            excludedDeliveryAreaIds: [],
            timeSlotsEnabled: false,
          },
          delivery: {
            timeSlotsEnabled: false,
            excludedDeliveryAreaIds: [],
          },
        },
      },
    });

    // Use field array for excluded delivery area IDs
    const excludedDeliveryAreaIds = useFieldArray({
      control: form.control,
      name: 'settings.base.excludedDeliveryAreaIds',
    });

    function onSubmit(data: FormValues) {
      toast({
        title: 'Form submitted',
        description: 'Check the console for form data',
      });
      console.log('Form data:', data);
    }

    // Sample delivery areas
    const deliveryAreas = [
      { id: 'area1', name: 'Downtown' },
      { id: 'area2', name: 'Suburb' },
      { id: 'area3', name: 'Industrial Zone' },
    ];

    // Toggle delivery area
    const toggleDeliveryArea = (id: string) => {
      const currentIds = excludedDeliveryAreaIds.fields.map((field) => field.value);
      const existingIndex = currentIds.indexOf(id);

      if (existingIndex > -1) {
        // If the ID exists, remove it
        excludedDeliveryAreaIds.remove(existingIndex);
      } else {
        // If the ID doesn't exist, append it
        excludedDeliveryAreaIds.append({ value: id });
      }
    };

    // NEW: Watch specific deep nested fields for reactive UI updates
    const waitTimeMins = form.watch('config.waitTimeMins');
    const acceptedTitle = form.watch('config.orderingNotificationMessages.ACCEPTED.title');
    const excludedAreas = form.watch('settings.base.excludedDeliveryAreaIds');
    
    // NEW: Demo functions for setValue with deep paths
    const resetDeliverySettings = () => {
      form.setValue('config.deliveryFee', 0);
      form.setValue('config.deliveryFeeTaxPercentage', 0);
      form.setValue('config.deliveryMinOrder', 0);
      form.setValue('config.deliveryDistanceMax', 0);
    };
    
    const enableAllNotifications = () => {
      OrderingNotificationStatuses.forEach(status => {
        form.setValue(\`config.orderingNotificationMessages.\${status}.disabled\`, false);
      });
    };
    
    const setDefaultNotificationTitles = () => {
      form.setValue('config.orderingNotificationMessages.ACCEPTED.title', 'Order Has Been Accepted');
      form.setValue('config.orderingNotificationMessages.REJECTED.title', 'Order Has Been Rejected');
      form.setValue('config.orderingNotificationMessages.COMPLETED.title', 'Order Has Been Completed');
    };

    return (
      <div className="w-full max-w-3xl mx-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Deep Nested Form Example</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              This example demonstrates a form with deeply nested fields, showing how to properly
              handle fields like "config.orderingNotificationMessages.ACCEPTED.disabled"
              and array fields like "settings.base.excludedDeliveryAreaIds".
            </p>
          </CardContent>
        </Card>

        {/* NEW: Add a reactive section that uses watch values */}
        <Card className="mb-6 bg-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">Real-time Form Values</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">Wait Time:</h4>
              <div className="text-xl font-bold">{waitTimeMins} minutes</div>
            </div>
            <div>
              <h4 className="font-medium">Accepted Order Notification Title:</h4>
              <div className="text-xl font-bold">{acceptedTitle || 'Not set'}</div>
            </div>
            <div>
              <h4 className="font-medium">Excluded Areas:</h4>
              <div className="text-slate-600">
                {excludedAreas.length === 0 ? (
                  <span>No areas excluded</span>
                ) : (
                  <ul className="list-disc pl-5">
                    {excludedAreas.map((area, index) => (
                      <li key={index}>{deliveryAreas.find(a => a.id === area.value)?.name || area.value}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NEW: Add buttons section to demonstrate setValue */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Set Values Demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={resetDeliverySettings}>
                Reset Delivery Settings
              </Button>
              <Button variant="outline" onClick={enableAllNotifications}>
                Enable All Notifications
              </Button>
              <Button variant="outline" onClick={setDefaultNotificationTitles}>
                Set Default Titles
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  // Demonstrate getting nested values directly
                  const waitTime = form.getValues('config.waitTimeMins');
                  const acceptedBody = form.getValues('config.orderingNotificationMessages.ACCEPTED.body');
                  const excludedAreas = form.getValues('settings.base.excludedDeliveryAreaIds');
                  
                  toast({
                    title: 'Current Values',
                    description: (
                      <div className="space-y-2 mt-2">
                        <div><strong>Wait Time:</strong> {waitTime} minutes</div>
                        <div><strong>Accepted Notification Body:</strong> {acceptedBody}</div>
                        <div><strong>Excluded Areas:</strong> {excludedAreas.length} areas</div>
                      </div>
                    ),
                  });
                }}
              >
                Log Current Values
              </Button>
            </div>
            <p className="text-sm text-slate-500">
              These buttons demonstrate how to use setValue with deep nested paths.
            </p>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Delivery Settings Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Delivery Settings</h3>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="config.deliveryFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery fee</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            placeholder="0"
                            min={0}
                            step={1}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>Cents / Pence</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="config.deliveryFeeTaxPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Tax Rate</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            placeholder="0"
                            min={0}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter as percentage, e.g. "6.7" for 6.7% tax on delivery fee
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="config.deliveryMinOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum delivery order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            placeholder="0"
                            min={1}
                            step={1}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>Cents / Pence</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryPostcodesString"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcodes</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Type in postcode(s)" />
                        </FormControl>
                        <FormDescription>Delimit postcodes with a comma</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-6 space-y-2">
                    <h4 className="font-medium">Delivery Areas</h4>
                    <p className="text-sm text-gray-500">Toggle excluded delivery areas:</p>
                    <div className="flex flex-col gap-2">
                      {deliveryAreas.map((area) => {
                        const isExcluded = excludedDeliveryAreaIds.fields.some(
                          (field) => field.value === area.id
                        );
                        return (
                          <div
                            key={area.id}
                            className={\`p-3 border rounded-md cursor-pointer \${
                              isExcluded ? 'bg-gray-100 border-gray-300' : 'border-gray-200'
                            }\`}
                            onClick={() => toggleDeliveryArea(area.id)}
                          >
                            <div className="flex justify-between items-center">
                              <span>{area.name}</span>
                              <span>{isExcluded ? '(Excluded)' : '(Included)'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Custom Order Notifications */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Custom Order Notifications</h3>
              <Card>
                <CardContent className="pt-6 space-y-8">
                  {OrderingNotificationStatuses.map((status) => (
                    <div key={status} className="space-y-4">
                      <h4 className="font-semibold">
                        Order{' '}
                        {status
                          .split('_')
                          .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
                          .join(' ')}{' '}
                        Notifications
                      </h4>

                      <FormField
                        control={form.control}
                        name={\`config.orderingNotificationMessages.\${status}.disabled\`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Disable Notification Type</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={\`config.orderingNotificationMessages.\${status}.title\`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={\`config.orderingNotificationMessages.\${status}.body\`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message Body</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Other Settings */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Other Settings</h3>
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="config.waitTimeMins"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated wait time</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            placeholder="0"
                            min={0}
                            step={1}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>Minutes</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="settings.fulfillmentTypeEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Enable menu based on fulfillment type</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <h5 className="text-sm text-gray-500">Item Level Notes</h5>
                    <FormField
                      control={form.control}
                      name="config.allowItemNotes"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Allow Item Level Notes</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="config.itemNotesMaxLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum characters allowed for item level notes</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              min={1}
                              step={1}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit">Save Configuration</Button>
            </div>
          </form>
        </Form>
      </div>
    );`,
			},
		},
	},
	render: () => {
		// Define a schema for our order settings form
		const formSchema = z.object({
			config: z.object({
				deliveryFee: z.number().min(0, "Value must not be negative"),
				deliveryFeeTaxPercentage: z
					.number()
					.min(0, "Value must not be negative"),
				deliveryMinOrder: z.number().min(0, "Value must not be negative"),
				deliveryDistanceMax: z.number().min(0, "Value must not be negative"),
				waitTimeMins: z.number().min(0, "Value must not be negative"),
				allowItemNotes: z.boolean(),
				allowOrderNotes: z.boolean(),
				itemNotesMaxLength: z.number().min(0, "Value must not be negative"),
				orderNotesMaxLength: z.number().min(0, "Value must not be negative"),
				orderingNotificationMessages: z
					.object({
						ACCEPTED: z
							.object({
								disabled: z.boolean().optional(),
								title: z.string().optional(),
								body: z.string().optional(),
							})
							.optional(),
						REJECTED: z
							.object({
								disabled: z.boolean().optional(),
								title: z.string().optional(),
								body: z.string().optional(),
							})
							.optional(),
						COMPLETED: z
							.object({
								disabled: z.boolean().optional(),
								title: z.string().optional(),
								body: z.string().optional(),
							})
							.optional(),
					})
					.optional(),
			}),
			settings: z.object({
				fulfillmentTypeEnabled: z.boolean(),
				base: z.object({
					excludedDeliveryAreaIds: z.array(
						z.object({
							value: z.string(),
						}),
					),
					timeSlotsEnabled: z.boolean(),
				}),
				delivery: z.object({
					timeSlotsEnabled: z.boolean(),
					excludedDeliveryAreaIds: z.array(z.string()).optional(),
				}),
			}),
			deliveryPostcodesString: z.string().optional(),
		});

		type FormValues = z.infer<typeof formSchema>;

		// List of notification statuses for iteration
		const OrderingNotificationStatuses = [
			"ACCEPTED",
			"REJECTED",
			"COMPLETED",
		] as const;

		const form = useForm<FormValues>({
			resolver: zodResolver(formSchema),
			defaultValues: {
				config: {
					deliveryFee: 0,
					deliveryFeeTaxPercentage: 0,
					deliveryMinOrder: 0,
					deliveryDistanceMax: 0,
					waitTimeMins: 0,
					allowItemNotes: false,
					allowOrderNotes: false,
					itemNotesMaxLength: 0,
					orderNotesMaxLength: 0,
					orderingNotificationMessages: {
						ACCEPTED: {
							disabled: false,
							title: "Order Accepted",
							body: "Your order has been accepted",
						},
						REJECTED: {
							disabled: false,
							title: "Order Rejected",
							body: "Your order has been rejected",
						},
						COMPLETED: {
							disabled: false,
							title: "Order Completed",
							body: "Your order has been completed",
						},
					},
				},
				settings: {
					fulfillmentTypeEnabled: false,
					base: {
						excludedDeliveryAreaIds: [],
						timeSlotsEnabled: false,
					},
					delivery: {
						timeSlotsEnabled: false,
						excludedDeliveryAreaIds: [],
					},
				},
			},
		});

		// Use field array for excluded delivery area IDs
		const excludedDeliveryAreaIds = useFieldArray({
			control: form.control,
			name: "settings.base.excludedDeliveryAreaIds",
		});

		function onSubmit(data: FormValues) {
			toast({
				title: "Form submitted",
				description: "Check the console for form data",
			});
			console.log("Form data:", data);
		}

		// Sample delivery areas
		const deliveryAreas = [
			{ id: "area1", name: "Downtown" },
			{ id: "area2", name: "Suburb" },
			{ id: "area3", name: "Industrial Zone" },
		];

		// Toggle delivery area
		const toggleDeliveryArea = (id: string) => {
			const currentIds = excludedDeliveryAreaIds.fields.map(
				(field) => field.value,
			);
			const existingIndex = currentIds.indexOf(id);

			if (existingIndex > -1) {
				// If the ID exists, remove it
				excludedDeliveryAreaIds.remove(existingIndex);
			} else {
				// If the ID doesn't exist, append it
				excludedDeliveryAreaIds.append({ value: id });
			}
		};

		// NEW: Watch specific deep nested fields for reactive UI updates
		const waitTimeMins = form.watch("config.waitTimeMins");
		const acceptedTitle = form.watch(
			"config.orderingNotificationMessages.ACCEPTED.title",
		);
		const excludedAreas = form.watch("settings.base.excludedDeliveryAreaIds");

		// NEW: Demo functions for setValue with deep paths
		const resetDeliverySettings = () => {
			form.setValue("config.deliveryFee", 0);
			form.setValue("config.deliveryFeeTaxPercentage", 0);
			form.setValue("config.deliveryMinOrder", 0);
			form.setValue("config.deliveryDistanceMax", 0);
		};

		const enableAllNotifications = () => {
			for (const status of OrderingNotificationStatuses) {
				form.setValue(
					`config.orderingNotificationMessages.${status}.disabled`,
					false,
				);
			}
		};

		const setDefaultNotificationTitles = () => {
			form.setValue(
				"config.orderingNotificationMessages.ACCEPTED.title",
				"Order Has Been Accepted",
			);
			form.setValue(
				"config.orderingNotificationMessages.REJECTED.title",
				"Order Has Been Rejected",
			);
			form.setValue(
				"config.orderingNotificationMessages.COMPLETED.title",
				"Order Has Been Completed",
			);
		};

		return (
			<div className="mx-auto w-full max-w-3xl p-6">
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Deep Nested Form Example</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="mb-4 text-gray-500 text-sm">
							This example demonstrates a form with deeply nested fields,
							showing how to properly handle fields like
							&quot;config.orderingNotificationMessages.ACCEPTED.disabled&quot;
							and array fields like
							&quot;settings.base.excludedDeliveryAreaIds&quot;.
						</p>
					</CardContent>
				</Card>

				{/* NEW: Add a reactive section that uses watch values */}
				<Card className="mb-6 bg-slate-50">
					<CardHeader>
						<CardTitle className="text-lg">Real-time Form Values</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<h4 className="font-medium">Wait Time:</h4>
							<div className="font-bold text-xl">{waitTimeMins} minutes</div>
						</div>
						<div>
							<h4 className="font-medium">
								Accepted Order Notification Title:
							</h4>
							<div className="font-bold text-xl">
								{acceptedTitle || "Not set"}
							</div>
						</div>
						<div>
							<h4 className="font-medium">Excluded Areas:</h4>
							<div className="text-slate-600">
								{!excludedAreas?.length ? (
									<span>No areas excluded</span>
								) : (
									<ul className="list-disc pl-5">
										{excludedAreas.map((area) => (
											<li key={area.value}>
												{deliveryAreas.find((a) => a.id === area.value)?.name ||
													area.value}
											</li>
										))}
									</ul>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* NEW: Add buttons section to demonstrate setValue */}
				<Card className="mb-6">
					<CardHeader>
						<CardTitle className="text-lg">Set Values Demo</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap gap-2">
							<Button variant="outline" onClick={resetDeliverySettings}>
								Reset Delivery Settings
							</Button>
							<Button variant="outline" onClick={enableAllNotifications}>
								Enable All Notifications
							</Button>
							<Button variant="outline" onClick={setDefaultNotificationTitles}>
								Set Default Titles
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									// Demonstrate getting nested values directly
									const waitTime = form.getValues("config.waitTimeMins");
									const acceptedBody = form.getValues(
										"config.orderingNotificationMessages.ACCEPTED.body",
									);
									const excludedAreas = form.getValues(
										"settings.base.excludedDeliveryAreaIds",
									);

									toast({
										title: "Current Values",
										description: (
											<div className="mt-2 space-y-2">
												<div>
													<strong>Wait Time:</strong> {waitTime} minutes
												</div>
												<div>
													<strong>Accepted Notification Body:</strong>{" "}
													{acceptedBody}
												</div>
												<div>
													<strong>Excluded Areas:</strong>{" "}
													{excludedAreas?.length} areas
												</div>
											</div>
										),
									});
								}}
							>
								Log Current Values
							</Button>
						</div>
						<p className="text-slate-500 text-sm">
							These buttons demonstrate how to use setValue and getValues with
							deep nested paths.
						</p>
					</CardContent>
				</Card>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
						{/* Delivery Settings Section */}
						<div>
							<h3 className="mb-4 font-semibold text-xl">Delivery Settings</h3>
							<Card>
								<CardContent className="space-y-4 pt-6">
									<FormField
										control={form.control}
										name="config.deliveryFee"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Delivery fee</FormLabel>
												<FormControl>
													<Input
														type="number"
														{...field}
														placeholder="0"
														min={0}
														step={1}
														onChange={(e) =>
															field.onChange(
																Number.parseInt(e.target.value) || 0,
															)
														}
													/>
												</FormControl>
												<FormDescription>Cents / Pence</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="config.deliveryFeeTaxPercentage"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Delivery Tax Rate</FormLabel>
												<FormControl>
													<Input
														type="number"
														{...field}
														placeholder="0"
														min={0}
														onChange={(e) =>
															field.onChange(
																Number.parseFloat(e.target.value) || 0,
															)
														}
													/>
												</FormControl>
												<FormDescription>
													Enter as percentage, e.g. &quot;6.7&quot; for 6.7% tax
													on delivery fee
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="config.deliveryMinOrder"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Minimum delivery order</FormLabel>
												<FormControl>
													<Input
														type="number"
														{...field}
														placeholder="0"
														min={1}
														step={1}
														onChange={(e) =>
															field.onChange(
																Number.parseInt(e.target.value) || 0,
															)
														}
													/>
												</FormControl>
												<FormDescription>Cents / Pence</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="deliveryPostcodesString"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Postcodes</FormLabel>
												<FormControl>
													<Input {...field} placeholder="Type in postcode(s)" />
												</FormControl>
												<FormDescription>
													Delimit postcodes with a comma
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="mt-6 space-y-2">
										<h4 className="font-medium">Delivery Areas</h4>
										<p className="text-gray-500 text-sm">
											Toggle excluded delivery areas:
										</p>
										<div className="flex flex-col gap-2">
											{deliveryAreas.map((area) => {
												const isExcluded = excludedDeliveryAreaIds.fields.some(
													(field) => field.value === area.id,
												);
												return (
													<div
														key={area.id}
														className={`cursor-pointer rounded-md border p-3 ${
															isExcluded
																? "border-gray-300 bg-gray-100"
																: "border-gray-200"
														}`}
														onClick={() => toggleDeliveryArea(area.id)}
														onKeyDown={(e) => {
															if (e.key === "Enter" || e.key === " ") {
																e.preventDefault();
																toggleDeliveryArea(area.id);
															}
														}}
													>
														<div className="flex items-center justify-between">
															<span>{area.name}</span>
															<span>
																{isExcluded ? "(Excluded)" : "(Included)"}
															</span>
														</div>
													</div>
												);
											})}
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						<Separator />

						{/* Custom Order Notifications */}
						<div>
							<h3 className="mb-4 font-semibold text-xl">
								Custom Order Notifications
							</h3>
							<Card>
								<CardContent className="space-y-8 pt-6">
									{OrderingNotificationStatuses.map((status) => (
										<div key={status} className="space-y-4">
											<h4 className="font-semibold">
												Order{" "}
												{status
													.split("_")
													.map(
														(word) =>
															word.charAt(0) + word.slice(1).toLowerCase(),
													)
													.join(" ")}{" "}
												Notifications
											</h4>

											<FormField
												control={form.control}
												name={`config.orderingNotificationMessages.${status}.disabled`}
												render={({ field }) => (
													<FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
														<FormControl>
															<Checkbox
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
														</FormControl>
														<div className="space-y-1 leading-none">
															<FormLabel>Disable Notification Type</FormLabel>
														</div>
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name={`config.orderingNotificationMessages.${status}.title`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>Message Title</FormLabel>
														<FormControl>
															<Input {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name={`config.orderingNotificationMessages.${status}.body`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>Message Body</FormLabel>
														<FormControl>
															<Input {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									))}
								</CardContent>
							</Card>
						</div>

						<Separator />

						{/* Other Settings */}
						<div>
							<h3 className="mb-4 font-semibold text-xl">Other Settings</h3>
							<Card>
								<CardContent className="space-y-6 pt-6">
									<FormField
										control={form.control}
										name="config.waitTimeMins"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Estimated wait time</FormLabel>
												<FormControl>
													<Input
														type="number"
														{...field}
														placeholder="0"
														min={0}
														step={1}
														onChange={(e) =>
															field.onChange(
																Number.parseInt(e.target.value) || 0,
															)
														}
													/>
												</FormControl>
												<FormDescription>Minutes</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="settings.fulfillmentTypeEnabled"
										render={({ field }) => (
											<FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
												<div className="space-y-1 leading-none">
													<FormLabel>
														Enable menu based on fulfillment type
													</FormLabel>
												</div>
											</FormItem>
										)}
									/>

									<div className="space-y-2">
										<h5 className="text-gray-500 text-sm">Item Level Notes</h5>
										<FormField
											control={form.control}
											name="config.allowItemNotes"
											render={({ field }) => (
												<FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
													<FormControl>
														<Checkbox
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
													<div className="space-y-1 leading-none">
														<FormLabel>Allow Item Level Notes</FormLabel>
													</div>
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="config.itemNotesMaxLength"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														Maximum characters allowed for item level notes
													</FormLabel>
													<FormControl>
														<Input
															type="number"
															{...field}
															min={1}
															step={1}
															onChange={(e) =>
																field.onChange(
																	Number.parseInt(e.target.value) || 0,
																)
															}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="flex justify-end pt-4">
							<Button type="submit">Save Configuration</Button>
						</div>
					</form>
				</Form>
			</div>
		);
	},
};
