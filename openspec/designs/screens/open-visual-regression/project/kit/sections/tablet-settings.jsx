/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   TUsersScreen, TInviteModalScreen, TApiKeysScreen */

const W = 768, H = 1024;

function App() {
  return (
    <DesignCanvas>
      <DCSection id="settings-tablet" title="users & settings · tablet" subtitle="users list, invitations, and API keys collapse to single-column rows but keep their table shape.">
        <DCArtboard id="users" label="users · list" width={W} height={H}><TUsersScreen /></DCArtboard>
        <DCArtboard id="users-with-url" label="users · invite URL banner" width={W} height={H}><TUsersScreen withInviteUrl /></DCArtboard>
        <DCArtboard id="users-invite-modal" label="users · invite modal" width={W} height={H}><TInviteModalScreen /></DCArtboard>
        <DCArtboard id="api-keys" label="api keys · list" width={W} height={H}><TApiKeysScreen /></DCArtboard>
        <DCArtboard id="api-keys-reveal" label="api keys · reveal-once" width={W} height={H}><TApiKeysScreen withReveal /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
