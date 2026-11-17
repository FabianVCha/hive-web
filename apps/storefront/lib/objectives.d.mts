export type ObjectiveItem = { slug: string; quantity: number };
export function selectionResult(cart: ObjectiveItem[], selection: ObjectiveItem[], products: { slug: string; name?: string }[]): { cart: ObjectiveItem[]; added: number; requested: number; limited: string[]; message: string };
export function restoreObjectiveDraft(raw: string | null, objectives: Objective[], products: { slug: string }[]): { selected: string; items: ObjectiveItem[] };
export function parseQuantity(value: string | number): number | null;
export type Objective = { id: string; title: string; description: string; image: string; items: ObjectiveItem[] };
export function objectiveItems(objective: Pick<Objective, "items"> | undefined, products: { slug: string }[]): ObjectiveItem[];
export function mergeSelection(cart: ObjectiveItem[], selection: ObjectiveItem[], products: { slug: string }[]): ObjectiveItem[];
