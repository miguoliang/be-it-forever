export const DEFAULT_CARD_TEMPLATES = {
  front: `<div class="flex flex-col items-center justify-center h-full">
  <h2 class="text-8xl font-bold mb-8">{{name}}</h2>
  <div class="flex gap-4 mb-8">
    <button class="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:scale-110 transition" onclick="window.speak('{{name}}', 'en-US')">US Speaker</button>
    <button class="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:scale-110 transition" onclick="window.speak('{{name}}', 'en-GB')">UK Speaker</button>
  </div>
  <p class="text-2xl text-muted-foreground">Click or swipe to see answer</p>
</div>`,
  back: `<div class="flex flex-col items-center justify-center h-full">
  <div class="flex items-center gap-6 mb-8">
    <p class="text-7xl font-bold text-primary text-center">{{description}}</p>
  </div>
  {{#if metadata.phonetic}}
  <p class="text-3xl text-muted-foreground mb-4">/{{metadata.phonetic}}/</p>
  {{/if}}
  <p class="text-xl text-muted-foreground">Please rate this card</p>
</div>`
};
