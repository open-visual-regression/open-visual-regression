import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";

const meta: Meta<typeof Tabs> = {
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <p className="font-mono text-[11px] text-muted-foreground">{label}</p>
    {children}
  </div>
);

const placeholder = (text: string) => (
  <p className="text-xs text-muted-foreground">{text}</p>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-10 p-6 max-w-md">
      <Section label='variant="default" — horizontal (default)'>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
            <TabsTrigger value="diffs">Diffs</TabsTrigger>
            <TabsTrigger value="settings" disabled>
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-3">
            {placeholder("142 snapshots captured. 0 regressions on branch main.")}
          </TabsContent>
          <TabsContent value="snapshots" className="pt-3">
            {placeholder("Snapshot list goes here.")}
          </TabsContent>
          <TabsContent value="diffs" className="pt-3">
            {placeholder("No diffs to display.")}
          </TabsContent>
        </Tabs>
      </Section>

      <Section label='variant="line" — horizontal'>
        <Tabs defaultValue="all">
          <TabsList variant="line">
            <TabsTrigger value="all">All runs</TabsTrigger>
            <TabsTrigger value="passed">Passed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="pt-3">
            {placeholder("Showing all 38 runs.")}
          </TabsContent>
          <TabsContent value="passed" className="pt-3">
            {placeholder("34 passed runs.")}
          </TabsContent>
          <TabsContent value="failed" className="pt-3">
            {placeholder("4 failed runs.")}
          </TabsContent>
          <TabsContent value="pending" className="pt-3">
            {placeholder("0 pending runs.")}
          </TabsContent>
        </Tabs>
      </Section>

      <Section label='orientation="vertical"'>
        <Tabs defaultValue="overview" orientation="vertical" className="h-28">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
            <TabsTrigger value="diffs">Diffs</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            {placeholder("Run #42 overview.")}
          </TabsContent>
          <TabsContent value="snapshots">
            {placeholder("Snapshot list.")}
          </TabsContent>
          <TabsContent value="diffs">
            {placeholder("No diffs.")}
          </TabsContent>
        </Tabs>
      </Section>
    </div>
  ),
};
