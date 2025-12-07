import Link from "next/link";

export default function Custom500() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>500</h1>
      <p style={{ fontSize: '24px', marginBottom: '32px' }}>Internal Server Error</p>
      <Link href="/boards" style={{
        padding: '12px 24px',
        backgroundColor: '#0070f3',
        color: 'white',
        borderRadius: '8px',
        textDecoration: 'none'
      }}>
        Go to Boards
      </Link>
    </div>
  );
}
