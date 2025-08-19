import { cn } from "@/lib/utils";
import React from "react";
import type { Components } from "react-markdown";

type Tag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

/**
 * Factory that returns a renderer for a given heading tag + classes.
 * Ensures headings pick up your theme colors via `text-foreground`.
 */
export const HeadingRenderer =
	(tag: Tag, extra?: string): Components[Tag] =>
	({ node, children, ...props }) =>
		React.createElement(
			tag,
			{
				...props,
				className: cn("text-foreground scroll-m-20", extra, props.className),
			},
			children,
		);
