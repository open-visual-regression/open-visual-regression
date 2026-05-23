/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   MRunsScreen, MRunDetailScreen, MPendingBuildScreen, MBuildErrorScreen */

const W = 375, H = 812;

function App() {
  return (
    <DesignCanvas>
      <DCSection id="builds-mobile" title="builds · mobile" subtitle="list as stacked cards, snapshot grid as thumb+meta rows, polling state condensed.">
        <DCArtboard id="runs-list" label="builds list" width={W} height={H}><MRunsScreen /></DCArtboard>
        <DCArtboard id="run-detail" label="build detail · snapshots" width={W} height={H}><MRunDetailScreen /></DCArtboard>
        <DCArtboard id="run-detail-toast" label="build detail · approve toast" width={W} height={H}><MRunDetailScreen withToast /></DCArtboard>
        <DCArtboard id="pending" label="pending · polling" width={W} height={H}><MPendingBuildScreen /></DCArtboard>
        <DCArtboard id="error" label="error · retries exhausted" width={W} height={H}><MBuildErrorScreen /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
