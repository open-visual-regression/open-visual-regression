/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   MSetupScreen, MLoginScreen, MInviteScreen */

const W = 375, H = 812;

function App() {
  return (
    <DesignCanvas>
      <DCSection id="auth-mobile" title="auth · mobile" subtitle="centered cards, full-width buttons, 375×812 viewport.">
        <DCArtboard id="setup" label="/setup" width={W} height={H}><MSetupScreen /></DCArtboard>
        <DCArtboard id="login" label="/login" width={W} height={H}><MLoginScreen /></DCArtboard>
        <DCArtboard id="login-error" label="/login · error" width={W} height={H}><MLoginScreen error /></DCArtboard>
        <DCArtboard id="invite-valid" label="/invite · valid" width={W} height={H}><MInviteScreen state="valid" /></DCArtboard>
        <DCArtboard id="invite-expired" label="/invite · expired" width={W} height={H}><MInviteScreen state="expired" /></DCArtboard>
        <DCArtboard id="invite-used" label="/invite · used" width={W} height={H}><MInviteScreen state="used" /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
