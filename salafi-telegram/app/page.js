export default function Home() {
  return (
    <main style={{
      fontFamily: 'sans-serif',
      maxWidth: '500px',
      margin: '80px auto',
      textAlign: 'center',
      padding: '0 20px'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>🕌</h1>
      <h2 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Salafi Telegram Bot</h2>
      <p style={{ color: '#666' }}>
        Ce service envoie automatiquement chaque jour :
      </p>
      <ul style={{ textAlign: 'left', marginTop: '20px', lineHeight: '2' }}>
        <li>📖 Un verset du Coran à <strong>6h00</strong></li>
        <li>🎓 Une vidéo fatawa salafi à <strong>17h00</strong></li>
      </ul>
      <p style={{ marginTop: '30px', color: '#999', fontSize: '0.85rem' }}>
        Système automatique — aucune intervention requise.
      </p>
    </main>
  );
}
