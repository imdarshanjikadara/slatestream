import { Link } from "react-router-dom";
import { EmptyState } from "@/components/common";

export default function NotFound() {
  return <div className="card"><EmptyState title="This page does not exist" hint="The link may be old or mistyped." action={<Link to="/" className="btn btn-sm">Go to the overview</Link>} /></div>;
}
