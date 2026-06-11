const SplashScreen = () => (
  <div className="splash-screen">
    <div className="splash-logo">🧠</div>
    <div className="splash-title">Mind Match</div>
    <div className="splash-loader">
      <div className="splash-loader-fill" />
    </div>
    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginTop: '-16px' }}>
      Powering AI cognitive engine…
    </p>
  </div>
)

export default SplashScreen
