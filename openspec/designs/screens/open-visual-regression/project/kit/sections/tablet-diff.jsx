/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   TDiffScreen, TDiffNoBaselineScreen, TDiffRenderErrorScreen */

const W = 768, H = 1024;

function App() {
  return (
    <DesignCanvas>
      <DCSection id="diff-tablet" title="diff · tablet" subtitle="side-by-side stays. on the render-error view, logs collapse below the canvas instead of beside it.">
        <DCArtboard id="side" label="diff · side-by-side" width={W} height={H}><TDiffScreen /></DCArtboard>
        <DCArtboard id="no-baseline" label="diff · no baseline" width={W} height={H}><TDiffNoBaselineScreen /></DCArtboard>
        <DCArtboard id="render-error" label="diff · render error + stacked logs" width={W} height={H}><TDiffRenderErrorScreen /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
