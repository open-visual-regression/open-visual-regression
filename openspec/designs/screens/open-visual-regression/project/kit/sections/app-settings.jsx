/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   UsersScreen, InviteModalScreen, ApiKeysScreen */

const APP_W = 1280, APP_H = 800;

function App() {
  return (
    <DesignCanvas>
      <DCSection id="settings" title="users & settings" subtitle="admin user management, invitations, and personal API keys for the CLI.">
        <DCArtboard id="users" label="/admin/users · list" width={APP_W} height={APP_H}>
          <UsersScreen />
        </DCArtboard>
        <DCArtboard id="users-with-url" label="/admin/users · just-created invite URL banner" width={APP_W} height={APP_H}>
          <UsersScreen withInviteUrl />
        </DCArtboard>
        <DCArtboard id="users-invite-modal" label="/admin/users · invite modal" width={APP_W} height={APP_H}>
          <InviteModalScreen />
        </DCArtboard>
        <DCArtboard id="apikeys" label="/settings/api-keys · list" width={APP_W} height={APP_H}>
          <ApiKeysScreen />
        </DCArtboard>
        <DCArtboard id="apikeys-reveal" label="/settings/api-keys · reveal-once after create" width={APP_W} height={APP_H}>
          <ApiKeysScreen withReveal />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
