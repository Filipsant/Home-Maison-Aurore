import { cva } from 'class-variance-authority'

/** Cor do placeholder (Figma: "Foto", tons Musselina, Veludo e Lilás). */
export const photoToneVariants = cva('', {
  variants: {
    tone: {
      musselina: 'bg-musselina',
      lilas: 'bg-lilas',
      veludo: 'bg-veludo',
      'veludo-2': 'bg-veludo-2',
    },
  },
  defaultVariants: { tone: 'musselina' },
})

/** Cor da legenda sobre cada tom (contraste mínimo de 4,5:1). */
export const captionToneVariants = cva('', {
  variants: {
    tone: {
      musselina: 'text-grafite',
      lilas: 'text-grafite',
      veludo: 'text-nevoa',
      'veludo-2': 'text-texto-suave-escuro',
    },
  },
  defaultVariants: { tone: 'musselina' },
})

/** Cor do bloco que abre antes da imagem (cortina de cor, padrão E15 do estudo). */
export const curtainVariants = cva('', {
  variants: {
    tone: {
      musselina: 'bg-lilas',
      lilas: 'bg-musselina',
      veludo: 'bg-veludo-2',
      'veludo-2': 'bg-veludo',
    },
  },
  defaultVariants: { tone: 'musselina' },
})
