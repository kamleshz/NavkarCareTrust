import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <p><strong>NavkarCareTrust</strong> · Helping families find cancer care and support in India.</p>
        <div className="footer-links">
          <Link href="/support">Support directory</Link>
          <Link href="/register">For patients</Link>
          <Link href="/register/organisation">For organisations</Link>
        </div>
      </div>
    </footer>
  );
}
