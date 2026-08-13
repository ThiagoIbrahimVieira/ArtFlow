import { Type, Schema } from '@google/genai';

export const createPaletteDeclaration = {
  name: 'create_palette',
  description: 'Gera uma paleta de cores artística profissional, estruturada e harmoniosa com papéis composicionais e dicas de uso.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      paletteName: {
        type: Type.STRING,
        description: 'Nome evocativo e artístico para a paleta (ex: Chuva Cyberpunk, Névoa Medieval, Pôr do Sol Dourado)',
      },
      description: {
        type: Type.STRING,
        description: 'Breve nota explicativa sobre a luz, clima e interação entre as cores (1 a 2 frases)',
      },
      harmony: {
        type: Type.STRING,
        description: 'Tipo de harmonia de teoria das cores (ex: Análoga, Complementar Dividida, Triádica, Monocromática Quente)',
      },
      colors: {
        type: Type.ARRAY,
        description: 'Lista de cores exata solicitada (entre 3 e 8 cores).',
        items: {
          type: Type.OBJECT,
          properties: {
            hex: {
              type: Type.STRING,
              description: 'Código hexadecimal de 6 dígitos em maiúsculo iniciado por # (ex: #143A52, #FF2DAA)',
            },
            name: {
              type: Type.STRING,
              description: 'Nome expressivo da cor (ex: Asfalto Molhado, Brilho Neon Ciano)',
            },
            role: {
              type: Type.STRING,
              description: 'Papel na composição (ex: Sombra Primária, Tom Médio de Atmosfera, Luz Principal, Ponto Focal)',
            },
          },
          required: ['hex', 'name', 'role'],
        },
      },
      usageTips: {
        type: Type.ARRAY,
        description: 'Dicas práticas de aplicação e distribuição dos valores tonais.',
        items: { type: Type.STRING },
      },
      contrastNotes: {
        type: Type.ARRAY,
        description: 'Sugestões de leitura visual e contraste focal.',
        items: { type: Type.STRING },
      },
    },
    required: ['paletteName', 'description', 'harmony', 'colors', 'usageTips'],
  } as Schema,
};

export const getProjectContextDeclaration = {
  name: 'get_project_context',
  description: 'Consulta o contexto de um projeto de arte do usuário autenticado no ArtFlow (título, categoria, descrição, progresso).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      projectId: {
        type: Type.STRING,
        description: 'ID do projeto no ArtFlow',
      },
    },
    required: ['projectId'],
  } as Schema,
};
