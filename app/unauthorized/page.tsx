import Link from "next/link";
import LogoutButton from "@/app/logout-button";

export default function UnauthorizedPage() {
  return (
    <main className="message-page">
      <section className="message-card">
        <p className="eyebrow">Access denied</p>
        <h1>This account is not a superadmin.</h1>
        <p>Your Google login is valid, but your database profile does not have administrative access.</p>
        <div className="button-row"><LogoutButton /><Link className="primary-button" href="/login">Try another account</Link></div>
      </section>
    </main>
  );
}
