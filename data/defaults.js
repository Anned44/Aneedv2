/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ANDINET V2 — defaults.js
   Seeds, frases y datos de ejemplo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const AndinetDefaults = {

  frases: [
    "La vida no es la que uno vivió, sino la que uno recuerda.",
    "Crea como si nadie fuera a leer.",
    "El caos es el origen de toda danza que brilla.",
    "Habita tu vida como si fuera una obra que construyes con calma.",
    "Lo que se escribe en silencio dura más.",
    "No toda claridad nace del orden. Algunas cosas se entienden viviéndolas.",
    "El tiempo no se administra. Se habita.",
    "Escribe lo que temes olvidar.",
    "La disciplina es una forma de amor propio.",
    "Hay días en que el solo hecho de continuar es suficiente.",
    "Construye despacio. Las cosas sólidas no tienen prisa.",
    "Tu sistema personal es un reflejo de cómo te tratas a ti mismo.",
    "No todo tiene que ser útil para tener valor.",
    "La atención es el recurso más escaso.",
    "Un día sin crear es un día sin vivir del todo.",
  ],

  temas: [
    {
      id: 'noche',
      nombre: 'Noche',
      swatches: ['#0c0a12', '#7a5c9a', '#9b7ab8', '#5a4f70'],
    },
    {
      id: 'alba',
      nombre: 'Alba',
      swatches: ['#0d0c10', '#8060aa', '#a882d0', '#5c5270'],
    },
    {
      id: 'carbono',
      nombre: 'Carbono',
      swatches: ['#0a0a0a', '#333', '#999', '#484848'],
    },
    {
      id: 'bosque',
      nombre: 'Bosque',
      swatches: ['#080e0a', '#5a8a5a', '#7ab87a', '#486048'],
    },
    {
      id: 'tinta',
      nombre: 'Tinta',
      swatches: ['#080a10', '#4a6aaa', '#6a8acc', '#404860'],
    },
    {
      id: 'ember',
      nombre: 'Ember',
      swatches: ['#0e0a08', '#aa6a40', '#cc8a60', '#6a5048'],
    },
  ],

  fuentes: [
    {
      id: 'cormorant',
      nombre: 'Cormorant',
      sample: 'Ανδρέα',
      serif: "'Cormorant Garamond', Georgia, serif",
      par: 'Geist Mono · Geist',
    },
    {
      id: 'playfair',
      nombre: 'Playfair',
      sample: 'Ανδρέα',
      serif: "'Playfair Display', Georgia, serif",
      par: 'Geist Mono · Geist',
      url: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,300;1,400&display=swap",
    },
    {
      id: 'lora',
      nombre: 'Lora',
      sample: 'Ανδρέα',
      serif: "'Lora', Georgia, serif",
      par: 'Geist Mono · Geist',
      url: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;1,300;1,400&display=swap",
    },
    {
      id: 'eb-garamond',
      nombre: 'EB Garamond',
      sample: 'Ανδρέα',
      serif: "'EB Garamond', Georgia, serif",
      par: 'Geist Mono · Geist',
      url: "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;1,300;1,400&display=swap",
    },
  ],

  texturas: [
    { id: 'none',  nombre: 'Sin textura' },
    { id: 'grain', nombre: 'Grain' },
    { id: 'grid',  nombre: 'Grid' },
    { id: 'dots',  nombre: 'Puntos' },
    { id: 'lines', nombre: 'Líneas' },
    { id: 'image', nombre: 'Imagen' },
  ],

  proyectosEjemplo: [
    {
      id: 'p-demo-1',
      emoji: '◈',
      title: 'Andinet v2',
      description: 'Refactorización del sistema personal con arquitectura modular y mejor UX.',
      status: 'activo',
      area: 'estudio',
      color: '#7a5c9a',
      progress: 45,
      tags: ['diseño', 'código', 'sistema'],
      props: { inicio: '2026-04-10', deadline: null, links: [] },
      notes: '',
      kanban: [
        { id: 'k1', name: 'Ideas', cards: [] },
        { id: 'k2', name: 'En progreso', cards: [] },
        { id: 'k3', name: 'Revisión', cards: [] },
        { id: 'k4', name: 'Hecho', cards: [] },
      ],
      pages: [],
    },
  ],

};

window.AndinetDefaults = AndinetDefaults;
