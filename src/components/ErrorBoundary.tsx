import { Component } from "react";
import { EmptyState } from "./common";

/** Keeps one broken page from taking down the whole app; the sidebar stays usable. */
export class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) return <div className="card"><EmptyState title="This page could not be shown" hint={this.state.error.message} action={<button className="btn btn-sm" onClick={() => this.setState({ error: null })}>Try again</button>} /></div>;
    return this.props.children;
  }
}
