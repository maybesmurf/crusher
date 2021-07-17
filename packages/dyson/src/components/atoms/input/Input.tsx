import React from "react";
import { css } from '@emotion/react';

export interface ButtonProps {
	/**
	 * Size of the component
	 */
	size?: "small" | "medium" | "large";

	/**
	 * Is error
	 */
	isError?: boolean;


	/**
	 * Disabled;
	 */
	disabled?: boolean;
	/**
	 * Emotion CSS style if any
	 */
	css?: [string] | string;

	className?: string;
}

/**
 * Unified button component for Dyson UI system
 */
export const Input: React.FC<ButtonProps> = ({
																							 size = "medium",
	isError=false,
																							 children,
																							 className, ...props }) => {
	return (
		<input css={[inputBox, isError && errorState ]} {...props} className={`${className}`}/>
	);
}

const inputBox = css`
	width: 348rem;
	background: linear-gradient(0deg, #0e1012, #0e1012);
	border: 1px solid #2a2e38;
	box-sizing: border-box;
	border-radius: 4px;
	height: 46rem;
	padding-top: 5rem;
	font-size: 14rem;
	padding-left: 16rem;
	color: #fff;
	
	:focus{
		border-color: #6893E7;
	}
`;

const errorState = css`

  border-color: #ff4583;;
	`