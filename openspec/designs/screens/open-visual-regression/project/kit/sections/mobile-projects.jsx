/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   MProjectsScreen, MProjectsEmptyScreen, MNewProjectScreen, MProjectSettingsScreen, MDeleteProjectScreen */

const W = 375, H = 812;

function App() {
  return (
    <DesignCanvas>
      <DCSection id="projects-mobile" title="projects · mobile" subtitle="list / empty / new / settings / delete. stacked cards, single-column forms.">
        <DCArtboard id="list" label="projects list" width={W} height={H}><MProjectsScreen /></DCArtboard>
        <DCArtboard id="empty" label="empty instance" width={W} height={H}><MProjectsEmptyScreen /></DCArtboard>
        <DCArtboard id="new" label="/projects/new" width={W} height={H}><MNewProjectScreen /></DCArtboard>
        <DCArtboard id="new-conflict" label="/projects/new · slug taken" width={W} height={H}><MNewProjectScreen slugTaken /></DCArtboard>
        <DCArtboard id="settings" label="settings · variants" width={W} height={H}><MProjectSettingsScreen /></DCArtboard>
        <DCArtboard id="settings-saved" label="settings · saved toast" width={W} height={H}><MProjectSettingsScreen withSavedToast /></DCArtboard>
        <DCArtboard id="delete" label="delete confirm" width={W} height={H}><MDeleteProjectScreen /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
