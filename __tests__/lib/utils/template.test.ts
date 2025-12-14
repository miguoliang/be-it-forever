import { renderTemplate } from '@/lib/utils/template';

describe('renderTemplate', () => {
  const mockData = {
    name: 'Hello',
    description: 'World',
    metadata: {
      tags: ['test', 'unit']
    }
  };

  it('should render simple string template', () => {
    const template = '<h1>{{name}}</h1>';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('<h1>Hello</h1>');
  });

  it('should render template with nested data', () => {
    const template = '<p>{{metadata.tags.[0]}}</p>';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('<p>test</p>');
  });

  it('should handle conditional logic', () => {
    const template = '{{#if description}}<p>{{description}}</p>{{/if}}';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('<p>World</p>');
  });

  it('should return empty string for empty template', () => {
    const result = renderTemplate('', mockData);
    expect(result).toBe('');
  });

  it('should sanitize dangerous HTML', () => {
    const dangerousData = {
      name: '<script>alert("xss")</script>Hello'
    };
    const template = '<div>{{{name}}}</div>'; // Triple braces for unescaped HTML
    const result = renderTemplate(template, dangerousData);
    // DOMPurify should remove the script tag
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });

  it('should handle invalid template gracefully', () => {
    const template = '{{#if unclosed}}';
    const result = renderTemplate(template, mockData);
    expect(result).toContain('Error rendering template');
    expect(result).toContain('class="p-4 text-red-500');
  });
});
