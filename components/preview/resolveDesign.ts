import type { Design } from '@/types/design';

export function resolveDesign(design: Design, bindings?: Record<string, string>): Design {
  if (!bindings) return design;
  const resolve = (value: string) => value.replace(/\{\{([a-z][a-z0-9-]{1,59}\.[a-z][a-z0-9_]{0,39})\}\}/g, (_, key: string) => bindings[key] ?? `{{${key}}}`);
  const resolveImage = (value: string) => {
    const output = resolve(value);
    return /^\{\{.+\}\}$/.test(output) ? '' : output;
  };
  return {
    ...design,
    heroTitle: resolve(design.heroTitle),
    heroBody: resolve(design.heroBody),
    heroImage: resolveImage(design.heroImage),
    buttonLabel: resolve(design.buttonLabel),
    footerTagline: resolve(design.footerTagline || ''),
    sections: design.sections.map(section => ({ ...section, title: resolve(section.title), body: resolve(section.body), image: section.image ? resolveImage(section.image) : section.image })),
  };
}
