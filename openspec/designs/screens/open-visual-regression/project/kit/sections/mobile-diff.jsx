/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   MDiffScreen, MDiffNoBaselineScreen, MDiffRenderErrorScreen */

const W = 375, H = 812;

function App() {
  return (
    <DesignCanvas>
      <DCSection id="diff-mobile" title="diff · mobile" subtitle="tab-switched (baseline / current / overlay / slider). sticky bottom approve+reject bar.">
        <DCArtboard id="side" label="diff · current tab" width={W} height={H}><MDiffScreen /></DCArtboard>
        <DCArtboard id="no-baseline" label="no baseline" width={W} height={H}><MDiffNoBaselineScreen /></DCArtboard>
        <DCArtboard id="render-error" label="render error + logs" width={W} height={H}><MDiffRenderErrorScreen /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
