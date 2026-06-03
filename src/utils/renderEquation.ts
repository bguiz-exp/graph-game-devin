/**
 * Render an equation label from a template string containing `{name}`
 * placeholders. When `values` is provided, each placeholder is replaced by its
 * coefficient value; otherwise placeholders become blanks ("_").
 *
 *   renderEquation("y = {m}x + {c}")            -> "y = _x + _"
 *   renderEquation("y = {m}x + {c}", {m:2,c:-3}) -> "y = 2x + -3"
 */
export function renderEquation(
  templateLabel: string,
  values?: Record<string, number>,
): string {
  return templateLabel.replace(/\{(\w+)\}/g, (_match, name: string) => {
    if (values && name in values) return String(values[name]);
    return "_";
  });
}
