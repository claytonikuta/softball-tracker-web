import React, { ReactNode } from "react";

interface SafeRenderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

class SafeRender extends React.Component<SafeRenderProps> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Caught render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div>Something went wrong rendering this component.</div>
        )
      );
    }

    return this.props.children;
  }
}

export default SafeRender;
