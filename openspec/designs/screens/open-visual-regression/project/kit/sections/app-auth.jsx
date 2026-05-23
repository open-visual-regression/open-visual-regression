/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   SetupScreen, LoginScreen, InviteScreen */

const AUTH_W = 720, AUTH_H = 720;

function App() {
  return (
    <DesignCanvas>
      <DCSection id="auth" title="onboarding & auth" subtitle="first-run setup → login → invite-only registration. dark, centered cards. no public signup.">
        <DCArtboard id="setup" label="/setup · first-run wizard" width={AUTH_W} height={AUTH_H}>
          <SetupScreen />
        </DCArtboard>
        <DCArtboard id="login" label="/login · default" width={AUTH_W} height={AUTH_H}>
          <LoginScreen />
        </DCArtboard>
        <DCArtboard id="login-error" label="/login · invalid credentials" width={AUTH_W} height={AUTH_H}>
          <LoginScreen error />
        </DCArtboard>
        <DCArtboard id="invite-valid" label="/invite/[id] · valid token" width={AUTH_W} height={AUTH_H}>
          <InviteScreen state="valid" />
        </DCArtboard>
        <DCArtboard id="invite-expired" label="/invite/[id] · expired" width={AUTH_W} height={AUTH_H}>
          <InviteScreen state="expired" />
        </DCArtboard>
        <DCArtboard id="invite-used" label="/invite/[id] · already used" width={AUTH_W} height={AUTH_H}>
          <InviteScreen state="used" />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
