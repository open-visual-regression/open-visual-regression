/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   TRunsScreen, TRunDetailScreen, TPendingBuildScreen, TBuildErrorScreen */

const W = 768, H = 1024;

function App() {
  return (
    <DesignCanvas>
      <DCSection id="builds-tablet" title="builds · tablet" subtitle="runs list & detail with snapshot grid (2-col), pending stats in 2×2, error states full-width.">
        <DCArtboard id="runs-list" label="builds list" width={W} height={H}><TRunsScreen /></DCArtboard>
        <DCArtboard id="run-detail" label="build detail · snapshot grid (2-col)" width={W} height={H}><TRunDetailScreen /></DCArtboard>
        <DCArtboard id="run-detail-toast" label="build detail · approve toast" width={W} height={H}><TRunDetailScreen withToast /></DCArtboard>
        <DCArtboard id="pending" label="pending · polling" width={W} height={H}><TPendingBuildScreen /></DCArtboard>
        <DCArtboard id="error" label="error · retries exhausted" width={W} height={H}><TBuildErrorScreen /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
