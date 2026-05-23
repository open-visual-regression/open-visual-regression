/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   TProjectsScreen, TProjectsEmptyScreen, TNewProjectScreen, TProjectSettingsScreen, TDeleteProjectScreen */

const W = 768, H = 1024;

function App() {
  return (
    <DesignCanvas>
      <DCSection id="projects-tablet" title="projects · tablet" subtitle="icon-only sidebar, single-column forms, condensed action toolbar.">
        <DCArtboard id="list" label="projects list" width={W} height={H}><TProjectsScreen /></DCArtboard>
        <DCArtboard id="empty" label="empty instance" width={W} height={H}><TProjectsEmptyScreen /></DCArtboard>
        <DCArtboard id="new" label="/projects/new" width={W} height={H}><TNewProjectScreen /></DCArtboard>
        <DCArtboard id="new-conflict" label="/projects/new · slug taken" width={W} height={H}><TNewProjectScreen slugTaken /></DCArtboard>
        <DCArtboard id="settings" label="settings · variants" width={W} height={H}><TProjectSettingsScreen /></DCArtboard>
        <DCArtboard id="settings-saved" label="settings · saved toast" width={W} height={H}><TProjectSettingsScreen withSavedToast /></DCArtboard>
        <DCArtboard id="delete" label="delete confirm" width={W} height={H}><TDeleteProjectScreen /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
