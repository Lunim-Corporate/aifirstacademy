import * as React from "react";
import { Link as RouterLink, useInRouterContext } from "react-router-dom";

type Props = {
  to: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLElement>;
};

export default function SafeLink(props: Props) {
  const inRouter = useInRouterContext();
  if (inRouter) {
    return <RouterLink to={props.to} className={props.className} onClick={props.onClick}>{props.children}</RouterLink>;
  }
  return <a href={props.to} className={props.className} onClick={props.onClick}>{props.children}</a>;
}
