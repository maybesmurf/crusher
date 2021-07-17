import React from "react";
import { css } from '@emotion/react';

export interface LogoProps {
	/**
	 * Emotion CSS style if any
	 */
	css?: [string] | string;
	/**
	 * Optional click handler
	 */
	onClick?: () => void;
	url:string;
}

const UserDefaultProps = {
};

/**
 * Crusher Logo component.
 */
export const UserImage: React.FC<LogoProps> = ({url, ...props }) => {
	return (
		<div css={userImage}>
			<div className={'relative'}>
				<img src={url} height={'20px'} />
				<div css={dotCSS}></div>
			</div>
		</div>
	)

};

UserImage.defaultProps = UserDefaultProps;
const userImage = css`

		padding: 6rem 16rem 5rem;
		:hover{
      background: #202429;
      border-radius: 4px;
		}

	 img{
     border-radius: 200rem;
		 height: 22rem ;
		 margin-top: -2rem;
	 }
	`

const dotCSS = css`
	position: absolute;
	background: #7DDA6E;
	right: 1.2px;
	bottom: .4px;
	
	width: 6px;
	height: 6px;
	border-radius: 100px;
	border: 1px solid #f8f8f8;
`