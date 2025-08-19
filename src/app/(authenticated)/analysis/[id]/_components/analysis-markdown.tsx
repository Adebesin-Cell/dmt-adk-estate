"use client";

import { cn } from "@/lib/utils";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { HeadingRenderer } from "./heading-renderer";

type Props = {
	markdown: string;
	className?: string;
};

export function AnalysisMarkdown({ markdown, className }: Props) {
	return (
		<ReactMarkdown
			className={cn(
				"prose max-w-6xl",
				"prose-headings:text-foreground prose-p:text-muted-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-hr:border-border",
				"prose-a:text-primary prose-a:no-underline hover:prose-a:underline underline-offset-2",
				"prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
				"prose-pre:bg-muted prose-pre:text-foreground prose-pre:border prose-pre:border-border prose-pre:rounded-lg",
				"prose-blockquote:text-muted-foreground prose-blockquote:border-l-4 prose-blockquote:border-border",
				"[&_table]:w-full [&_table]:table-fixed [&_table]:max-w-full [&_table]:block [&_table-wrapper]:overflow-x-auto",
				"[&_th]:align-top [&_th]:text-muted-foreground [&_td]:border-b [&_td]:border-border [&_td:first-child]:py-2",
				"dark:prose-invert",
				className,
			)}
			remarkPlugins={[remarkGfm]}
			components={{
				h1: HeadingRenderer(
					"h1",
					"scroll-m-20 text-2xl font-bold tracking-tight text-2xl",
				),
				h2: HeadingRenderer(
					"h2",
					"scroll-m-20 border-b pb-2 text-xl font-semibold tracking-tight first:mt-0",
				),
				h3: HeadingRenderer(
					"h3",
					"scroll-m-20 text-lg font-semibold tracking-tight",
				),
				h4: HeadingRenderer(
					"h4",
					"scroll-m-20 text-md font-semibold tracking-tight",
				),
				h5: HeadingRenderer(
					"h5",
					"scroll-m-20 text-base font-semibold tracking-tight",
				),
				h6: HeadingRenderer(
					"h6",
					"scroll-m-20 text-sm font-semibold tracking-tight",
				),
				p: ({ node, ...props }) => (
					<p
						{...props}
						className={cn("leading-relaxed my-4", props.className)}
					/>
				),
				a: ({ node, ...props }) => (
					<a {...props} className={cn("text-primary", props.className)} />
				),
				ul: ({ node, ...props }) => (
					<ul
						{...props}
						className={cn("list-disc pl-6 space-y-2 my-4", props.className)}
					/>
				),
				ol: ({ node, ...props }) => (
					<ol
						{...props}
						className={cn("list-decimal pl-6 space-y-2 my-4", props.className)}
					/>
				),
				li: ({ node, ...props }) => (
					<li {...props} className={cn("", props.className)} />
				),

				div: ({ node, ...props }) => (
					<div {...props} className={cn("break-words", props.className)} />
				),
			}}
		>
			{markdown}
		</ReactMarkdown>
	);
}
