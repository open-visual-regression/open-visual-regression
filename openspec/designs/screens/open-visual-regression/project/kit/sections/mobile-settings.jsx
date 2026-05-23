/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   MSettingsIndexScreen, MUsersScreen, MInviteSheet, MApiKeysScreen */

const W = 375, H = 812;

function App() {
  return (
    <DesignCanvas>
      <DCSection id="settings-mobile" title="users & settings · mobile" subtitle="settings is a drillable list. invite modal becomes a bottom sheet. reveal-once stays.">
        <DCArtboard id="index" label="settings · index" width={W} height={H}><MSettingsIndexScreen /></DCArtboard>
        <DCArtboard id="users" label="users · list" width={W} height={H}><MUsersScreen /></DCArtboard>
        <DCArtboard id="users-with-url" label="users · invite URL banner" width={W} height={H}><MUsersScreen withInviteUrl /></DCArtboard>
        <DCArtboard id="invite-sheet" label="users · invite bottom sheet" width={W} height={H}><MInviteSheet /></DCArtboard>
        <DCArtboard id="api-keys" label="api keys · list" width={W} height={H}><MApiKeysScreen /></DCArtboard>
        <DCArtboard id="api-keys-reveal" label="api keys · reveal-once" width={W} height={H}><MApiKeysScreen withReveal /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
