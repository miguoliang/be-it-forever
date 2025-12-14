-- Insert default templates
INSERT INTO public.templates (code, name, description, format, content)
VALUES 
(
    'ST-0000001', 
    'Standard Front', 
    'Standard front side with large text and audio buttons', 
    'html',
    '<div class="flex flex-col items-center justify-center h-full">
  <h2 class="text-8xl font-bold mb-8">{{name}}</h2>
  <div class="flex gap-4 mb-8">
    <button class="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:scale-110 transition" onclick="window.speak(''{{name}}'', ''en-US'')">US Speaker</button>
    <button class="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:scale-110 transition" onclick="window.speak(''{{name}}'', ''en-GB'')">UK Speaker</button>
  </div>
  <p class="text-2xl text-muted-foreground">Click or swipe to see answer</p>
</div>'
),
(
    'ST-0000002', 
    'Standard Back', 
    'Standard back side with definition', 
    'html',
    '<div class="flex flex-col items-center justify-center h-full">
  <div class="flex items-center gap-6 mb-8">
    <p class="text-7xl font-bold text-primary text-center">{{description}}</p>
  </div>
  {{#if metadata.phonetic}}
  <p class="text-3xl text-muted-foreground mb-4">/{{metadata.phonetic}}/</p>
  {{/if}}
  <p class="text-xl text-muted-foreground">Please rate this card</p>
</div>'
)
ON CONFLICT (code) DO UPDATE 
SET content = EXCLUDED.content, 
    updated_at = NOW();

-- Link templates to Card Type 'basic-front-back'
INSERT INTO public.card_type_templates (card_type_code, template_code, role)
VALUES 
('basic-front-back', 'ST-0000001', 'front'),
('basic-front-back', 'ST-0000002', 'back')
ON CONFLICT DO NOTHING;
