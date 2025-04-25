import React, { ReactNode } from "react";
import styles from "./Layout.module.css";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className={styles.app}>
      <div className={styles.appContainer}>{children}</div>
    </div>
  );
};

export default Layout;
