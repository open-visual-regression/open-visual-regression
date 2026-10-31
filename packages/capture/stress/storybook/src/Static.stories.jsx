import { Article, Button, CardGrid, Form, SvgChart, Table } from "./Components";

export default { title: "Static" };

export const ButtonPrimary = { render: () => <Button label="Save" /> };
export const ButtonSecondary = { render: () => <Button label="Cancel" secondary /> };
export const FormSmall = { render: () => <Form fields={3} /> };
export const FormLarge = { render: () => <Form fields={12} /> };
export const Cards6 = { render: () => <CardGrid count={6} /> };
export const Cards24 = { render: () => <CardGrid count={24} /> };
export const Table20 = { render: () => <Table rows={20} /> };
export const Table150 = { render: () => <Table rows={150} /> };
export const ArticleShort = { render: () => <Article paragraphs={3} /> };
export const ArticleLong = { render: () => <Article paragraphs={30} /> };
export const LineChartSvg = { render: () => <SvgChart points={40} /> };
