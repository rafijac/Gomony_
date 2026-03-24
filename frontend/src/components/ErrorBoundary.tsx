import React from 'react';
import Notification from './Notification';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    // Optionally log error
    // console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Notification
          message="Something went wrong."
          type="error"
          details={this.state.error?.message + (this.state.errorInfo ? '\n' + this.state.errorInfo.componentStack : '')}
        />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
