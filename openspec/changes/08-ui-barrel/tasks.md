# 08 · UI barrel exports

Gate: `import { Badge, KeyHint, DiffStrip, OvrMark, SegmentedProgress, Icon, StatusIcon, StatusKind } from "@ovr/ui"` resolves with correct types; `pnpm --filter @ovr/ui build-storybook` exits 0.

- [ ] 1.1 Update `packages/ui/src/index.ts` to export every component and type:
  - Existing: Button, buttonVariants, Typography, typographyVariants, Field, FieldSet, FieldGroup, FieldLabel, FieldError, FieldDescription, FieldContent, FieldTitle, FieldLegend, FieldSeparator, Alert, AlertTitle, AlertDescription, AlertAction, Toast, ToastContainer, toastVariants, Spinner, Input, Label, Textarea, Select, Checkbox, Switch, Tabs, TabsList, TabsTrigger, TabsContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption, Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription, Separator, Popover, PopoverTrigger, PopoverContent, Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, AspectRatio
  - New: Icon, StatusIcon, StatusKind, Badge, KeyHint, DiffStrip, OvrMark, SegmentedProgress
- [ ] 1.2 Run `pnpm --filter @ovr/ui check-types`; fix any type errors in the barrel or components
- [ ] 1.3 Run `pnpm --filter @ovr/ui build-storybook`; confirm exits 0
