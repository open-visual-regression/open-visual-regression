/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   SetupScreen, LoginScreen, InviteScreen */
// Tablet auth — auth has no chrome, desktop cards adapt cleanly to 768.

const W = 768, H = 1024;

function App() {
  return (
    <DesignCanvas>
      <DCSection id="auth-tablet" title="auth · tablet" subtitle="centered cards on a 768×1024 viewport. same composition as desktop, just more vertical breathing room.">
        <DCArtboard id="setup" label="/setup" width={W} height={H}><SetupScreen /></DCArtboard>
        <DCArtboard id="login" label="/login" width={W} height={H}><LoginScreen /></DCArtboard>
        <DCArtboard id="login-error" label="/login · error" width={W} height={H}><LoginScreen error /></DCArtboard>
        <DCArtboard id="invite-valid" label="/invite · valid" width={W} height={H}><InviteScreen state="valid" /></DCArtboard>
        <DCArtboard id="invite-expired" label="/invite · expired" width={W} height={H}><InviteScreen state="expired" /></DCArtboard>
        <DCArtboard id="invite-used" label="/invite · used" width={W} height={H}><InviteScreen state="used" /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
