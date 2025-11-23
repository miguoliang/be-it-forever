# Qute Template Guide

This document explains how to use Qute templates in the English Learning application.

## Overview

Qute is Quarkus's reactive template engine that provides:
- **Fully Reactive**: No blocking I/O, async rendering
- **Type-Safe**: Compile-time checking with `@TemplateData`
- **Fast**: Optimized for performance
- **Developer-Friendly**: Hot reload in dev mode

## Template Format

Templates use the `qute` format and are stored in the database with `format='qute'`.

## Basic Syntax

### Variables
Access variables using curly braces:
```html
<h1>{name}</h1>
<p>{description}</p>
<p>Code: {code}</p>
```

### Nested Properties
Access nested properties with dot notation:
```html
<p>Level: {metadata.level}</p>
```

### Conditionals
Use `{#if}` for conditions:
```html
{#if description.isNotBlank}
  <p>{description}</p>
{#else}
  <p>No description available</p>
{/if}
```

### Loops
Use `{#for}` to iterate over lists:
```html
<ul>
{#for item in relatedKnowledge}
  <li>{item.name}: {item.description}</li>
{/for}
</ul>
```

Check if list is empty:
```html
{#if relatedKnowledge.isNotEmpty}
  <h3>Related Knowledge</h3>
  <ul>
  {#for item in relatedKnowledge}
    <li>{item.name}</li>
  {/for}
  </ul>
{/if}
```

## Available Data in Templates

### Main Knowledge Object
- `{name}` - Knowledge name (String)
- `{description}` - Knowledge description (String)
- `{code}` - Knowledge code (String, e.g., "ST-0000001")
- `{metadata}` - Metadata object

### Metadata Object
- `{metadata.level}` - Level information (String or null)

### Related Knowledge List
- `{relatedKnowledge}` - List of related knowledge items
- Each item has: `{item.code}`, `{item.name}`, `{item.description}`, `{item.metadata}`

## Template Extensions

Extensions add useful methods to common types:

### String Extensions
```html
<!-- Truncate long text -->
{description.truncate(100)}

<!-- Capitalize -->
{name.capitalize}

<!-- Upper/lower case -->
{name.upper}
{name.lower}

<!-- Check if blank -->
{#if description.isNotBlank}
  {description}
{/if}
```

### List Extensions
```html
<!-- Check if empty -->
{#if relatedKnowledge.isEmpty}
  <p>No related items</p>
{/if}

<!-- Get size -->
<p>Count: {relatedKnowledge.size}</p>

<!-- Get first/last -->
{relatedKnowledge.firstOrNull.name}
{relatedKnowledge.lastOrNull.name}
```

## Global Namespace Functions

Global functions are available via namespaces:

### String Namespace (`str:`)
```html
<!-- Default value if null/empty -->
{str:orDefault(description, 'No description')}

<!-- Join list with separator -->
{str:join(tags, ', ')}

<!-- Repeat string -->
{str:repeat('*', 5)}

<!-- Contains (case-insensitive) -->
{#if str:contains(name, 'test')}
  Contains 'test'
{/if}
```

### Math Namespace (`math:`)
```html
<!-- Max/Min -->
{math:max(score1, score2)}
{math:min(score1, score2)}

<!-- Round to decimal places -->
{math:round(3.14159, 2)}

<!-- Calculate percentage -->
{math:percent(25, 100)}
```

### Collection Namespace (`coll:`)
```html
<!-- Check contains -->
{#if coll:contains(myList, item)}
  List contains item
{/if}

<!-- Get size -->
{coll:size(myList)}

<!-- Create range -->
{#for i in coll:range(1, 5)}
  {i}
{/for}
```

### Conditional Namespace (`cond:`)
```html
<!-- Ternary operator -->
{cond:ifElse(isActive, 'Active', 'Inactive')}

<!-- Null checks -->
{#if cond:isNotNull(description)}
  {description}
{/if}
```

## Example Templates

### Basic Card Front Template
```html
<div class="card-front">
  <h2>{name.capitalize}</h2>
  {#if description.isNotBlank}
    <p>{description.truncate(150)}</p>
  {/if}
  {#if metadata.level}
    <span class="level">Level: {metadata.level}</span>
  {/if}
</div>
```

### Card Back Template with Related Items
```html
<div class="card-back">
  <h3>Full Description</h3>
  <p>{str:orDefault(description, 'No description available')}</p>

  {#if relatedKnowledge.isNotEmpty}
    <h4>Related Concepts ({relatedKnowledge.size})</h4>
    <ul>
    {#for item in relatedKnowledge}
      <li>
        <strong>{item.name}</strong>
        {#if item.description.isNotBlank}
          - {item.description.truncate(80)}
        {/if}
      </li>
    {/for}
    </ul>
  {/if}
</div>
```

### Advanced Template with Conditionals
```html
<div class="knowledge-card">
  <header>
    <h1>{name.upper}</h1>
    <code>{code}</code>
  </header>

  <section class="content">
    {#if description.isNotBlank}
      <div class="description">
        {description}
      </div>
    {#else}
      <div class="no-description">
        <em>No description provided</em>
      </div>
    {/if}
  </section>

  {#if metadata.level}
    <div class="metadata">
      <span class="badge">Level: {metadata.level}</span>
    </div>
  {/if}

  {#if relatedKnowledge.isNotEmpty}
    <aside class="related">
      <h3>Related ({relatedKnowledge.size})</h3>
      <div class="related-grid">
        {#for item in relatedKnowledge}
          <div class="related-item">
            <h4>{item.name}</h4>
            <p>{item.description.truncate(100)}</p>
          </div>
        {/for}
      </div>
    </aside>
  {/if}
</div>
```

## Configuration

Qute is configured in `application.properties`:

```properties
# Strict rendering - fail on undefined variables
quarkus.qute.strict-rendering=true

# Property not found strategy
quarkus.qute.property-not-found-strategy=throw-exception

# Timeout for async rendering (10 seconds)
quarkus.qute.timeout=10000

# Dev mode - hot reload every 1 second
%dev.quarkus.qute.dev-mode.check-interval=1s
```

## Type Safety

Templates are type-checked at compile time using `@TemplateData` annotations.

The data model is defined in `CardRenderData`:
- Provides IDE auto-completion
- Compile-time error checking
- Better refactoring support

## Migration from FreeMarker

| FreeMarker | Qute |
|------------|------|
| `${name}` | `{name}` |
| `${metadata.level}` | `{metadata.level}` |
| `<#if condition>...</#if>` | `{#if condition}...{/if}` |
| `<#list items as item>...</#list>` | `{#for item in items}...{/for}` |
| `${name?cap_first}` | `{name.capitalize}` |
| `${text?upper_case}` | `{text.upper}` |

## Performance Tips

1. **Use Type-Safe Templates**: Better performance and compile-time checking
2. **Avoid Complex Logic**: Keep templates simple, move logic to services
3. **Cache Template Results**: If rendering the same data repeatedly
4. **Use Extensions**: Built-in extensions are optimized

## Debugging

### Dev Mode
- Templates auto-reload every second
- Undefined variables show the original expression
- Check console for template errors

### Production Mode
- Strict rendering enabled
- Throws exceptions on undefined variables
- Templates are pre-compiled for performance

## Resources

- [Qute Reference Guide](https://quarkus.io/guides/qute-reference)
- [Qute Type-Safe Templates](https://quarkus.io/guides/qute-reference#typesafe_templates)
- [Template Extensions](https://quarkus.io/guides/qute-reference#template_extension_methods)
